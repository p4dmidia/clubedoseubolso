-- Migration: Add Asaas Wallet ID to user_settings and split columns to orders

-- Adicionar Wallet ID do Asaas nas configurações do usuário
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS asaas_wallet_id text;

COMMENT ON COLUMN public.user_settings.asaas_wallet_id IS 'ID da carteira Asaas do afiliado para split automático';

-- Adicionar dados do split nos pedidos para auditoria e controle do trigger
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS split_wallet_id text,
ADD COLUMN IF NOT EXISTS split_amount numeric DEFAULT 0.00;

COMMENT ON COLUMN public.orders.split_wallet_id IS 'ID da carteira Asaas que recebeu o split deste pedido';
COMMENT ON COLUMN public.orders.split_amount IS 'Valor da comissão que foi enviada por split automático';
