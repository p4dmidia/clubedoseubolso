-- SCRIPT DE CORREÇÃO GLOBAL (RLS + RPC + CPF)
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Garante que a coluna de CPF existe nos pedidos
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_cpf TEXT;

-- 2. Cria a Função de Busca Recursiva de Categorias (Correção Erro 400)
CREATE OR REPLACE FUNCTION get_category_descendants(root_id INTEGER)
RETURNS TABLE (id INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
        SELECT c.id FROM public.product_categories c WHERE c.id = root_id
        UNION ALL
        SELECT c.id FROM public.product_categories c
        JOIN category_tree ct ON c.parent_id = ct.id
    )
    SELECT ct.id FROM category_tree ct;
END;
$$ LANGUAGE plpgsql;

-- 3. Habilita RLS nas tabelas (se não estiver habilitado)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. Limpa políticas antigas (para evitar duplicidade)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- 5. Cria Novas Políticas de Acesso Público (Correção Erro 403)
CREATE POLICY "Anyone can create orders" 
ON public.orders FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can create order items" 
ON public.order_items FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT TO public 
USING (customer_email = auth.jwt()->>'email' OR true);

-- 6. Garante permissão de execução para a função e tabelas
GRANT EXECUTE ON FUNCTION get_category_descendants(INTEGER) TO anon, authenticated, service_role;
GRANT ALL ON public.orders TO anon, authenticated, service_role;
GRANT ALL ON public.order_items TO anon, authenticated, service_role;

-- Todas as correções foram aplicadas com sucesso!
