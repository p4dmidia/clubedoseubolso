-- Script para sincronizar produtos com as novas subcategorias baseando-se no título
-- Execute no SQL Editor do Supabase ou via script de serviço

DO $$ 
DECLARE 
    terapeutico_id bigint;
    haiflex_id bigint;
    classea_id bigint;
    classic_id bigint;
    intense_id bigint;
BEGIN
    -- 1. Pega os IDs das categorias (nomes exatos do banco)
    SELECT id INTO terapeutico_id FROM product_categories WHERE name = 'COLCHÕES TERAPÊUTICOS' LIMIT 1;
    SELECT id INTO haiflex_id FROM product_categories WHERE name = 'HAIFLEX' AND parent_id = terapeutico_id LIMIT 1;
    SELECT id INTO classea_id FROM product_categories WHERE name = 'CLASSE A' AND parent_id = terapeutico_id LIMIT 1;
    SELECT id INTO classic_id FROM product_categories WHERE name = 'CLASSIC' AND parent_id = terapeutico_id LIMIT 1;
    SELECT id INTO intense_id FROM product_categories WHERE name = 'INTENSE' AND parent_id = terapeutico_id LIMIT 1;

    -- 2. Atualiza produtos HAIFLEX
    IF haiflex_id IS NOT NULL THEN
        UPDATE products 
        SET category_id = haiflex_id 
        WHERE name ILIKE '%HAIFLEX%' 
        AND (category_id = terapeutico_id OR category_id IS NULL OR category_id IN (SELECT id FROM product_categories WHERE parent_id = terapeutico_id));
        RAISE NOTICE 'Produtos HAIFLEX sincronizados.';
    END IF;

    -- 3. Atualiza produtos CLASSE A
    IF classea_id IS NOT NULL THEN
        UPDATE products 
        SET category_id = classea_id 
        WHERE name ILIKE '%CLASSE A%' 
        AND (category_id = terapeutico_id OR category_id IS NULL OR category_id IN (SELECT id FROM product_categories WHERE parent_id = terapeutico_id));
        RAISE NOTICE 'Produtos CLASSE A sincronizados.';
    END IF;

    -- 4. Atualiza produtos CLASSIC
    IF classic_id IS NOT NULL THEN
        UPDATE products 
        SET category_id = classic_id 
        WHERE name ILIKE '%CLASSIC%' 
        AND (category_id = terapeutico_id OR category_id IS NULL OR category_id IN (SELECT id FROM product_categories WHERE parent_id = terapeutico_id));
        RAISE NOTICE 'Produtos CLASSIC sincronizados.';
    END IF;

    -- 5. Atualiza produtos INTENSE
    IF intense_id IS NOT NULL THEN
        UPDATE products 
        SET category_id = intense_id 
        WHERE name ILIKE '%INTENSE%' 
        AND (category_id = terapeutico_id OR category_id IS NULL OR category_id IN (SELECT id FROM product_categories WHERE parent_id = terapeutico_id));
        RAISE NOTICE 'Produtos INTENSE sincronizados.';
    END IF;

    RAISE NOTICE 'Sincronização concluída.';
END $$;
