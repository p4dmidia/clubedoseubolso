-- FIX COMMISSION DISTRIBUTION LOGIC
-- Migration to update the distribute_commissions function with tenant isolation and case-insensitive matching.

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
        -- priority 1: referral_code in the order
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
                
                -- Calculate amount (Total amount of order)
                IF v_config.type = 'percent' THEN
                    v_commission_amount := NEW.total_amount * (v_commission_amount / 100);
                END IF;

                -- Get the user_id of the current sponsor
                SELECT user_id INTO v_target_user_id FROM public.affiliates WHERE id = v_current_sponsor_id;

                IF v_target_user_id IS NOT NULL THEN
                    -- Update balances
                    UPDATE public.user_settings 
                    SET 
                        total_earnings = total_earnings + v_commission_amount,
                        available_balance = available_balance + v_commission_amount,
                        updated_at = now()
                    WHERE user_id = v_target_user_id;

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
                        'Comissão ' || v_config_key || ' Geração ' || v_gen_count || ' - Pedido ' || NEW.id
                    );
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
