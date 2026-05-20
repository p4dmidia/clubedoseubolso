-- FIX CONSORTIUM AUTOMATION LOGIC
-- 1. ADAPT SCHEMA
ALTER TABLE public.consortium_groups 
ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id);

ALTER TABLE public.consortium_participants 
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_cpf text,
ADD COLUMN IF NOT EXISTS customer_email text;

ALTER TABLE public.consortium_participants 
ALTER COLUMN user_id DROP NOT NULL;

-- Remove the unique constraint that prevents same user from joining group multiple times
DO $$ 
BEGIN 
    -- Try to find and drop the unique constraint on (group_id, user_id)
    EXECUTE (
        SELECT 'ALTER TABLE public.consortium_participants DROP CONSTRAINT ' || quote_ident(conname)
        FROM pg_constraint 
        WHERE conrelid = 'public.consortium_participants'::regclass 
        AND contype = 'u' 
        AND conkey = (
            SELECT array_agg(attnum ORDER BY attnum) 
            FROM pg_attribute 
            WHERE attrelid = 'public.consortium_participants'::regclass 
            AND attname IN ('group_id', 'user_id')
        )
    );
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Constraint group_id_user_id not found or already dropped';
END $$;

-- 2. UPDATE PROCESSING FUNCTION
CREATE OR REPLACE FUNCTION public.handle_consortium_purchase()
RETURNS trigger AS $$
DECLARE
    v_item RECORD;
    v_group_id uuid;
    v_max_p integer;
    v_group_type text;
    v_lucky_number integer;
    v_group_name text;
BEGIN
    -- Só processa se o status mudar para 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Loop pelos itens do pedido procurando por produtos de "Consórcio"
        FOR v_item IN 
            SELECT oi.*, p.name as p_name, pc.name as cat_name
            FROM public.order_items oi
            JOIN public.products p ON oi.product_id = p.id
            LEFT JOIN public.product_categories pc ON p.category_id = pc.id
            WHERE oi.order_id = NEW.id
            AND (pc.name ILIKE '%Consórcio%' OR p.name ILIKE '%Consórcio%')
        LOOP
            -- Determina o tamanho do grupo: 18 para 'Colchão', 12 para outros
            IF v_item.p_name ILIKE '%Colchão%' OR v_item.cat_name ILIKE '%Colchão%' THEN
                v_max_p := 18;
                v_group_type := 'colchao';
            ELSE
                v_max_p := 12;
                v_group_type := 'livre_escolha';
            END IF;

            -- Busca um grupo aberto para este PRODUTO específico e organização
            SELECT g.id INTO v_group_id
            FROM public.consortium_groups g
            WHERE g.status = 'open'
            AND g.product_id = v_item.product_id  -- AGRUPAMENTO POR PRODUTO
            AND g.organization_id = NEW.organization_id
            AND g.current_participants < v_max_p
            ORDER BY g.created_at ASC   -- Pega o primeiro que foi criado para preencher
            LIMIT 1;

            -- Se não houver grupo aberto para este produto, cria um novo
            IF v_group_id IS NULL THEN
                v_group_name := 'Grupo ' || v_item.p_name || ' #' || 
                    (SELECT count(*) + 1 FROM public.consortium_groups WHERE product_id = v_item.product_id);

                INSERT INTO public.consortium_groups (
                    name,
                    type,
                    max_participants,
                    product_id,
                    organization_id,
                    status,
                    current_participants
                ) VALUES (
                    v_group_name,
                    v_group_type,
                    v_max_p,
                    v_item.product_id,
                    NEW.organization_id,
                    'open',
                    0
                ) RETURNING id INTO v_group_id;
            END IF;

            -- Determina o próximo Número da Sorte disponível no grupo (1 a N)
            SELECT next_num INTO v_lucky_number
            FROM generate_series(1, v_max_p) next_num
            WHERE next_num NOT IN (
                SELECT lucky_number FROM public.consortium_participants WHERE group_id = v_group_id
            )
            ORDER BY next_num ASC
            LIMIT 1;

            -- Adiciona o participante (identificando por CPF/Nome para suportar convidados)
            IF v_lucky_number IS NOT NULL THEN
                INSERT INTO public.consortium_participants (
                    group_id,
                    user_id,
                    customer_name,
                    customer_cpf,
                    customer_email,
                    lucky_number,
                    status
                ) VALUES (
                    v_group_id,
                    NEW.user_id, -- Pode ser NULL se guest, ou ID se logado
                    NEW.customer_name,
                    NEW.customer_cpf,
                    NEW.customer_email,
                    v_lucky_number,
                    'active'
                );

                -- Atualiza a contagem de participantes no grupo
                UPDATE public.consortium_groups
                SET current_participants = (
                    SELECT count(*) FROM public.consortium_participants WHERE group_id = v_group_id
                )
                WHERE id = v_group_id;

                -- Fecha o grupo se atingir a capacidade máxima
                UPDATE public.consortium_groups
                SET status = 'full'
                WHERE id = v_group_id AND current_participants >= max_participants;
            END IF;

        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
