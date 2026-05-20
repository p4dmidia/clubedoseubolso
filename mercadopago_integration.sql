-- MERCADO PAGO INTEGRATION SETUP

-- 1. Add payment tracking columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_id TEXT, -- ID do Mercado Pago
ADD COLUMN IF NOT EXISTS payment_preference_id TEXT, -- Preference ID para Checkout Pro
ADD COLUMN IF NOT EXISTS payment_status TEXT, -- Status do pagamento (pending, paid, failed)
ADD COLUMN IF NOT EXISTS payment_status_detail TEXT; -- Detalhes como "accredited", "pending_contingency"

-- 2. Index for fast lookup by payment_id (needed for webhooks)
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_preference_id ON public.orders(payment_preference_id);

-- 3. Comment columns
COMMENT ON COLUMN public.orders.payment_id IS 'ID retornado pelo Mercado Pago após a criação ou processamento do pagamento';
COMMENT ON COLUMN public.orders.payment_preference_id IS 'ID da preferência usada para iniciar o Checkout Pro';
