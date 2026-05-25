-- 1. Habilitar RLS na tabela de logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas de inserção e seleção
DROP POLICY IF EXISTS "Everyone (auth) can insert security logs" ON public.security_logs;
DROP POLICY IF EXISTS "Allow public insert of security logs" ON public.security_logs;
DROP POLICY IF EXISTS "Admins can view security logs" ON public.security_logs;

-- 3. Criar nova política de inserção pública (permite que qualquer pessoa insira logs de login/falha)
CREATE POLICY "Allow public insert of security logs" 
ON public.security_logs 
FOR INSERT 
TO public 
WITH CHECK (true);

-- 4. Criar política de visualização para administradores
CREATE POLICY "Admins can view security logs" 
ON public.security_logs 
FOR SELECT 
TO authenticated 
USING (public.is_admin());

-- 5. Garantir permissões de escrita para anon e authenticated nas tabelas e sequências
GRANT INSERT ON TABLE public.security_logs TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.security_logs_id_seq TO anon, authenticated;
