-- 1. LIMPEZA TOTAL E SEGURA
DROP TRIGGER IF EXISTS tr_on_order_paid_consortium ON public.orders;
DROP FUNCTION IF EXISTS public.handle_consortium_purchase();

-- 2. GARANTIR CONSTRAINT FLEXÍVEL (Não quebra outros sistemas)
ALTER TABLE public.consortium_groups DROP CONSTRAINT IF EXISTS consortium_groups_type_check;
ALTER TABLE public.consortium_groups ADD CONSTRAINT consortium_groups_type_check 
    CHECK (type IN ('colchao', 'livre_escolha', 'standard'));

-- 3. FUNÇÃO COM SINTAXE ULTRA-SEGURA (Sem subconsultas aninhadas em expressões)
CREATE OR REPLACE FUNCTION public.handle_consortium_purchase()
RETURNS trigger AS $$
DECLARE
    row_item RECORD;
    target_group_id uuid;
    limit_participants integer;
    group_type_slug text;
    next_lucky_num integer;
    new_name text;
    group_counter integer;
    current_idx integer;
    participants_count integer;
BEGIN
    -- Só processa se o status mudar para 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Loop pelos itens do pedido
        FOR row_item IN 
            SELECT oi.id, oi.product_id, oi.quantity, p.name as p_name
            FROM public.order_items oi
            JOIN public.products p ON oi.product_id = p.id
            LEFT JOIN public.product_categories pc ON p.category_id = pc.id
            WHERE oi.order_id = NEW.id
            AND (
                pc.name ILIKE '%Consórcio%' 
                OR p.name ILIKE '%Consórcio%' 
                OR p.name ILIKE '%Concorcio%'
            )
        LOOP
            -- Definição de regras por nome do produto
            IF row_item.p_name ILIKE '%Livre Escolha%' THEN
                limit_participants := 12;
                group_type_slug := 'livre_escolha';
            ELSE
                limit_participants := 18;
                group_type_slug := 'colchao';
            END IF;

            -- Loop para cada cota comprada
            FOR current_idx IN 1..row_item.quantity LOOP
                
                -- Busca grupo aberto (Sintaxe simples)
                target_group_id := NULL;
                SELECT g.id INTO target_group_id
                FROM public.consortium_groups g
                WHERE g.status = 'open'
                AND g.max_participants = limit_participants
                AND g.organization_id = NEW.organization_id
                AND g.current_participants < limit_participants
                ORDER BY g.created_at ASC
                LIMIT 1;

                -- Cria grupo se necessário
                IF target_group_id IS NULL THEN
                    SELECT count(*) + 1 INTO group_counter 
                    FROM public.consortium_groups 
                    WHERE max_participants = limit_participants 
                    AND organization_id = NEW.organization_id;

                    new_name := 'Grupo ' || 
                        CASE WHEN limit_participants = 12 THEN 'Livre Escolha 12' ELSE 'Fixo 18' END || 
                        ' #' || group_counter;

                    INSERT INTO public.consortium_groups (
                        name, type, max_participants, organization_id, status, current_participants, product_id
                    ) VALUES (
                        new_name, group_type_slug, limit_participants, NEW.organization_id, 'open', 0, row_item.product_id
                    ) RETURNING id INTO target_group_id;
                END IF;

                -- Busca número da sorte (Simplificado sem variável em subquery problemática)
                SELECT next_num INTO next_lucky_num
                FROM generate_series(1, limit_participants) next_num
                WHERE next_num NOT IN (
                    SELECT lucky_number 
                    FROM public.consortium_participants 
                    WHERE group_id = target_group_id
                )
                ORDER BY next_num ASC
                LIMIT 1;

                -- Adiciona participante
                IF next_lucky_num IS NOT NULL THEN
                    INSERT INTO public.consortium_participants (
                        group_id, user_id, customer_name, customer_cpf, customer_email, lucky_number, status
                    ) VALUES (
                        target_group_id, NEW.user_id, NEW.customer_name, NEW.customer_cpf, NEW.customer_email, next_lucky_num, 'active'
                    );

                    -- Atualiza contagem (Manual e simples)
                    SELECT count(*) INTO participants_count 
                    FROM public.consortium_participants 
                    WHERE group_id = target_group_id;

                    UPDATE public.consortium_groups
                    SET current_participants = participants_count
                    WHERE id = target_group_id;

                    -- Fecha grupo se cheio
                    IF participants_count >= limit_participants THEN
                        UPDATE public.consortium_groups
                        SET status = 'full'
                        WHERE id = target_group_id;
                    END IF;
                END IF;

            -- Fim loop quantidade
            END LOOP;
        -- Fim loop itens
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. REATIVAR GATILHO
CREATE TRIGGER tr_on_order_paid_consortium
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    WHEN (NEW.status = 'Pago')
    EXECUTE FUNCTION public.handle_consortium_purchase();
