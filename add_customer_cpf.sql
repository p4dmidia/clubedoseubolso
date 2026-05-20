-- ADD CUSTOMER CPF TO ORDERS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_cpf TEXT;
COMMENT ON COLUMN public.orders.customer_cpf IS 'CPF do cliente para fins de emissão de NF e processamento de PIX no Mercado Pago';
