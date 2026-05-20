-- 1. Alterar tabela de configurações do usuário (user_settings)
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_agency text,
ADD COLUMN IF NOT EXISTS bank_account text,
ADD COLUMN IF NOT EXISTS bank_account_type text,
ADD COLUMN IF NOT EXISTS bank_document text,
ADD COLUMN IF NOT EXISTS auto_renew_subscription boolean DEFAULT true;

-- 2. Alterar tabela de saques (withdrawals)
ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'pix',
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_agency text,
ADD COLUMN IF NOT EXISTS bank_account text,
ADD COLUMN IF NOT EXISTS bank_account_type text,
ADD COLUMN IF NOT EXISTS bank_document text;

COMMENT ON COLUMN public.user_settings.auto_renew_subscription IS 'Indica se a renovação da mensalidade do EVA deve ser cobrada automaticamente';
COMMENT ON COLUMN public.withdrawals.payment_method IS 'Método de pagamento solicitado para o saque: pix ou bank_transfer';
