-- 0. Função Recursiva para Filtragem
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

-- 1. Limpeza Robusta
BEGIN;
  UPDATE public.products SET category_id = NULL, subcategory_id = NULL;
  TRUNCATE TABLE public.product_subcategories, public.product_categories RESTART IDENTITY CASCADE;
COMMIT;

-- 2. Criar Hierarquia com IDs fixos para bater com o script de importação
DO $$
BEGIN
    -- --- ACESSÓRIOS (Base ID: 1) ---
    INSERT INTO public.product_categories (id, name) OVERRIDING SYSTEM VALUE VALUES (1, 'ACESSÓRIOS');
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES 
        (2, 'CARTEIRAS', 1),
        (3, 'CINTOS', 1),
        (4, 'PULSEIRAS', 1);

    -- --- VESTUÁRIO MASCULINO (Base ID: 5) ---
    INSERT INTO public.product_categories (id, name) OVERRIDING SYSTEM VALUE VALUES (5, 'VESTUÁRIO MASCULINO');
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES 
        (6, 'BERMUDAS', 5),
        (7, 'CAMISETAS', 5),
        (8, 'CALÇAS', 5),
        (9, 'CAMISA POLO', 5),
        (10, 'CAMISA SOCIAL MANGA CURTA', 5),
        (11, 'CAMISA SOCIAL MANGA LONGA', 5);
    
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES (12, 'TERNOS & BLAZERS', 5);
    
    -- Sub-sub de Ternos
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES 
        (13, 'MICROFIBRA', 12),
        (14, 'FIO INDIANO', 12),
        (15, 'POLIVISCOSE', 12);
    
    -- Sub-sub de Ternos -> BLAZERS
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES (16, 'BLAZERS', 12);
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES 
        (17, 'MARESIAS', 16),
        (18, 'SARJA', 16);

    -- --- CALÇADO MASCULINO (Base ID: 19) ---
    INSERT INTO public.product_categories (id, name) OVERRIDING SYSTEM VALUE VALUES (19, 'CALÇADO MASCULINO');
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES 
        (20, 'SAPATÊNIS', 19),
        (21, 'TÊNIS', 19),
        (22, 'SAPATO SOCIAL', 19),
        (23, 'CHINELOS', 19);

    -- --- FEMININO (Base ID: 24) ---
    INSERT INTO public.product_categories (id, name) OVERRIDING SYSTEM VALUE VALUES (24, 'FEMININO');
    
    -- FEMININO -> ACESSÓRIOS FEMININOS
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES (25, 'ACESSÓRIOS FEMININOS', 24);
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES 
        (26, 'BOLSAS', 25),
        (27, 'CARTEIRAS FEMININAS', 25),
        (28, 'CINTOS FEMININOS', 25);

    -- FEMININO -> CALÇADOS
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES (29, 'CALÇADOS', 24);
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES 
        (30, 'BOTAS', 29),
        (31, 'CHINELOS FEMININOS', 29),
        (32, 'MOCASSIM', 29),
        (33, 'MULES', 29),
        (34, 'PANTUFAS', 29),
        (35, 'RASTEIRAS', 29),
        (36, 'SAPATILHAS', 29),
        (37, 'SANDÁLIAS', 29),
        (38, 'SCARPIN', 29),
        (39, 'TAMANCOS', 29),
        (40, 'TÊNIS CASUAL', 29),
        (41, 'TÊNIS ESPORTIVO', 29);

    -- FEMININO -> VESTUÁRIO FEMININOS
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES (42, 'VESTUÁRIO FEMININOS', 24);
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES 
        (43, 'CAMISETAS FEMININAS', 42),
        (44, 'BERMUDAS FEMININAS', 42),
        (45, 'CALÇAS FEMININAS', 42),
        (46, 'SAIAS', 42),
        (47, 'VESTIDOS', 42),
        (48, 'LINGERIE', 42);

    -- --- CAMA (Base ID: 49) ---
    INSERT INTO public.product_categories (id, name) OVERRIDING SYSTEM VALUE VALUES (49, 'CAMA');
    INSERT INTO public.product_categories (id, name, parent_id) OVERRIDING SYSTEM VALUE VALUES 
        (50, 'BASE BOX', 49),
        (51, 'TRAVESSEIROS', 49),
        (52, 'CABECEIRAS', 49),
        (53, 'COLCHÕES ESTÁTICOS', 49),
        (54, 'COLCHÕES TERAPÊUTICOS', 49);

    -- Ajustar o sequenciador para não dar erro em inserts manuais futuros
    PERFORM setval('product_categories_id_seq', (SELECT MAX(id) FROM product_categories));
END $$;
