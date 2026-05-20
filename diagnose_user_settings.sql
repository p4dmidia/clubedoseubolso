-- VERIFICAÇÃO FINAL DA TABELA user_settings
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_settings'
AND column_name IN ('user_id', 'organization_id', 'available_balance', 'total_earnings');

-- SE NÃO APARECER organization_id NO RESULTADO, TENTE RODAR ISSO:
-- ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS organization_id uuid;
