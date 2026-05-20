-- FIX ADMIN ROLES
-- Execute este script no SQL Editor do Supabase para corrigir as permissões de administradores (admin_master, admin_op).

-- 1. Atualiza a função is_admin() para aceitar os papéis admin_master e admin_op
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'admin_master', 'admin_op')
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualiza a política de segurança da tabela commission_configs
DROP POLICY IF EXISTS "Allow all for admins" ON public.commission_configs;
CREATE POLICY "Allow all for admins" 
ON public.commission_configs FOR ALL 
TO authenticated 
USING (
  public.is_admin()
);
