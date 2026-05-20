-- SCRIPT DE MIGRAÇÃO - COMISSÕES E MMN DINÂMICOS CLUBE DO SEU BOLSO
-- Instrução: Execute este script no SQL Editor do seu painel do Supabase.

-- 1. Inserir configurações padrão para Adesão e Mensalidade se não existirem
INSERT INTO public.commission_configs (key, type, active_generations, levels, organization_id)
VALUES 
(
    'plan_adesao', 
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
),
(
    'plan_mensal', 
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

-- 2. Atualizar a função de Distribuição de Comissões para ser 100% dinâmica
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

            -- A. PRODUTO É UM PLANO DE ASSINATURA
            IF v_category_name = 'Planos' OR v_product.name ILIKE '%Telemedicina%' THEN
                
                -- Verificar se é uma mensalidade (recorrência) ou adesão (primeira compra)
                -- É recorrência se o usuário já tiver outro pedido pago de plano no passado
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
                    -- Pega o valor da comissão mensal configurado nas variações do plano
                    v_base_commission_pool := COALESCE((v_product.variations->>'comissao_mensal')::numeric, 0);
                    v_config_key := 'plan_mensal';
                ELSE
                    -- Pega o valor da comissão de adesão configurado nas variações do plano
                    v_base_commission_pool := COALESCE((v_product.variations->>'comissao_adesao')::numeric, 0);
                    v_config_key := 'plan_adesao';
                END IF;

            -- B. PRODUTO É DO CATÁLOGO GERAL
            ELSE
                -- Para produtos normais, a base de comissão é o total do item
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
                        -- Para tipo 'percent' (porcentagem), aplica a taxa sobre a base de comissão do produto/item
                        v_commission_amount := v_base_commission_pool * (v_level_rate / 100.0);
                    ELSE
                        -- Para tipo 'money' (valor fixo), multiplica a taxa pela quantidade comprada
                        v_commission_amount := v_level_rate * v_item.quantity;
                    END IF;

                    IF v_commission_amount > 0 THEN
                        -- Obter o patrocinador deste nível
                        v_target_user_id := NULL;
                        v_sponsor_is_active := false;
                        v_sponsor_is_delinquent := false;

                        SELECT user_id INTO v_target_user_id FROM public.affiliates WHERE id = v_current_sponsor_id;

                        IF v_target_user_id IS NOT NULL THEN
                            SELECT is_active, is_delinquent 
                            INTO v_sponsor_is_active, v_sponsor_is_delinquent 
                            FROM public.user_profiles 
                            WHERE id = v_target_user_id;

                            -- Regra de atividade/inadimplência: se inativo/inadimplente, comissão sobe para o Master
                            IF v_sponsor_is_active = false OR v_sponsor_is_delinquent = true THEN
                                v_target_user_id := v_master_user_id;
                                v_description := 'Comissão MMN (Redirecionada ao Master devido a Patrocinador inativo) - Geração ' || v_gen_count || ' - ' || v_item.product_name || ' (Pedido ' || NEW.id || ')';
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

-- 3. Recriar gatilho na tabela orders
DROP TRIGGER IF EXISTS trigger_distribute_commissions ON public.orders;
CREATE TRIGGER trigger_distribute_commissions
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.distribute_commissions();
