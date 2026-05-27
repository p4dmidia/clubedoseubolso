-- Adicionar colunas para integração com o Asaas na tabela organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS asaas_access_token text,
ADD COLUMN IF NOT EXISTS asaas_environment text DEFAULT 'sandbox'; -- 'sandbox' ou 'production'

COMMENT ON COLUMN public.organizations.asaas_access_token IS 'Token de acesso da API do Asaas por organização';
COMMENT ON COLUMN public.organizations.asaas_environment IS 'Ambiente da API do Asaas (sandbox ou production)';
