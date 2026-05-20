-- 1. Garante que as colunas existem
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS registration_type text;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS whatsapp text;

-- 2. VERIFICA TODOS OS CAMPOS E TIPOS (Executar e me mandar print)
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_profiles', 'affiliates')
AND column_name IN ('cnpj', 'whatsapp', 'registration_type', 'cpf', 'organization_id', 'sponsor_id', 'status', 'role');

-- 3. VERIFICA SE O TRIGGER ATUAL ESTÁ DANDO ERRO (Opcional, mas ajuda muito)
-- Se você puder ver no menu "Database" -> "Logs" -> "Postgres" do Supabase, 
-- procure por "handle_new_affiliate_user" e me mande o erro específico.
