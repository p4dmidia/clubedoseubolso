-- Migration: Add GD Finance wallet ID to organizations and split_details to orders, and update distribute_commissions trigger function

-- 1. Add column to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS gd_finance_wallet_id text;

COMMENT ON COLUMN public.organizations.gd_finance_wallet_id IS 'ID da carteira Asaas da GD Finance para acumular comissões não distribuídas';

-- 2. Add column to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS split_details jsonb;

COMMENT ON COLUMN public.orders.split_details IS 'Detalhamento dos splits de comissão calculados para cada nível de afiliado';

-- 3. Update the distribute_commissions trigger function
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
    -- Only process if status changed to 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Avoid duplicate processing
        IF EXISTS (SELECT 1 FROM public.commissions WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- 1. Identify product type (Master/Mattress vs Livre Escolha/Geral)
        SELECT EXISTS (
            SELECT 1 FROM public.order_items oi
            JOIN public.products p ON oi.product_id = p.id
            LEFT JOIN public.product_categories pc ON p.category_id = pc.id
            WHERE oi.order_id = NEW.id
            AND (p.name ILIKE '%Colchão%' OR pc.name ILIKE '%Colchão%')
        ) INTO v_is_master;

        v_config_key := CASE WHEN v_is_master THEN 'mattress' ELSE 'geral' END;

        -- 2. Get configuration
        SELECT * INTO v_config FROM public.commission_configs WHERE key = v_config_key;
        
        IF v_config IS NULL THEN
            -- Fallback to 'geral' if specific not found
            SELECT * INTO v_config FROM public.commission_configs WHERE key = 'geral';
        END IF;

        IF v_config IS NULL THEN
            RETURN NEW;
        END IF;

        v_active_gens := v_config.active_generations;

        -- 3. Identify the initial affiliate (the one who referred the sale)
        IF NEW.referral_code IS NOT NULL AND NEW.referral_code != '' THEN
            SELECT * INTO v_affiliate FROM public.affiliates 
            WHERE LOWER(referral_code) = LOWER(NEW.referral_code) 
            AND organization_id = NEW.organization_id
            LIMIT 1;
        END IF;

        -- priority 2: buyer's sponsor
        IF v_affiliate IS NULL AND NEW.user_id IS NOT NULL THEN
            SELECT a.* INTO v_affiliate 
            FROM public.affiliates a
            JOIN public.user_profiles p ON p.sponsor_id = a.user_id
            WHERE p.id = NEW.user_id 
            AND a.organization_id = NEW.organization_id
            LIMIT 1;
        END IF;

        -- If no affiliate found, no commission to distribute
        IF v_affiliate IS NULL THEN
            RETURN NEW;
        END IF;

        -- Initialize the sponsor chain with the found affiliate's ID (Level 1)
        v_current_sponsor_id := v_affiliate.id;

        -- 4. Distribute through levels
        WHILE v_gen_count < v_active_gens AND v_current_sponsor_id IS NOT NULL LOOP
            v_gen_count := v_gen_count + 1;
            
            -- Find commission value for this level in JSON: [{"level": 1, "value": 10}, ...]
            SELECT (lvl->>'value')::numeric INTO v_commission_amount
            FROM jsonb_array_elements(v_config.levels) AS lvl
            WHERE (lvl->>'level')::integer = v_gen_count;

            IF v_commission_amount IS NOT NULL AND v_commission_amount > 0 THEN
                
                -- Calculate amount
                IF v_config.type = 'percent' THEN
                    v_commission_amount := NEW.total_amount * (v_commission_amount / 100);
                END IF;

                -- Get the user_id of the current sponsor
                SELECT user_id INTO v_target_user_id FROM public.affiliates WHERE id = v_current_sponsor_id;

                IF v_target_user_id IS NOT NULL THEN
                    v_split_status := NULL;
                    
                    -- Search for this level in split_details if it exists
                    IF NEW.split_details IS NOT NULL THEN
                        SELECT (item->>'status') INTO v_split_status
                        FROM jsonb_array_elements(NEW.split_details) AS item
                        WHERE (item->>'level')::integer = v_gen_count 
                        AND (item->>'user_id')::uuid = v_target_user_id;
                    END IF;

                    -- Check if it was split and sent to the affiliate's wallet
                    IF v_split_status = 'split_sent' OR (v_gen_count = 1 AND NEW.split_amount > 0 AND NEW.split_wallet_id IS NOT NULL) THEN
                        -- LOG ONLY (Do not increase user settings balance because it was already split in Asaas)
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
                        -- Traditional flow: Update balances (since it wasn't split directly to their wallet)
                        INSERT INTO public.user_settings (user_id, organization_id, total_earnings, available_balance)
                        VALUES (v_target_user_id, NEW.organization_id, v_commission_amount, v_commission_amount)
                        ON CONFLICT (user_id) DO UPDATE SET 
                            total_earnings = public.user_settings.total_earnings + v_commission_amount,
                            available_balance = public.user_settings.available_balance + v_commission_amount,
                            updated_at = now();

                        -- Log the commission
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

            -- Move to next sponsor in hierarchy (upwards)
            SELECT sponsor_id INTO v_current_sponsor_id 
            FROM public.affiliates 
            WHERE id = v_current_sponsor_id 
            AND organization_id = NEW.organization_id;
            
            -- Safety break
            IF v_gen_count > 50 THEN EXIT; END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;
