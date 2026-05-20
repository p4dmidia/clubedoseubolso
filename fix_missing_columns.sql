
-- FIX: ADD MISSING organization_id COLUMNS
-- These columns are required by the commission distribution trigger but were missing from the table definitions.

-- 1. Add organization_id to commissions table
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- 2. Add organization_id to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- 3. Update existing commissions if any (optional, but good for data integrity)
-- If there are orphans, we could try to link them to the default org, 
-- but since the trigger was failing, there likely are no recent commissions.
UPDATE public.commissions 
SET organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd' 
WHERE organization_id IS NULL;

-- 4. Update existing user_settings
UPDATE public.user_settings 
SET organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd' 
WHERE organization_id IS NULL;

-- 5. Re-apply the distribute_commissions function to ensure it's up to date
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
BEGIN
    -- Only process if status changed to 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Avoid duplicate processing
        IF EXISTS (SELECT 1 FROM public.commissions WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- Get configuration (Default to 'geral')
        SELECT * INTO v_config FROM public.commission_configs WHERE key = 'geral' AND organization_id = NEW.organization_id;
        
        -- Fallback if no org-specific config
        IF v_config IS NULL THEN
            SELECT * INTO v_config FROM public.commission_configs WHERE key = 'geral' LIMIT 1;
        END IF;

        IF v_config IS NULL THEN
            RETURN NEW;
        END IF;

        v_active_gens := v_config.active_generations;

        -- 1. Identify the initial affiliate (the one who referred the sale)
        IF NEW.referral_code IS NOT NULL AND NEW.referral_code != '' THEN
            SELECT * INTO v_affiliate FROM public.affiliates 
            WHERE LOWER(referral_code) = LOWER(NEW.referral_code) 
            AND organization_id = NEW.organization_id
            LIMIT 1;
        END IF;

        -- priority 2: buyer's sponsor in user_profiles
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

        -- Initialize the sponsor chain
        v_current_sponsor_id := v_affiliate.id;

        -- 2. Distribute through levels
        WHILE v_gen_count < v_active_gens AND v_current_sponsor_id IS NOT NULL LOOP
            v_gen_count := v_gen_count + 1;
            
            -- Find commission value for this level
            SELECT (lvl->>'value')::numeric INTO v_commission_amount
            FROM jsonb_array_elements(v_config.levels) AS lvl
            WHERE (lvl->>'level')::integer = v_gen_count;

            IF v_commission_amount IS NOT NULL AND v_commission_amount > 0 THEN
                
                -- Calculate amount
                IF v_config.type = 'percent' THEN
                    v_commission_amount := NEW.total_amount * (v_commission_amount / 100);
                END IF;

                -- Get the user_id of the current sponsor to pay them
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
                        'Comissão de Geração ' || v_gen_count || ' - Pedido ' || NEW.id
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
