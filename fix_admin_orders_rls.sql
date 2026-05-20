-- FIX ADMIN ORDERS RLS
-- Execute este script no SQL Editor do Supabase para liberar o gerenciamento de pedidos para admins.

-- 1. Garante que a função is_admin() existe e está correta
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Habilita RLS (caso não esteja)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 3. Remove políticas que possam estar conflitando
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
DROP POLICY IF EXISTS "Modifica_Orders_Tenant" ON public.orders;
DROP POLICY IF EXISTS "Modifica_OrderItems_Tenant" ON public.order_items;

-- 4. Cria Políticas Absolutas para Admins (Bypass de Tenant)
CREATE POLICY "Admins can manage all orders" 
ON public.orders 
FOR ALL 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all order items" 
ON public.order_items 
FOR ALL 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Mantém a política de visualização para usuários normais (baseada em email)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
TO public 
USING (customer_email = auth.jwt()->>'email' OR (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid = organization_id);

-- 6. Garante permissões de sistema
GRANT ALL ON public.orders TO authenticated, service_role;
GRANT ALL ON public.order_items TO authenticated, service_role;

-- Log de sucesso
-- Correção de RLS para Admin Orders aplicada!
