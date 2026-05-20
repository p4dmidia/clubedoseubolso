-- VERIFICA A TABELA commission_configs
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'commission_configs';

-- VERIFICA SE RLS ESTÁ ATIVADO
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'commission_configs';

-- VERIFICA POLÍTICAS EXISTENTES
SELECT * FROM pg_policies WHERE tablename = 'commission_configs';
