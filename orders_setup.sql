-- ORDERS & ORDER ITEMS SETUP

-- 1. Create Orders Table
CREATE TABLE public.orders (
    id text PRIMARY KEY, -- Using #ORD-XXXX format or UUID
    customer_name text NOT NULL,
    customer_email text,
    customer_phone text,
    shipping_address text,
    total_amount numeric NOT NULL,
    status text DEFAULT 'Pendente'::text, -- Pendente, Pago, Enviado, Cancelado
    payment_method text,
    referral_code text, -- Affiliate ID or code
    tracking_code text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create Order Items Table
CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id text REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id),
    product_name text NOT NULL, -- Snapshot of name at purchase
    quantity integer NOT NULL,
    unit_price numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. RLS Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow admins full access
CREATE POLICY "Admins can manage all orders" 
ON public.orders 
FOR ALL 
TO authenticated 
USING (public.is_admin());

CREATE POLICY "Admins can manage all order items" 
ON public.order_items 
FOR ALL 
TO authenticated 
USING (public.is_admin());

-- Allow users/affiliates to see their own orders (if connected)
-- For now, focused on Admin visibility as requested.
CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
USING (customer_email = auth.jwt()->>'email');

-- 4. Initial Seed Data (Optional, but good for testing)
INSERT INTO public.orders (id, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_method, referral_code)
VALUES 
('#ORD-9842', 'Cláudio Ferreira', 'claudio@email.com', '(11) 98888-7777', 'Av. Paulista, 1000 - São Paulo, SP', 4590.00, 'Pago', 'Cartão de Crédito', 'afiliado123'),
('#ORD-9841', 'Renata Souza', 'renata@email.com', '(21) 97777-6666', 'Rua das Flores, 123 - Rio de Janeiro, RJ', 290.00, 'Pendente', 'Pix', 'afiliado55');

INSERT INTO public.order_items (order_id, product_name, quantity, unit_price)
VALUES 
('#ORD-9842', 'Colchão Classe A Gold', 1, 4590.00),
('#ORD-9841', 'Acessório Magnético', 1, 290.00);
