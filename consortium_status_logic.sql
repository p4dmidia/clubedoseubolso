-- CONSORTIUM PAYMENT TRACKING LOGIC

-- This function checks if a member is currently "Regular" (Paid for the current month)
CREATE OR REPLACE FUNCTION public.check_consortium_regularity(p_user_id uuid)
RETURNS TABLE (
    is_member boolean,
    is_regular boolean,
    last_payment_date timestamp with time zone,
    days_to_deadline integer,
    status_text text
) AS $$
DECLARE
    v_email text;
    v_order_exists boolean;
    v_last_payment timestamp with time zone;
    v_current_day integer;
    v_current_month_start timestamp with time zone;
BEGIN
    -- 1. Check if user is a member
    SELECT EXISTS (SELECT 1 FROM public.consortium_participants WHERE user_id = p_user_id) INTO is_member;
    
    IF NOT is_member THEN
        is_regular := false;
        RETURN NEXT;
        RETURN;
    END IF;

    -- 2. Get user email
    SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

    -- 3. Define current month boundaries
    v_current_month_start := date_trunc('month', now());
    v_current_day := extract(day from now());

    -- 4. Check for paid order this month with consortium product
    -- We look for orders with status 'Pago' containing items with 'Consórcio' in the name
    SELECT 
        EXISTS (
            SELECT 1 
            FROM public.orders o
            JOIN public.order_items oi ON o.id = oi.order_id
            WHERE o.customer_email = v_email
            AND o.status = 'Pago'
            AND o.created_at >= v_current_month_start
            AND (oi.product_name ILIKE '%Consórcio%')
        ),
        (
            SELECT MAX(o.created_at)
            FROM public.orders o
            JOIN public.order_items oi ON o.id = oi.order_id
            WHERE o.customer_email = v_email
            AND o.status = 'Pago'
            AND (oi.product_name ILIKE '%Consórcio%')
        )
    INTO v_order_exists, v_last_payment;

    is_regular := v_order_exists;
    last_payment_date := v_last_payment;
    days_to_deadline := 10 - v_current_day;

    IF v_order_exists THEN
        status_text := 'Regular';
    ELSE
        IF v_current_day > 10 THEN
            status_text := 'Irregular';
        ELSE
            status_text := 'Pendente';
        END IF;
    END IF;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
