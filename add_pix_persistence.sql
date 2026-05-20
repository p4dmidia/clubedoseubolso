-- Adicionar colunas para persistência do QR Code do PIX nos pedidos
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pix_qr_code text,
ADD COLUMN IF NOT EXISTS pix_qr_code_base64 text,
ADD COLUMN IF NOT EXISTS pix_copy_paste text;
