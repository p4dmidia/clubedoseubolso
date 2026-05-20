
-- 1. Create Debug Table
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    process_name text,
    step text,
    order_id text,
    data jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Distribute Commissions with Deep Logging and Error Catching
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
    v_step text := 'start';
BEGIN
    -- Log Start
    INSERT INTO public.debug_logs (process_name, step, order_id, data)
    VALUES ('distribute_commissions', 'TRIGGER_FIRED', NEW.id, jsonb_build_object('status', NEW.status, 'old_status', OLD.status));

    -- Only process if status changed to 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        v_step := 'checking_duplicates';
        IF EXISTS (SELECT 1 FROM public.commissions WHERE order_id = NEW.id) THEN
            INSERT INTO public.debug_logs (process_name, step, order_id) VALUES ('distribute_commissions', 'ALREADY_PROCESSED', NEW.id);
            RETURN NEW;
        END IF;

        BEGIN
            v_step := 'loading_config';
            SELECT * INTO v_config FROM public.commission_configs WHERE key = 'geral';
            
            IF v_config IS NULL THEN
                INSERT INTO public.debug_logs (process_name, step, order_id) VALUES ('distribute_commissions', 'CONFIG_NOT_FOUND', NEW.id);
                RETURN NEW;
            END IF;

            v_active_gens := v_config.active_generations;

            v_step := 'finding_initial_affiliate';
            -- priority 1: referral_code in the order
            IF NEW.referral_code IS NOT NULL AND NEW.referral_code != '' THEN
                SELECT * INTO v_affiliate FROM public.affiliates 
                WHERE LOWER(referral_code) = LOWER(NEW.referral_code) 
                AND organization_id = NEW.organization_id
                LIMIT 1;
            END IF;

            -- priority 2: buyer's sponsor in user_profiles
            IF v_affiliate IS NULL AND NEW.user_id IS NOT NULL THEN
                v_step := 'finding_sponsor_via_profile';
                SELECT a.* INTO v_affiliate 
                FROM public.affiliates a
                JOIN public.user_profiles p ON p.sponsor_id = a.user_id
                WHERE p.id = NEW.user_id 
                AND a.organization_id = NEW.organization_id
                LIMIT 1;
            END IF;

            -- If no affiliate found, no commission to distribute
            IF v_affiliate IS NULL THEN
                INSERT INTO public.debug_logs (process_name, step, order_id) VALUES ('distribute_commissions', 'NO_AFFILIATE_FOUND', NEW.id);
                RETURN NEW;
            END IF;

            v_current_sponsor_id := v_affiliate.id;
            INSERT INTO public.debug_logs (process_name, step, order_id, data) 
            VALUES ('distribute_commissions', 'AFFILIATE_IDENTIFIED', NEW.id, jsonb_build_object('affiliate_id', v_current_sponsor_id, 'name', v_affiliate.full_name));

            -- Distribute through levels
            WHILE v_gen_count < v_active_gens AND v_current_sponsor_id IS NOT NULL LOOP
                v_gen_count := v_gen_count + 1;
                v_step := 'processing_level_' || v_gen_count;
                
                SELECT (lvl->>'value')::numeric INTO v_commission_amount
                FROM jsonb_array_elements(v_config.levels) AS lvl
                WHERE (lvl->>'level')::integer = v_gen_count;

                IF v_commission_amount IS NOT NULL AND v_commission_amount > 0 THEN
                    
                    IF v_config.type = 'percent' THEN
                        v_commission_amount := NEW.total_amount * (v_commission_amount / 100);
                    END IF;

                    v_step := 'fetching_target_user_for_level_' || v_gen_count;
                    SELECT user_id INTO v_target_user_id FROM public.affiliates WHERE id = v_current_sponsor_id;

                    IF v_target_user_id IS NOT NULL THEN
                        
                        v_step := 'updating_balance_for_user_' || v_target_user_id;
                        INSERT INTO public.debug_logs (process_name, step, order_id, data) 
                        VALUES ('distribute_commissions', 'UPDATING_BALANCE', NEW.id, jsonb_build_object('user_id', v_target_user_id, 'amount', v_commission_amount));
                        
                        UPDATE public.user_settings 
                        SET 
                            total_earnings = total_earnings + v_commission_amount,
                            available_balance = available_balance + v_commission_amount,
                            updated_at = now()
                        WHERE user_id = v_target_user_id;

                        v_step := 'logging_commission_row';
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

                v_step := 'moving_to_next_sponsor_after_level_' || v_gen_count;
                SELECT sponsor_id INTO v_current_sponsor_id 
                FROM public.affiliates 
                WHERE id = v_current_sponsor_id;
                
                IF v_gen_count > 50 THEN EXIT; END IF;
            END LOOP;

            INSERT INTO public.debug_logs (process_name, step, order_id) VALUES ('distribute_commissions', 'COMPLETED_SUCCESSFULLY', NEW.id);

        EXCEPTION WHEN OTHERS THEN
            INSERT INTO public.debug_logs (process_name, step, order_id, error_message, data) 
            VALUES ('distribute_commissions', 'ERROR_CAUGHT', NEW.id, SQLERRM, jsonb_build_object('failed_step', v_step, 'sqlcode', SQLSTATE));
            -- Re-raise to show the error in the console but now we have it logged
            RAISE EXCEPTION 'Commission Distribution Error at step %: % (Code: %)', v_step, SQLERRM, SQLSTATE;
        END;
    END IF;

    RETURN NEW;
END;
$$;
