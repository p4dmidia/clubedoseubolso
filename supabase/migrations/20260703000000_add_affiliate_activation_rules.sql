-- Migration: Add affiliate activation rules, active_until and is_blocked_withdrawal columns, and update distribute_commissions function
-- Path: supabase/migrations/20260703000000_add_affiliate_activation_rules.sql

-- 1. Add active_until column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS active_until timestamp with time zone;

COMMENT ON COLUMN public.user_settings.active_until IS 'Data limite em que o afiliado está ativo mensalmente no sistema';

-- 2. Add is_blocked_withdrawal column to withdrawals
ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS is_blocked_withdrawal boolean DEFAULT false;

COMMENT ON COLUMN public.withdrawals.is_blocked_withdrawal IS 'Indica se a solicitação de saque foi originada de saldo bloqueado, exigindo dedução de taxa de R$ 17,00';

-- 3. Create is_affiliate_active function
CREATE OR REPLACE FUNCTION public.is_affiliate_active(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
    v_created_at timestamp with time zone;
    v_has_recent_referral boolean;
    v_active_until timestamp with time zone;
BEGIN
    -- 1. Obter a data de criação do afiliado
    SELECT created_at INTO v_created_at FROM public.affiliates WHERE user_id = p_user_id;
    IF v_created_at IS NULL THEN
        RETURN false;
    END IF;

    -- Primeiros 30 dias após cadastro são considerados ativos (onboarding grátis)
    IF now() < v_created_at + interval '30 days' THEN
        RETURN true;
    END IF;

    -- 2. Verificar se há uma ativação manual ativa (campo active_until no futuro)
    SELECT active_until INTO v_active_until FROM public.user_settings WHERE user_id = p_user_id;
    IF v_active_until IS NOT NULL AND now() < v_active_until THEN
        RETURN true;
    END IF;

    -- 3. Verificar se indicou pelo menos 1 assinante (cliente) nos últimos 30 dias
    -- user_profiles.sponsor_id armazena o user_id do patrocinador
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE sponsor_id = p_user_id
          AND role = 'client'
          AND created_at >= now() - interval '30 days'
    ) INTO v_has_recent_referral;

    RETURN v_has_recent_referral;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update the distribute_commissions trigger function
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
    v_split_status text;
BEGIN
    -- Processar apenas se o status mudar para 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Evitar processamento duplicado
        IF EXISTS (SELECT 1 FROM public.commissions WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- 1. Identificar se é Master/Colchão
        SELECT EXISTS (
            SELECT 1 FROM public.order_items oi
            JOIN public.products p ON oi.product_id = p.id
            LEFT JOIN public.product_categories pc ON p.category_id = pc.id
            WHERE oi.order_id = NEW.id
            AND (p.name ILIKE '%Colchão%' OR pc.name ILIKE '%Colchão%')
        ) INTO v_is_master;

        v_config_key := CASE WHEN v_is_master THEN 'mattress' ELSE 'geral' END;

        -- 2. Obter configuração
        SELECT * INTO v_config FROM public.commission_configs WHERE key = v_config_key;
        
        IF v_config IS NULL THEN
            SELECT * INTO v_config FROM public.commission_configs WHERE key = 'geral';
        END IF;

        IF v_config IS NULL THEN
            RETURN NEW;
        END IF;

        v_active_gens := v_config.active_generations;

        -- 3. Identificar o afiliado inicial (Geração 1)
        IF NEW.referral_code IS NOT NULL AND NEW.referral_code != '' THEN
            SELECT * INTO v_affiliate FROM public.affiliates 
            WHERE LOWER(referral_code) = LOWER(NEW.referral_code) 
            AND organization_id = NEW.organization_id
            LIMIT 1;
        END IF;

        -- Prioridade 2: patrocinador do comprador
        IF v_affiliate IS NULL AND NEW.user_id IS NOT NULL THEN
            SELECT a.* INTO v_affiliate 
            FROM public.affiliates a
            JOIN public.user_profiles p ON p.sponsor_id = a.user_id
            WHERE p.id = NEW.user_id 
            AND a.organization_id = NEW.organization_id
            LIMIT 1;
        END IF;

        -- Se não encontrar afiliador, não há comissão
        IF v_affiliate IS NULL THEN
            RETURN NEW;
        END IF;

        v_current_sponsor_id := v_affiliate.id;

        -- 4. Distribuir pelos níveis
        WHILE v_gen_count < v_active_gens AND v_current_sponsor_id IS NOT NULL LOOP
            v_gen_count := v_gen_count + 1;
            
            -- Encontrar percentual do nível
            SELECT (lvl->>'value')::numeric INTO v_commission_amount
            FROM jsonb_array_elements(v_config.levels) AS lvl
            WHERE (lvl->>'level')::integer = v_gen_count;

            IF v_commission_amount IS NOT NULL AND v_commission_amount > 0 THEN
                
                -- Calcular valor líquido
                IF v_config.type = 'percent' THEN
                    v_commission_amount := NEW.total_amount * (v_commission_amount / 100);
                END IF;

                -- Obter o user_id do afiliado deste nível
                SELECT user_id INTO v_target_user_id FROM public.affiliates WHERE id = v_current_sponsor_id;

                IF v_target_user_id IS NOT NULL THEN
                    v_split_status := NULL;
                    
                    -- Buscar status no split_details se disponível
                    IF NEW.split_details IS NOT NULL THEN
                        SELECT (item->>'status') INTO v_split_status
                        FROM jsonb_array_elements(NEW.split_details) AS item
                        WHERE (item->>'level')::integer = v_gen_count 
                        AND (item->>'user_id')::uuid = v_target_user_id;
                    END IF;

                    -- Fallback dinâmico se split_details for nulo (venda offline/manual ou falha de split)
                    IF v_split_status IS NULL THEN
                        IF public.is_affiliate_active(v_target_user_id) THEN
                            v_split_status := 'traditional_available';
                        ELSE
                            v_split_status := 'held_in_gd_finance';
                        END IF;
                    END IF;

                    -- Se já foi pago diretamente via split no Asaas
                    IF v_split_status = 'split_sent' OR (v_gen_count = 1 AND NEW.split_amount > 0 AND NEW.split_wallet_id IS NOT NULL) THEN
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
                            'Comissão Geração ' || v_gen_count || ' paga automaticamente via Split Asaas - Pedido ' || NEW.id
                        );
                    ELSE
                        -- Fluxo Tradicional (saldo creditado internamente no sistema)
                        IF v_split_status = 'held_in_gd_finance' THEN
                            -- Acumula no saldo bloqueado (frozen_balance)
                            INSERT INTO public.user_settings (user_id, organization_id, total_earnings, frozen_balance)
                            VALUES (v_target_user_id, NEW.organization_id, v_commission_amount, v_commission_amount)
                            ON CONFLICT (user_id) DO UPDATE SET 
                                total_earnings = public.user_settings.total_earnings + v_commission_amount,
                                frozen_balance = public.user_settings.frozen_balance + v_commission_amount,
                                updated_at = now();
                        ELSE
                            -- Acumula no saldo disponível (available_balance)
                            INSERT INTO public.user_settings (user_id, organization_id, total_earnings, available_balance)
                            VALUES (v_target_user_id, NEW.organization_id, v_commission_amount, v_commission_amount)
                            ON CONFLICT (user_id) DO UPDATE SET 
                                total_earnings = public.user_settings.total_earnings + v_commission_amount,
                                available_balance = public.user_settings.available_balance + v_commission_amount,
                                updated_at = now();
                        END IF;

                        -- Logar a comissão
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
                            CASE 
                                WHEN v_split_status = 'held_in_gd_finance' THEN 'Comissão ' || v_config_key || ' Geração ' || v_gen_count || ' (Acumulado via GD Finance) - Pedido ' || NEW.id
                                ELSE 'Comissão ' || v_config_key || ' Geração ' || v_gen_count || ' - Pedido ' || NEW.id
                            END
                        );
                    END IF;
                END IF;
            END IF;

            -- Avançar para o patrocinador do próximo nível
            SELECT sponsor_id INTO v_current_sponsor_id 
            FROM public.affiliates 
            WHERE id = v_current_sponsor_id 
            AND organization_id = NEW.organization_id;
            
            IF v_gen_count > 50 THEN EXIT; END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;
