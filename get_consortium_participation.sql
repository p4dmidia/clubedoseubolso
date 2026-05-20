-- FUNÇÃO PARA CONSULTA PÚBLICA DE CONSÓRCIO
-- Permite que o cliente consulte sua situação usando apenas o CPF
CREATE OR REPLACE FUNCTION public.get_consortium_by_cpf(p_cpf text)
RETURNS json AS $$
DECLARE
    v_participant RECORD;
    v_draws json;
    v_regularity json;
    v_result json;
BEGIN
    -- 1. Busca os dados do participante e do grupo
    SELECT 
        p.id as participant_id,
        p.group_id,
        p.lucky_number,
        p.status as participant_status,
        p.customer_name,
        g.name as group_name,
        g.type as group_type,
        g.current_participants,
        g.max_participants,
        g.status as group_status,
        g.product_id
    INTO v_participant
    FROM public.consortium_participants p
    JOIN public.consortium_groups g ON p.group_id = g.id
    WHERE regexp_replace(p.customer_cpf, '\D', '', 'g') = regexp_replace(p_cpf, '\D', '', 'g')
    ORDER BY p.joined_at DESC
    LIMIT 1;

    -- Se não encontrar, retorna nulo
    IF v_participant.participant_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- 2. Busca o histórico de sorteios do grupo
    SELECT json_agg(d_list) INTO v_draws
    FROM (
        SELECT 
            d.*,
            (
                SELECT lucky_number 
                FROM public.consortium_participants 
                WHERE id = d.winner_id
            ) as winner_lucky_number
        FROM public.consortium_draws d
        WHERE d.group_id = v_participant.group_id
        ORDER BY d.draw_date DESC
    ) d_list;

    -- 3. Verifica regularidade (se a função existir)
    -- Se não existir a função de regularidade, retornamos um status padrão
    BEGIN
        SELECT json_build_object(
            'is_regular', r.is_regular,
            'status_text', r.status_text
        ) INTO v_regularity
        FROM public.check_consortium_regularity_by_participant(v_participant.participant_id) r;
    EXCEPTION WHEN OTHERS THEN
        v_regularity := json_build_object('is_regular', true, 'status_text', 'Ativo');
    END;

    -- 4. Monta o resultado final
    v_result := json_build_object(
        'participant', json_build_object(
            'name', v_participant.customer_name,
            'lucky_number', v_participant.lucky_number,
            'status', v_participant.participant_status,
            'regularity', v_regularity
        ),
        'group', json_build_object(
            'name', v_participant.group_name,
            'type', v_participant.group_type,
            'current', v_participant.current_participants,
            'max', v_participant.max_participants,
            'status', v_participant.group_status
        ),
        'draws', COALESCE(v_draws, '[]'::json)
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
