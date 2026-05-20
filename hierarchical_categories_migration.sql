-- HIERARCHICAL CATEGORIES MIGRATION SCRIPT
-- RUN THIS IN THE SUPABASE SQL EDITOR

-- 1. ADICIONAR COLUNA DE RELACIONAMENTO HIERÁRQUICO
ALTER TABLE public.product_categories 
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES public.product_categories(id) ON DELETE CASCADE;

-- 2. CRIAR FUNÇÃO RECURSIVA PARA FILTRAGEM (USADA NO SHOP)
DROP FUNCTION IF EXISTS get_category_descendants(INTEGER);
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

-- 3. REMOVER COLUNA OBSOLETA NOS PRODUTOS (OPCIONAL - CASO QUEIRA LIMPAR AGORA)
-- Nota: Como você vai recadastrar tudo, podemos apenas deixar a tabela de subcategorias para trás.
-- Se quiser limpar o esquema agora:
-- ALTER TABLE public.products DROP COLUMN IF EXISTS subcategory_id;
-- DROP TABLE IF EXISTS public.product_subcategories;

-- 4. ÍNDICE PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON public.product_categories(parent_id);
