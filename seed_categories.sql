-- Script robusto para cadastrar categorias e subcategorias
-- Este script verifica se a categoria já existe antes de inserir, evitando erros de duplicidade.

DO $$
DECLARE
    cat_id_cama bigint;
    cat_id_acessorios bigint;
    cat_id_vest_masc bigint;
    cat_id_calc_masc bigint;
    cat_id_fem bigint;
    cat_id_consorcio bigint;
    cat_id_promocoes bigint;
BEGIN
    -- 1. Categoria: Cama
    INSERT INTO public.product_categories (name) 
    VALUES ('Cama') 
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
    RETURNING id INTO cat_id_cama;

    INSERT INTO public.product_subcategories (name, category_id) VALUES 
        ('Base Box', cat_id_cama),
        ('Travesseiros', cat_id_cama),
        ('Cabeceiras', cat_id_cama),
        ('Colchões Estáticos', cat_id_cama),
        ('Colchões Terapêuticos', cat_id_cama)
    ON CONFLICT (name, category_id) DO NOTHING;

    -- 2. Categoria: Acessórios
    INSERT INTO public.product_categories (name) 
    VALUES ('Acessórios') 
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
    RETURNING id INTO cat_id_acessorios;

    INSERT INTO public.product_subcategories (name, category_id) VALUES 
        ('Carteiras', cat_id_acessorios),
        ('Cintos', cat_id_acessorios),
        ('Pulseiras', cat_id_acessorios)
    ON CONFLICT (name, category_id) DO NOTHING;

    -- 3. Categoria: Vestuário Masculino
    INSERT INTO public.product_categories (name) 
    VALUES ('Vestuário Masculino') 
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
    RETURNING id INTO cat_id_vest_masc;

    INSERT INTO public.product_subcategories (name, category_id) VALUES 
        ('Bermudas', cat_id_vest_masc),
        ('Camisetas', cat_id_vest_masc),
        ('Calças', cat_id_vest_masc),
        ('Camisa Polo', cat_id_vest_masc),
        ('Camisa Social Manga Curta', cat_id_vest_masc),
        ('Camisa Social Manga Longa', cat_id_vest_masc),
        ('Ternos & Blazers', cat_id_vest_masc)
    ON CONFLICT (name, category_id) DO NOTHING;

    -- 4. Categoria: Calçado Masculino
    INSERT INTO public.product_categories (name) 
    VALUES ('Calçado Masculino') 
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
    RETURNING id INTO cat_id_calc_masc;

    INSERT INTO public.product_subcategories (name, category_id) VALUES 
        ('Sapatênis', cat_id_calc_masc),
        ('Tênis', cat_id_calc_masc),
        ('Sapato Social', cat_id_calc_masc),
        ('Chinelos', cat_id_calc_masc)
    ON CONFLICT (name, category_id) DO NOTHING;

    -- 5. Categoria: Feminino
    INSERT INTO public.product_categories (name) 
    VALUES ('Feminino') 
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
    RETURNING id INTO cat_id_fem;

    INSERT INTO public.product_subcategories (name, category_id) VALUES 
        ('Acessórios Femininos', cat_id_fem),
        ('Calçados', cat_id_fem),
        ('Vestuário Feminino', cat_id_fem)
    ON CONFLICT (name, category_id) DO NOTHING;

    -- 6. Categoria: Consórcio
    INSERT INTO public.product_categories (name) 
    VALUES ('Consórcio') 
    ON CONFLICT (name) DO NOTHING;

    -- 7. Categoria: Promoções
    INSERT INTO public.product_categories (name) 
    VALUES ('Promoções') 
    ON CONFLICT (name) DO NOTHING;

END $$;
