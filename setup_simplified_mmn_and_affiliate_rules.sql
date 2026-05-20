-- SCRIPT DE MIGRAÇÃO - REGRAS MMN SIMPLIFICADAS E REQUISITOS DE ATIVIDADE
-- Instrução: Execute este script no SQL Editor do seu painel do Supabase.

-- 1. Limpar configurações de planos antigas e inserir a nova chave unificada 'planos'
DELETE FROM public.commission_configs WHERE key IN ('plan_adesao', 'plan_mensal');

INSERT INTO public.commission_configs (key, type, active_generations, levels, organization_id)
VALUES (
    'planos', 
    'percent', 
    7, 
    '[
        {"level": 1, "value": 100}, 
        {"level": 2, "value": 0}, 
        {"level": 3, "value": 0}, 
        {"level": 4, "value": 0}, 
        {"level": 5, "value": 0}, 
        {"level": 6, "value": 0}, 
        {"level": 7, "value": 0}
    ]'::jsonb, 
    '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid
)
ON CONFLICT (key) DO NOTHING;

-- 2. Atualizar gatilho de criação de usuário (handle_new_affiliate_user)
CREATE OR REPLACE FUNCTION public.handle_new_affiliate_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 AS $function$
 DECLARE
   v_full_name text;
   v_sponsor_affiliate_id uuid;
   v_sponsor_user_id uuid;
   v_org_id uuid;
   v_sponsor_code text;
   v_login text;
   v_role text;
   v_maintenance_date timestamp with time zone;
 BEGIN
   -- Determinar login e nome
   v_login := COALESCE(new.raw_user_meta_data ->> 'login', split_part(new.email, '@', 1));
   v_full_name := TRIM(CONCAT_WS(' ', new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'sobrenome'));
   IF v_full_name = '' THEN v_full_name := v_login; END IF;

   -- Determinar Organização
   BEGIN
     v_org_id := NULLIF(new.raw_user_meta_data ->> 'organization_id', '')::uuid;
   EXCEPTION WHEN OTHERS THEN
     v_org_id := NULL;
   END;

   IF v_org_id IS NULL THEN
      SELECT id INTO v_org_id FROM public.organizations WHERE name = 'Classe A' LIMIT 1;
   END IF;
   IF v_org_id IS NULL THEN
      v_org_id := '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid;
   END IF;

   -- Resolver Padrinho (Sponsor)
   v_sponsor_code := NULLIF(new.raw_user_meta_data ->> 'sponsor_code', '');
   
   IF v_sponsor_code IS NOT NULL THEN
     SELECT id, user_id INTO v_sponsor_affiliate_id, v_sponsor_user_id
     FROM public.affiliates 
     WHERE LOWER(referral_code) = LOWER(v_sponsor_code)
     AND organization_id = v_org_id
     LIMIT 1;
   END IF;

   -- Fallback: Se não houver patrocinador, vincula ao primeiro afiliado criado da organização
   IF v_sponsor_user_id IS NULL THEN
     SELECT id, user_id INTO v_sponsor_affiliate_id, v_sponsor_user_id
     FROM public.affiliates
     WHERE organization_id = v_org_id
     ORDER BY created_at ASC
     LIMIT 1;
   END IF;

   v_role := COALESCE(new.raw_user_meta_data ->> 'role', 'affiliate');
   
   -- Afiliados ganham 30 dias grátis de ativação por padrão
   IF v_role = 'affiliate' THEN
     v_maintenance_date := now() + interval '30 days';
   ELSE
     v_maintenance_date := NULL;
   END IF;

   -- Criar Perfil do Usuário
   BEGIN
     INSERT INTO public.user_profiles (
       id, email, role, full_name, login, 
       whatsapp, cpf, cnpj, registration_type, 
       organization_id, sponsor_id, referrer_id,
       status, rank, is_active, is_delinquent, maintenance_expires_at, created_at, updated_at
     ) VALUES (
       new.id, new.email, v_role, v_full_name, v_login,
       new.raw_user_meta_data ->> 'whatsapp',
       new.raw_user_meta_data ->> 'cpf',
       new.raw_user_meta_data ->> 'cnpj',
       new.raw_user_meta_data ->> 'registration_type',
       v_org_id, v_sponsor_user_id, v_sponsor_user_id, 
       'active', 'Consultor', true, false, v_maintenance_date, new.created_at, new.created_at
     );
   EXCEPTION WHEN OTHERS THEN 
     NULL; -- Segue de forma resiliente
   END;

   -- Criar Registro na tabela Affiliates
   BEGIN
     INSERT INTO public.affiliates (
       user_id, email, full_name, referral_code, 
       whatsapp, cpf, cnpj, organization_id, sponsor_id, 
       is_active, is_delinquent, maintenance_expires_at, created_at, updated_at
     ) VALUES (
       new.id, new.email, v_full_name, v_login,
       new.raw_user_meta_data ->> 'whatsapp',
       new.raw_user_meta_data ->> 'cpf',
       new.raw_user_meta_data ->> 'cnpj',
       v_org_id, v_sponsor_affiliate_id, 
       true, false, v_maintenance_date, new.created_at, new.created_at
     );
   EXCEPTION WHEN OTHERS THEN 
     NULL;
   END;

   -- Criar Configurações Iniciais de Saldo
   BEGIN
     INSERT INTO public.user_settings (user_id, organization_id, created_at, updated_at)
     VALUES (new.id, v_org_id, new.created_at, new.created_at);
   EXCEPTION WHEN OTHERS THEN 
     NULL; 
   END;
   
   RETURN new;
 END;
 $function$;

-- 3. Atualizar a função de Distribuição de Comissões para unificar e aplicar nova regra de qualificação
CREATE OR REPLACE FUNCTION public.distribute_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_product RECORD;
    v_affiliate RECORD;
    v_master_affiliate_id uuid;
    v_master_user_id uuid;
    v_current_sponsor_id uuid;
    v_target_user_id uuid;
    
    v_config RECORD;
    v_config_key text;
    v_base_commission_pool numeric;
    v_commission_amount numeric;
    v_level_rate numeric;
    
    v_is_renewal boolean;
    v_gen_count integer;
    v_active_gens integer;
    
    v_sponsor_is_active boolean;
    v_sponsor_is_delinquent boolean;
    v_sponsor_is_qualified boolean;
    v_description text;
    v_category_name text;
BEGIN
    -- Só processa se o status mudar para 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Evita processamento de comissão duplicado para o mesmo pedido
        IF EXISTS (SELECT 1 FROM public.commissions WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- Buscar o afiliado que indicou a venda (Geração 1)
        -- Prioridade 1: Código de referência no pedido (ignora case)
        IF NEW.referral_code IS NOT NULL AND NEW.referral_code != '' THEN
            SELECT * INTO v_affiliate FROM public.affiliates 
            WHERE LOWER(referral_code) = LOWER(NEW.referral_code) 
              AND organization_id = NEW.organization_id
            LIMIT 1;
        END IF;

        -- Prioridade 2: Patrocinador registrado no perfil do comprador
        IF v_affiliate IS NULL AND NEW.user_id IS NOT NULL THEN
            SELECT a.* INTO v_affiliate 
            FROM public.affiliates a
            JOIN public.user_profiles p ON p.sponsor_id = a.user_id
            WHERE p.id = NEW.user_id 
              AND a.organization_id = NEW.organization_id
            LIMIT 1;
        END IF;

        -- Se não achou nenhum afiliado na rede, não distribui comissão
        IF v_affiliate IS NULL THEN
            RETURN NEW;
        END IF;

        -- Buscar o ID Master da organização para redundância (caso um patrocinador esteja inativo)
        SELECT id, user_id INTO v_master_affiliate_id, v_master_user_id 
        FROM public.affiliates 
        WHERE organization_id = NEW.organization_id 
          AND (referral_code = 'master' OR sponsor_id IS NULL)
        ORDER BY created_at ASC 
        LIMIT 1;

        IF v_master_user_id IS NULL THEN
            SELECT id, user_id INTO v_master_affiliate_id, v_master_user_id 
            FROM public.affiliates 
            WHERE organization_id = NEW.organization_id
            ORDER BY created_at ASC 
            LIMIT 1;
        END IF;

        -- Iterar sobre os itens do pedido
        FOR v_item IN 
            SELECT product_id, product_name, unit_price, quantity 
            FROM public.order_items 
            WHERE order_id = NEW.id 
        LOOP
            -- Carregar dados do produto
            SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id;
            
            IF v_product IS NULL THEN
                CONTINUE;
            END IF;

            -- Buscar nome da categoria
            SELECT name INTO v_category_name 
            FROM public.product_categories 
            WHERE id = v_product.category_id;

            -- Inicializar valores
            v_base_commission_pool := 0;
            v_is_renewal := false;

            -- A. PRODUTO É UM PLANO DE ASSINATURA (Categoria 'Planos' ou nome parecido)
            IF v_category_name = 'Planos' OR v_product.name ILIKE '%Telemedicina%' THEN
                
                -- Verificar se é uma mensalidade (recorrência) ou adesão (primeira compra)
                SELECT EXISTS (
                    SELECT 1 
                    FROM public.order_items oi
                    JOIN public.orders o ON oi.order_id = o.id
                    JOIN public.products p ON oi.product_id = p.id
                    LEFT JOIN public.product_categories pc ON p.category_id = pc.id
                    WHERE o.user_id = NEW.user_id
                      AND o.status = 'Pago'
                      AND o.id != NEW.id
                      AND (pc.name = 'Planos' OR p.name ILIKE '%Telemedicina%')
                ) INTO v_is_renewal;

                IF v_is_renewal THEN
                    -- Comissão mensal das recorrências
                    v_base_commission_pool := COALESCE((v_product.variations->>'comissao_mensal')::numeric, 0);
                ELSE
                    -- Comissão de adesão da primeira compra
                    v_base_commission_pool := COALESCE((v_product.variations->>'comissao_adesao')::numeric, 0);
                END IF;

                v_config_key := 'planos'; -- Configuração unificada de planos

            -- B. PRODUTO É DO CATÁLOGO GERAL ou DE ATIVAÇÃO EVA
            ELSE
                -- Tratamento específico para produtos que ativam a manutenção (EVA)
                IF v_item.product_id IN ('d3b07384-d113-4171-bc05-9a7c936df312', 'd3b07384-d113-4171-bc06-9a7c936df312') THEN
                    -- Estende a manutenção do afiliado
                    IF v_item.product_id = 'd3b07384-d113-4171-bc05-9a7c936df312' THEN
                        -- Adesão EVA
                        UPDATE public.affiliates
                        SET is_active = true, is_delinquent = false, maintenance_expires_at = now() + interval '30 days', updated_at = now()
                        WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id;

                        UPDATE public.user_profiles
                        SET is_active = true, is_delinquent = false, maintenance_expires_at = now() + interval '30 days', updated_at = now()
                        WHERE id = NEW.user_id AND organization_id = NEW.organization_id;
                    ELSE
                        -- Renovação EVA
                        UPDATE public.affiliates
                        SET is_active = true, is_delinquent = false,
                            maintenance_expires_at = CASE 
                                WHEN maintenance_expires_at IS NULL OR maintenance_expires_at < now() THEN now() + interval '30 days'
                                ELSE maintenance_expires_at + interval '30 days'
                            END,
                            updated_at = now()
                        WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id;

                        UPDATE public.user_profiles
                        SET is_active = true, is_delinquent = false,
                            maintenance_expires_at = CASE 
                                WHEN maintenance_expires_at IS NULL OR maintenance_expires_at < now() THEN now() + interval '30 days'
                                ELSE maintenance_expires_at + interval '30 days'
                            END,
                            updated_at = now()
                        WHERE id = NEW.user_id AND organization_id = NEW.organization_id;
                    END IF;
                END IF;

                -- Para produtos normais e EVA, a base de comissão é o total do item
                v_base_commission_pool := v_item.unit_price * v_item.quantity;
                v_config_key := 'geral';
            END IF;

            -- Carregar a configuração de comissões correspondente
            SELECT * INTO v_config FROM public.commission_configs WHERE key = v_config_key;
            
            IF v_config IS NULL THEN
                SELECT * INTO v_config FROM public.commission_configs WHERE key = 'geral';
            END IF;

            -- Se não houver configuração ativa ou pool for zero, pula
            IF v_config IS NULL OR v_base_commission_pool <= 0 THEN
                CONTINUE;
            END IF;

            v_active_gens := v_config.active_generations;
            v_gen_count := 0;
            v_current_sponsor_id := v_affiliate.id;

            -- Subir a rede de patrocinadores e distribuir comissões
            WHILE v_gen_count < v_active_gens AND v_current_sponsor_id IS NOT NULL LOOP
                v_gen_count := v_gen_count + 1;

                -- Obter taxa configurada para esta geração
                SELECT (lvl->>'value')::numeric INTO v_level_rate
                FROM jsonb_array_elements(v_config.levels) AS lvl
                WHERE (lvl->>'level')::integer = v_gen_count;

                IF v_level_rate IS NOT NULL AND v_level_rate > 0 THEN
                    -- Calcular o valor da comissão para esta geração
                    IF v_config.type = 'percent' THEN
                        v_commission_amount := v_base_commission_pool * (v_level_rate / 100.0);
                    ELSE
                        v_commission_amount := v_level_rate * v_item.quantity;
                    END IF;

                    IF v_commission_amount > 0 THEN
                        v_target_user_id := NULL;
                        v_sponsor_is_qualified := false;

                        SELECT user_id INTO v_target_user_id FROM public.affiliates WHERE id = v_current_sponsor_id;

                        IF v_target_user_id IS NOT NULL THEN
                            -- Regra de Qualificação:
                            -- 1. Deve estar ativo e não-inadimplente de forma geral.
                            -- 2. Deve ter manutenção não expirada OR ter indicado pelo menos 1 cliente nos últimos 30 dias.
                            -- 3. Contas Admin Master e Admin Op são consideradas qualificadas por padrão se ativas.
                            SELECT 
                                (is_active = true AND is_delinquent = false AND (role = 'admin_master' OR role = 'admin_op' OR maintenance_expires_at IS NULL OR maintenance_expires_at >= now())) OR
                                EXISTS (
                                    SELECT 1 FROM public.user_profiles cp
                                    WHERE cp.sponsor_id = v_target_user_id
                                      AND cp.role = 'client'
                                      AND cp.created_at >= now() - interval '30 days'
                                )
                            INTO v_sponsor_is_qualified
                            FROM public.user_profiles 
                            WHERE id = v_target_user_id;

                            -- Se não estiver qualificado, a comissão sobe para o Master
                            IF v_sponsor_is_qualified = false THEN
                                v_target_user_id := v_master_user_id;
                                v_description := 'Comissão MMN (Redirecionada ao Master devido a Patrocinador inativo/desqualificado) - Geração ' || v_gen_count || ' - ' || v_item.product_name || ' (Pedido ' || NEW.id || ')';
                            ELSE
                                v_description := 'Comissão MMN - Geração ' || v_gen_count || ' - ' || v_item.product_name || ' (Pedido ' || NEW.id || ')';
                            END IF;

                            -- Garantir registro na tabela user_settings (carteira)
                            INSERT INTO public.user_settings (user_id, organization_id, total_earnings, available_balance, frozen_balance, is_active_this_month, created_at, updated_at)
                            VALUES (v_target_user_id, NEW.organization_id, 0, 0, 0, true, now(), now())
                            ON CONFLICT (user_id) DO NOTHING;

                            -- Creditar saldo na carteira
                            UPDATE public.user_settings 
                            SET 
                                total_earnings = total_earnings + v_commission_amount,
                                available_balance = available_balance + v_commission_amount,
                                updated_at = now()
                            WHERE user_id = v_target_user_id;

                            -- Registrar no histórico de comissões
                            INSERT INTO public.commissions (
                                organization_id,
                                user_id,
                                order_id,
                                amount,
                                level,
                                commission_type,
                                description
                            ) VALUES (
                                NEW.organization_id,
                                v_target_user_id,
                                NEW.id,
                                v_commission_amount,
                                v_gen_count,
                                v_config_key,
                                v_description
                            );
                        END IF;
                    END IF;
                END IF;

                -- Obter patrocinador do nível acima
                SELECT sponsor_id INTO v_current_sponsor_id 
                FROM public.affiliates 
                WHERE id = v_current_sponsor_id 
                  AND organization_id = NEW.organization_id;
                
                -- Break de segurança
                IF v_gen_count > 50 THEN EXIT; END IF;
            END LOOP;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Atualizar a rotina de cron para verificação de inadimplência dos afiliados
CREATE OR REPLACE FUNCTION public.processar_inadimplencia_diaria()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    afiliado RECORD;
    qtd_congelados INTEGER := 0;
BEGIN
    RAISE LOG 'Iniciando processamento de inadimplência diária: %', now();

    FOR afiliado IN 
        SELECT id, email 
        FROM public.user_profiles 
        WHERE role = 'affiliate' 
          AND is_delinquent = false
          AND (maintenance_expires_at IS NOT NULL AND maintenance_expires_at < now())
          -- NÃO indicou nenhum cliente novo nos últimos 30 dias
          AND NOT EXISTS (
              SELECT 1 FROM public.user_profiles cp
              WHERE cp.sponsor_id = user_profiles.id
                AND cp.role = 'client'
                AND cp.created_at >= now() - interval '30 days'
          )
    LOOP
        -- Atualiza o status para inadimplente/delinquent
        UPDATE public.user_profiles
        SET is_delinquent = true
        WHERE id = afiliado.id;

        UPDATE public.affiliates
        SET is_delinquent = true
        WHERE user_id = afiliado.id;

        qtd_congelados := qtd_congelados + 1;
        
        -- Inserir log de auditoria
        INSERT INTO public.admin_audit_logs (action_type, target_id, details)
        VALUES ('auto_freeze_affiliate', afiliado.id, jsonb_build_object('reason', 'subscription_expired_and_no_client_referred', 'email', afiliado.email));
    END LOOP;

    RAISE LOG 'Processamento concluído. Total de afiliados congelados: %', qtd_congelados;
END;
$$;
