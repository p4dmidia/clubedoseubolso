-- SCRIPT DEFINITIVO DE CORREÇÃO DE COMISSÕES - CLASSE A
-- Instrução: Copie todo este código e rode no SQL Editor do seu Supabase.

-- 1. Garante que as configurações de usuários existam (previne erro de atualização de saldo)
INSERT INTO public.user_settings (user_id, organization_id)
SELECT id, organization_id FROM public.user_profiles
ON CONFLICT (user_id) DO NOTHING;

-- 2. Atualizar a função de Distribuição de Comissões
CREATE OR REPLACE FUNCTION public.distribute_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_affiliate RECORD;
    v_current_sponsor_id uuid;
    v_config RECORD;
    v_commission_amount numeric;
    v_gen_count integer := 0;
    v_active_gens integer;
    v_target_user_id uuid;
    v_is_master boolean := false;
    v_config_key text;
BEGIN
    -- Só processa se o status mudar para 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Evita processamento duplicado
        IF EXISTS (SELECT 1 FROM public.commissions WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- A. Identificar tipo de Consórcio (Master vs Livre Escolha)
        SELECT EXISTS (
            SELECT 1 FROM public.order_items oi
            JOIN public.products p ON oi.product_id = p.id
            LEFT JOIN public.product_categories pc ON p.category_id = pc.id
            WHERE oi.order_id = NEW.id
            AND (p.name ILIKE '%Colchão%' OR pc.name ILIKE '%Colchão%')
        ) INTO v_is_master;

        v_config_key := CASE WHEN v_is_master THEN 'mattress' ELSE 'geral' END;

        -- B. Buscar Configurações (respeita o painel administrativo)
        SELECT * INTO v_config FROM public.commission_configs WHERE key = v_config_key;
        
        IF v_config IS NULL THEN
            SELECT * INTO v_config FROM public.commission_configs WHERE key = 'geral';
        END IF;

        IF v_config IS NULL THEN
            RETURN NEW;
        END IF;

        v_active_gens := v_config.active_generations;

        -- C. Identificar o Afiliado que indicou a venda (Geração 1)
        
        -- Prioridade 1: Código de referência no pedido (ignora maiúsculas/minúsculas)
        IF NEW.referral_code IS NOT NULL AND NEW.referral_code != '' THEN
            SELECT * INTO v_affiliate FROM public.affiliates 
            WHERE LOWER(referral_code) = LOWER(NEW.referral_code) 
            AND organization_id = NEW.organization_id
            AND (
                NEW.organization_id != '5111af72-27a5-41fd-8ed9-8c51b78b4fdd' -- Outros sistemas funcionam normal
                OR user_id != NEW.user_id                                    -- Classe A: ignora se for o próprio comprador
            )
            LIMIT 1;
        END IF;

        -- Prioridade 2: Patrocinador do comprador (caso logado/cliente antigo)
        IF v_affiliate IS NULL AND NEW.user_id IS NOT NULL THEN
            SELECT a.* INTO v_affiliate 
            FROM public.affiliates a
            JOIN public.user_profiles p ON p.sponsor_id = a.user_id
            WHERE p.id = NEW.user_id 
            AND a.organization_id = NEW.organization_id
            AND (
                NEW.organization_id != '5111af72-27a5-41fd-8ed9-8c51b78b4fdd' -- Outros sistemas funcionam normal
                OR a.user_id != NEW.user_id                                  -- Classe A: evita auto-patrocínio
            )
            LIMIT 1;
        END IF;

        -- Se não achou nenhum afiliado, não há comissão a distribuir
        IF v_affiliate IS NULL THEN
            RETURN NEW;
        END IF;

        -- Inicia a subida da rede a partir do afiliado encontrado (nível 1)
        v_current_sponsor_id := v_affiliate.id;

        -- D. Distribuir pelos Níveis (Loop da Rede)
        WHILE v_gen_count < v_active_gens AND v_current_sponsor_id IS NOT NULL LOOP
            v_gen_count := v_gen_count + 1;
            
            -- Busca a porcentagem definida para este nível específico no JSON da config
            SELECT (lvl->>'value')::numeric INTO v_commission_amount
            FROM jsonb_array_elements(v_config.levels) AS lvl
            WHERE (lvl->>'level')::integer = v_gen_count;

            IF v_commission_amount IS NOT NULL AND v_commission_amount > 0 THEN
                
                -- Calcula o valor em dinheiro
                IF v_config.type = 'percent' THEN
                    v_commission_amount := NEW.total_amount * (v_commission_amount / 100);
                END IF;

                -- Pega o user_id do patrocinador atual para creditar o saldo
                SELECT user_id INTO v_target_user_id FROM public.affiliates WHERE id = v_current_sponsor_id;

                IF v_target_user_id IS NOT NULL THEN
                    -- Crédito de Saldo (User Settings / Carteira)
                    UPDATE public.user_settings 
                    SET 
                        total_earnings = total_earnings + v_commission_amount,
                        available_balance = available_balance + v_commission_amount,
                        updated_at = now()
                    WHERE user_id = v_target_user_id;

                    -- Registro no Histórico de Comissões
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
                        v_config.type,
                        'Comissão ' || v_config_key || ' Geração ' || v_gen_count || ' - Pedido ' || NEW.id
                    );
                END IF;
            END IF;

            -- Sobe um degrau na árvore (Pega o patrocinador do patrocinador atual)
            SELECT sponsor_id INTO v_current_sponsor_id 
            FROM public.affiliates 
            WHERE id = v_current_sponsor_id 
            AND organization_id = NEW.organization_id;
            
            -- Break de segurança
            IF v_gen_count > 50 THEN EXIT; END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Ativar/Recriar o Gatilho (Trigger) na tabela de Pedidos
DROP TRIGGER IF EXISTS trigger_distribute_commissions ON public.orders;
CREATE TRIGGER trigger_distribute_commissions
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.distribute_commissions();

-- 4. COMANDO DE RECUPERAÇÃO PARA O PEDIDO ORD-6756
-- (Simula o pagamento para disparar as comissões que faltaram)
UPDATE public.orders 
SET status = 'Pendente' 
WHERE id = 'ORD-6756' AND status = 'Pago';

UPDATE public.orders 
SET status = 'Pago' 
WHERE id = 'ORD-6756';
