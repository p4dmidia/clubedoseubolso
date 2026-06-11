-- Migration: Seed standard products and categories, and update distribute_commissions trigger function for EVA activation

-- 1. Create categories if they do not exist
INSERT INTO public.product_categories (name, parent_id, organization_id)
SELECT name, parent_id, organization_id
FROM (
    VALUES 
    ('Telemedicina'::text, NULL::integer, '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid),
    ('Energia por Assinatura'::text, NULL::integer, '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid),
    ('Estratégias de Crédito'::text, NULL::integer, '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid),
    ('Sistema'::text, NULL::integer, '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid)
) AS v(name, parent_id, organization_id)
WHERE NOT EXISTS (
    SELECT 1 FROM public.product_categories pc 
    WHERE pc.name = v.name AND pc.organization_id = v.organization_id
);

-- 2. Insert standard products in products table (idempotent with conflict handling)
DO $$
DECLARE
    v_telemed_id bigint;
    v_sistema_id bigint;
    v_energia_id bigint;
    v_credito_id bigint;
    v_org_id uuid := '5111af72-27a5-41fd-8ed9-8c51b78b4fdd';
BEGIN
    -- Obter os IDs das categorias correspondentes
    SELECT id INTO v_telemed_id FROM public.product_categories WHERE name = 'Telemedicina' AND organization_id = v_org_id;
    SELECT id INTO v_sistema_id FROM public.product_categories WHERE name = 'Sistema' AND organization_id = v_org_id;
    SELECT id INTO v_energia_id FROM public.product_categories WHERE name = 'Energia por Assinatura' AND organization_id = v_org_id;
    SELECT id INTO v_credito_id FROM public.product_categories WHERE name = 'Estratégias de Crédito' AND organization_id = v_org_id;

    -- Telemedicina Individual Essencial
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc01-9a7c936df312', 'Telemedicina Individual Essencial', 'Plano de telemedicina individual essencial', 17.90, v_telemed_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Telemedicina Individual Premium
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc02-9a7c936df312', 'Telemedicina Individual Premium', 'Plano de telemedicina individual premium', 34.90, v_telemed_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Telemedicina Familiar Essencial
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc03-9a7c936df312', 'Telemedicina Familiar Essencial', 'Plano de telemedicina familiar essencial', 44.90, v_telemed_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Telemedicina Familiar Premium
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc04-9a7c936df312', 'Telemedicina Familiar Premium', 'Plano de telemedicina familiar premium', 87.90, v_telemed_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Taxa de Adesão EVA
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc05-9a7c936df312', 'Adesão Escritório Virtual', 'Taxa de ativação do Escritório Virtual do Afiliado', 44.00, v_sistema_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Taxa de Manutenção EVA
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc06-9a7c936df312', 'Manutenção Mensal EVA', 'Taxa de manutenção mensal do Escritório Virtual do Afiliado', 17.00, v_sistema_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Simulação de Energia
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc07-9a7c936df312', 'Simulação de Energia por Assinatura', 'Formulário de captação de lead para energia limpa', 0.00, v_energia_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Simulação de Crédito
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc08-9a7c936df312', 'Simulação de Estratégias de Crédito', 'Formulário de captação de lead para portabilidade/redução de juros', 0.00, v_credito_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;
END $$;

-- 3. Deactivate legacy products
UPDATE public.products
SET is_active = false
WHERE organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'
  AND id NOT IN (
    'd3b07384-d113-4171-bc01-9a7c936df312',
    'd3b07384-d113-4171-bc02-9a7c936df312',
    'd3b07384-d113-4171-bc03-9a7c936df312',
    'd3b07384-d113-4171-bc04-9a7c936df312',
    'd3b07384-d113-4171-bc05-9a7c936df312',
    'd3b07384-d113-4171-bc06-9a7c936df312',
    'd3b07384-d113-4171-bc07-9a7c936df312',
    'd3b07384-d113-4171-bc08-9a7c936df312'
  );

-- 4. Update the distribute_commissions trigger function to restore EVA logic
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
    v_item RECORD;
BEGIN
    -- Only process if status changed to 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Avoid duplicate processing
        IF EXISTS (SELECT 1 FROM public.commissions WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- A. PROCESS SYSTEM FEES (EVA ACTIVATION / MAINTENANCE STATUS UPDATE)
        FOR v_item IN 
            SELECT product_id 
            FROM public.order_items 
            WHERE order_id = NEW.id 
        LOOP
            IF v_item.product_id = 'd3b07384-d113-4171-bc05-9a7c936df312' THEN
                -- Adesão EVA
                UPDATE public.affiliates
                SET is_active = true,
                    is_delinquent = false,
                    maintenance_expires_at = now() + interval '30 days',
                    updated_at = now()
                WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id;

                UPDATE public.user_profiles
                SET is_active = true,
                    is_delinquent = false,
                    maintenance_expires_at = now() + interval '30 days',
                    updated_at = now()
                WHERE id = NEW.user_id AND organization_id = NEW.organization_id;

            ELSIF v_item.product_id = 'd3b07384-d113-4171-bc06-9a7c936df312' THEN
                -- Renovação EVA
                UPDATE public.affiliates
                SET is_active = true,
                    is_delinquent = false,
                    maintenance_expires_at = CASE 
                        WHEN maintenance_expires_at IS NULL OR maintenance_expires_at < now() THEN now() + interval '30 days'
                        ELSE maintenance_expires_at + interval '30 days'
                    END,
                    updated_at = now()
                WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id;

                UPDATE public.user_profiles
                SET is_active = true,
                    is_delinquent = false,
                    maintenance_expires_at = CASE 
                        WHEN maintenance_expires_at IS NULL OR maintenance_expires_at < now() THEN now() + interval '30 days'
                        ELSE maintenance_expires_at + interval '30 days'
                    END,
                    updated_at = now()
                WHERE id = NEW.user_id AND organization_id = NEW.organization_id;
            END IF;
        END LOOP;

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
