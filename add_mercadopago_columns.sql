-- 1. Add Mercado Pago credentials columns to the organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS mercadopago_access_token TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_public_key TEXT;

-- 2. Add comments
COMMENT ON COLUMN public.organizations.mercadopago_access_token IS 'Token de acesso do Mercado Pago por organização';
COMMENT ON COLUMN public.organizations.mercadopago_public_key IS 'Chave pública do Mercado Pago por organização';

-- 3. Security: We don''t want these sensitive columns to be publicly readable by authenticated/anon users by default
-- if RLS is enabled, but Edge Functions use Service Role, so they bypass.
-- For safety, we can restrict viewing these columns specifically if needed.
