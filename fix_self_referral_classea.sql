-- SCRIPT DE CORREÇÃO DE AUTO-COMISSÃO - CLASSE A (VERSÃO 3 - ULTRA-ROBUSTA)
-- Objetivo: Impedir que o comprador ganhe comissão sobre a própria venda
-- Escopo: Apenas para a organização Classe A (5111af72-27a5-41fd-8ed9-8c51b78b4fdd)

CREATE OR REPLACE FUNCTION public.distribute_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _aff_row public.affiliates%ROWTYPE;
    _curr_sponsor_id uuid;
    _conf_row public.commission_configs%ROWTYPE;
    _comm_amt numeric;
    _gen_idx integer := 0;
    _max_gens integer;
    _dest_user_id uuid;
    _c_classe_a_id uuid := '5111af72-27a5-41fd-8ed9-8c51b78b4fdd';
    _is_mattress boolean := false;
    _cfg_key text;
BEGIN
    -- Só processa se o status mudar para 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Evita processamento duplicado
        IF EXISTS (SELECT 1 FROM public.commissions WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- A. Identificar tipo de Consórcio (Master vs Livre Escolha)
        _is_mattress := EXISTS (
            SELECT 1 FROM public.order_items oi
            JOIN public.products p ON oi.product_id = p.id
            LEFT JOIN public.product_categories pc ON p.category_id = pc.id
            WHERE oi.order_id = NEW.id
            AND (p.name ILIKE '%Colchão%' OR pc.name ILIKE '%Colchão%')
        );

        _cfg_key := CASE WHEN _is_mattress THEN 'mattress' ELSE 'geral' END;

        -- B. Buscar Configurações (Filtrado por Organização)
        SELECT * FROM public.commission_configs 
        WHERE key = _cfg_key AND organization_id = NEW.organization_id 
        LIMIT 1 INTO _conf_row;
        
        IF _conf_row.key IS NULL THEN
            SELECT * FROM public.commission_configs 
            WHERE key = 'geral' AND organization_id = NEW.organization_id 
            LIMIT 1 INTO _conf_row;
        END IF;

        IF _conf_row.key IS NULL THEN
            RETURN NEW;
        END IF;

        _max_gens := _conf_row.active_generations;

        -- C. Identificar o Afiliado que indicou a venda (Geração 1)
        
        -- Prioridade 1: Código de referência no pedido
        IF NEW.referral_code IS NOT NULL AND NEW.referral_code != '' THEN
            SELECT * FROM public.affiliates 
            WHERE LOWER(referral_code) = LOWER(NEW.referral_code) 
            AND organization_id = NEW.organization_id
            AND (
                NEW.organization_id != _c_classe_a_id -- Outros sistemas normal
                OR user_id != NEW.user_id             -- Classe A: ignora se for o próprio comprador
            )
            LIMIT 1 INTO _aff_row;
        END IF;

        -- Prioridade 2: Patrocinador do comprador
        IF _aff_row.id IS NULL AND NEW.user_id IS NOT NULL THEN
            SELECT a.* FROM public.affiliates a
            JOIN public.user_profiles p ON p.sponsor_id = a.user_id
            WHERE p.id = NEW.user_id 
            AND a.organization_id = NEW.organization_id
            AND (
                NEW.organization_id != _c_classe_a_id 
                OR a.user_id != NEW.user_id
            )
            LIMIT 1 INTO _aff_row;
        END IF;

        -- Se não achou nenhum afiliado, interrompe
        IF _aff_row.id IS NULL THEN
            RETURN NEW;
        END IF;

        -- Inicia a subida da rede
        _curr_sponsor_id := _aff_row.id;

        -- D. Distribuir pelos Níveis (Loop)
        WHILE _gen_idx < _max_gens AND _curr_sponsor_id IS NOT NULL LOOP
            _gen_idx := _gen_idx + 1;
            
            -- Busca a porcentagem
            SELECT (lvl->>'value')::numeric FROM jsonb_array_elements(_conf_row.levels) AS lvl
            WHERE (lvl->>'level')::integer = _gen_idx INTO _comm_amt;

            IF _comm_amt IS NOT NULL AND _comm_amt > 0 THEN
                
                -- Calcula o valor
                IF _conf_row.type = 'percent' THEN
                    _comm_amt := NEW.total_amount * (_comm_amt / 100);
                END IF;

                -- Pega o user_id do beneficiário
                SELECT user_id FROM public.affiliates WHERE id = _curr_sponsor_id INTO _dest_user_id;

                IF _dest_user_id IS NOT NULL THEN
                    -- Crédito de Saldo
                    UPDATE public.user_settings 
                    SET 
                        total_earnings = total_earnings + _comm_amt,
                        available_balance = available_balance + _comm_amt,
                        updated_at = now()
                    WHERE user_id = _dest_user_id;

                    -- Registro histórico
                    INSERT INTO public.commissions (
                        organization_id,
                        user_id,
                        order_id,
                        amount,
                        level,
                        commission_type,
                        description
                    ) VALUES (
                        NEW.organization_id,
                        _dest_user_id,
                        NEW.id,
                        _comm_amt,
                        _gen_idx,
                        _conf_row.type,
                        'Comissão ' || _cfg_key || ' Geração ' || _gen_idx || ' - Pedido ' || NEW.id
                    );
                END IF;
            END IF;

            -- Sobe um degrau
            SELECT sponsor_id FROM public.affiliates 
            WHERE id = _curr_sponsor_id 
            AND organization_id = NEW.organization_id INTO _curr_sponsor_id;
            
            -- Break de segurança
            IF _gen_idx > 50 THEN EXIT; END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;
