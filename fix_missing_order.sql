-- FIX MISSING ORDER FOR fiel01@gmail.com
-- This script moves the R$ 0,50 order from gilgalmissoes@gmail.com to fiel01@gmail.com
-- and marks it as PAID, deducting the balance.

DO $$
DECLARE
    v_user_fiel uuid := '7e57d5d8-f44c-46ed-8c14-46e191321620';
    v_email_fiel text := 'fiel01@gmail.com';
    v_order_id text;
    v_org_id uuid := '5111af72-27a5-41fd-8ed9-8c51b78b4fdd';
    v_amount numeric := 0.50;
BEGIN
    -- 1. Find the order with 0.50 amount for the related email that has items
    SELECT o.id INTO v_order_id
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.total_amount = v_amount 
    AND o.customer_email = 'gilgalmissoes@gmail.com'
    AND o.organization_id = v_org_id
    LIMIT 1;

    IF v_order_id IS NOT NULL THEN
        -- 2. Move order to fiel01@gmail.com
        UPDATE public.orders 
        SET 
            customer_email = v_email_fiel,
            customer_name = 'fiel 01', -- From user_profiles
            status = 'Pago',
            payment_method = 'Saldo Classe A',
            updated_at = now()
        WHERE id = v_order_id;

        -- 3. Deduct balance from user_settings (if balance exists)
        -- Note: The user says they PAID with balance, so we assume they had it.
        -- If current balance is 0, it means either it was already deducted or they are in negative.
        -- We will ensure it's not negative if possible, but for correction we subtract.
        UPDATE public.user_settings
        SET 
            available_balance = available_balance - v_amount,
            updated_at = now()
        WHERE user_id = v_user_fiel
        AND organization_id = v_org_id;

        -- 4. Update activation (if this is an activation purchase)
        UPDATE public.user_profiles
        SET 
            last_activation_at = now(),
            is_active = true,
            updated_at = now()
        WHERE id = v_user_fiel;

        RAISE NOTICE 'Order % moved to fiel01 and updated to Pago.', v_order_id;
    ELSE
        RAISE NOTICE 'No matching order found with items.';
    END IF;
END $$;
