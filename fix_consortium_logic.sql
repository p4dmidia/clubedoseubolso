-- 1. DROP EXISTING TRIGGER TO PREVENT CONFLICTS
DROP TRIGGER IF EXISTS tr_on_order_paid_consortium ON public.orders;

-- 2. UPDATE THE FUNCTION
CREATE OR REPLACE FUNCTION public.handle_consortium_purchase()
RETURNS trigger AS $$
DECLARE
    v_item RECORD;
    v_group_id uuid;
    v_max_p integer;
    v_group_type text;
    v_lucky_number integer;
    v_group_name text;
    v_i integer;
BEGIN
    -- Só processa se o status mudar para 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Loop pelos itens do pedido procurando por produtos de "Consórcio"
        -- DISTINCT ON (oi.id) garante que não processemos o mesmo item duas vezes caso haja joins duplicados
        FOR v_item IN 
            SELECT DISTINCT ON (oi.id) oi.*, p.name as p_name, pc.name as cat_name
            FROM public.order_items oi
            JOIN public.products p ON oi.product_id = p.id
            LEFT JOIN public.product_categories pc ON p.category_id = pc.id
            WHERE oi.order_id = NEW.id
            AND (pc.name ILIKE '%Consórcio%' OR p.name ILIKE '%Consórcio%' OR p.name ILIKE '%Concorcio%')
        LOOP
            -- REGRA DE TAMANHO: 
            -- SE "Livre Escolha" -> 12 pessoas, QUALQUER OUTRO -> 18 pessoas
            IF v_item.p_name ILIKE '%Livre Escolha%' THEN
                v_max_p := 12;
                v_group_type := 'livre_escolha';
            ELSE
                v_max_p := 18;
                v_group_type := 'standard'; -- Usamos 'standard' ou 'colchao'? O usuário disse 18 para outros.
            END IF;

            -- LOOP POR QUANTIDADE (Suporte a múltiplas cotas)
            FOR v_i IN 1..v_item.quantity LOOP
                
                -- Busca um grupo aberto com o tamanho e organização específicos
                -- Não filtramos mais por product_id para permitir compartilhamento de grupos
                SELECT g.id INTO v_group_id
                FROM public.consortium_groups g
                WHERE g.status = 'open'
                AND g.max_participants = v_max_p
                AND g.organization_id = NEW.organization_id
                AND g.current_participants < v_max_p
                ORDER BY g.created_at ASC
                LIMIT 1;

                -- Se não houver grupo disponível, cria um novo
                IF v_group_id IS NULL THEN
                    v_group_name := 'Grupo ' || 
                        CASE WHEN v_max_p = 12 THEN 'Livre Escolha 12' ELSE 'Fixo 18' END || 
                        ' #' || (SELECT count(*) + 1 FROM public.consortium_groups WHERE max_participants = v_max_p AND organization_id = NEW.organization_id);

                    INSERT INTO public.consortium_groups (
                        name,
                        type,
                        max_participants,
                        organization_id,
                        status,
                        current_participants,
                        product_id -- Mantemos apenas para referência do produto inicial
                    ) VALUES (
                        v_group_name,
                        v_group_type,
                        v_max_p,
                        NEW.organization_id,
                        'open',
                        0,
                        v_item.product_id
                    ) RETURNING id INTO v_group_id;
                END IF;

                -- Busca próximo número da sorte disponível (1 a N)
                SELECT next_num INTO v_lucky_number
                FROM generate_series(1, v_max_p) next_num
                WHERE next_num NOT IN (
                    SELECT lucky_number FROM public.consortium_participants WHERE group_id = v_group_id
                )
                ORDER BY next_num ASC
                LIMIT 1;

                -- Adiciona o participante
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
                        NEW.user_id,
                        NEW.customer_name,
                        NEW.customer_cpf,
                        NEW.customer_email,
                        v_lucky_number,
                        'active'
                    );

                    -- Atualiza contagem
                    UPDATE public.consortium_groups
                    SET current_participants = (
                        SELECT count(*) FROM public.consortium_participants WHERE group_id = v_group_id
                    )
                    WHERE id = v_group_id;

                    -- Fecha grupo se cheio
                    UPDATE public.consortium_groups
                    SET status = 'full'
                    WHERE id = v_group_id AND current_participants >= max_participants;
                END IF;

            END LOOP; -- Fim do loop de quantidade

        END LOOP; -- Fim do loop de itens
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RECREATE TRIGGER
CREATE TRIGGER tr_on_order_paid_consortium
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    WHEN (NEW.status = 'Pago')
    EXECUTE FUNCTION public.handle_consortium_purchase();
