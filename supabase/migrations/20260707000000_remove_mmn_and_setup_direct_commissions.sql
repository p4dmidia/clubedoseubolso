-- Migration: Remove MMN and setup direct commissions with active status check and balance freezing (Abordagem B)
-- Path: supabase/migrations/20260707000000_remove_mmn_and_setup_direct_commissions.sql

-- 1. Recriar is_affiliate_active para incluir verificação correta de maintenance_expires_at, active_until, indicações e plano próprio
CREATE OR REPLACE FUNCTION public.is_affiliate_active(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
    v_created_at timestamp with time zone;
    v_has_recent_referral boolean;
    v_has_active_own_plan boolean;
    v_active_until timestamp with time zone;
    v_maintenance_expires_at timestamp with time zone;
    v_role text;
BEGIN
    -- Obter dados de perfil do usuário
    SELECT role, maintenance_expires_at INTO v_role, v_maintenance_expires_at
    FROM public.user_profiles WHERE id = p_user_id;

    IF v_role IS NULL THEN
        RETURN false;
    END IF;

    -- Admins são sempre considerados ativos
    IF v_role IN ('admin_master', 'admin_op', 'admin') THEN
        RETURN true;
    END IF;

    -- Obter a data de criação do afiliado
    SELECT created_at INTO v_created_at FROM public.affiliates WHERE user_id = p_user_id;
    IF v_created_at IS NULL THEN
        RETURN false;
    END IF;

    -- Primeiros 30 dias após cadastro são considerados ativos (onboarding grátis)
    IF now() < v_created_at + interval '30 days' THEN
        RETURN true;
    END IF;

    -- Verificar se a data de manutenção mensal está em dia
    IF v_maintenance_expires_at IS NOT NULL AND now() <= v_maintenance_expires_at THEN
        RETURN true;
    END IF;

    -- Verificar se há uma ativação manual ativa (campo active_until no futuro)
    SELECT active_until INTO v_active_until FROM public.user_settings WHERE user_id = p_user_id;
    IF v_active_until IS NOT NULL AND now() <= v_active_until THEN
        RETURN true;
    END IF;

    -- Condição B (Consumo Interno): Verificar se o próprio afiliado possui um plano de telemedicina ativo (Pago nos últimos 30 dias)
    SELECT EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.order_items oi ON oi.order_id = o.id
        JOIN public.products p ON oi.product_id = p.id
        LEFT JOIN public.product_categories pc ON p.category_id = pc.id
        WHERE o.user_id = p_user_id
          AND o.status = 'Pago'
          AND (pc.name = 'Planos' OR p.name ILIKE '%Telemedicina%')
          AND o.created_at >= now() - interval '30 days'
    ) INTO v_has_active_own_plan;

    IF v_has_active_own_plan THEN
        RETURN true;
    END IF;

    -- Condição A (Produtividade): Verificar se indicou pelo menos 1 assinante (cliente ou afiliado) nos últimos 30 dias
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE sponsor_id = p_user_id
          AND created_at >= now() - interval '30 days'
    ) INTO v_has_recent_referral;

    RETURN v_has_recent_referral;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Recriar a função distribute_commissions para aplicar comissões diretas de nível único e suspensão de recorrências
CREATE OR REPLACE FUNCTION public.distribute_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_affiliate RECORD;
    v_master_user_id uuid;
    v_target_user_id uuid;
    
    v_commission_amount numeric;
    v_is_renewal boolean;
    v_is_active boolean;
    v_description text;
    v_category_name text;
    v_variations jsonb;
    v_maintenance_expiry timestamp with time zone;
BEGIN
    -- Só processa se o status mudar para 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Evitar processamento duplicado
        IF EXISTS (SELECT 1 FROM public.commissions WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- Buscar o ID Master da organização (fallback para quem não tem patrocinador)
        SELECT user_id INTO v_master_user_id 
        FROM public.affiliates 
        WHERE organization_id = NEW.organization_id 
          AND (referral_code = 'master' OR sponsor_id IS NULL)
        ORDER BY created_at ASC 
        LIMIT 1;

        IF v_master_user_id IS NULL THEN
            SELECT user_id INTO v_master_user_id 
            FROM public.affiliates 
            WHERE organization_id = NEW.organization_id
            ORDER BY created_at ASC 
            LIMIT 1;
        END IF;

        -- Identificar o patrocinador direto (Geração 1)
        -- Prioridade 1: Código de referência no pedido
        IF NEW.referral_code IS NOT NULL AND NEW.referral_code != '' THEN
            SELECT * INTO v_affiliate FROM public.affiliates 
            WHERE LOWER(referral_code) = LOWER(NEW.referral_code) 
              AND organization_id = NEW.organization_id
            LIMIT 1;
        END IF;

        -- Prioridade 2: Patrocinador registrado no perfil do comprador
        IF v_affiliate IS NULL AND NEW.user_id IS NOT NULL THEN
            SELECT a.* INTO v_affiliate 
            FROM public.affiliates a
            JOIN public.user_profiles p ON p.sponsor_id = a.user_id
            WHERE p.id = NEW.user_id 
              AND a.organization_id = NEW.organization_id
            LIMIT 1;
        END IF;

        -- Se não achou nenhum afiliador, todas as comissões vão para o ID Master
        IF v_affiliate IS NULL THEN
            v_target_user_id := v_master_user_id;
        ELSE
            v_target_user_id := v_affiliate.user_id;
        END IF;

        -- Loop nos itens do pedido para calcular a comissão e processar ativações
        FOR v_item IN 
            SELECT product_id, product_name, unit_price, quantity 
            FROM public.order_items 
            WHERE order_id = NEW.id 
        LOOP
            v_commission_amount := 0;
            v_is_renewal := false;

            -- Buscar categoria e variações do produto
            SELECT pc.name, p.variations INTO v_category_name, v_variations
            FROM public.products p
            LEFT JOIN public.product_categories pc ON p.category_id = pc.id
            WHERE p.id = v_item.product_id;

            -- A. PRODUTO É UM PLANO DE ASSINATURA (Categoria 'Planos' ou nome contendo 'Telemedicina')
            IF v_category_name = 'Planos' OR v_item.product_name ILIKE '%Telemedicina%' THEN
                
                -- Verificar se é uma mensalidade (recorrência) ou adesão (primeira compra)
                SELECT EXISTS (
                    SELECT 1 
                    FROM public.order_items oi
                    JOIN public.orders o ON oi.order_id = o.id
                    JOIN public.products p ON oi.product_id = p.id
                    LEFT JOIN public.product_categories pc ON p.category_id = pc.id
                    WHERE o.user_id = NEW.user_id
                      AND o.status = 'Pago'
                      AND o.id != NEW.id
                      AND (pc.name = 'Planos' OR p.name ILIKE '%Telemedicina%')
                ) INTO v_is_renewal;

                IF v_is_renewal THEN
                    -- Comissão mensal das recorrências
                    v_commission_amount := COALESCE((v_variations->>'comissao_mensal')::numeric, 0);
                ELSE
                    -- Comissão de adesão da primeira compra
                    v_commission_amount := COALESCE((v_variations->>'comissao_adesao')::numeric, 0);
                END IF;

            -- B. TAXAS DE SISTEMA (ADESÃO / MANUTENÇÃO EVA)
            ELSIF v_item.product_id = 'd3b07384-d113-4171-bc05-9a7c936df312' THEN
                -- Adesão/Ativação EVA: Define 30 dias de expiração a partir de hoje
                v_maintenance_expiry := now() + interval '30 days';

                UPDATE public.affiliates
                SET is_active = true,
                    is_delinquent = false,
                    maintenance_expires_at = v_maintenance_expiry,
                    updated_at = now()
                WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id;

                UPDATE public.user_profiles
                SET is_active = true,
                    is_delinquent = false,
                    maintenance_expires_at = v_maintenance_expiry,
                    updated_at = now()
                WHERE id = NEW.user_id AND organization_id = NEW.organization_id;

                -- Atualizar active_until nas configurações
                INSERT INTO public.user_settings (user_id, organization_id, active_until)
                VALUES (NEW.user_id, NEW.organization_id, v_maintenance_expiry)
                ON CONFLICT (user_id) DO UPDATE SET 
                    active_until = v_maintenance_expiry,
                    updated_at = now();

                -- Liberar saldo bloqueado acumulado
                UPDATE public.user_settings
                SET available_balance = available_balance + frozen_balance,
                    frozen_balance = 0,
                    updated_at = now()
                WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id;

            ELSIF v_item.product_id = 'd3b07384-d113-4171-bc06-9a7c936df312' THEN
                -- Manutenção Mensal EVA: Adiciona 30 dias à expiração da assinatura
                SELECT maintenance_expires_at INTO v_maintenance_expiry
                FROM public.user_profiles
                WHERE id = NEW.user_id AND organization_id = NEW.organization_id;

                IF v_maintenance_expiry IS NULL OR v_maintenance_expiry < now() THEN
                    v_maintenance_expiry := now() + interval '30 days';
                ELSE
                    v_maintenance_expiry := v_maintenance_expiry + interval '30 days';
                END IF;

                UPDATE public.affiliates
                SET is_active = true,
                    is_delinquent = false,
                    maintenance_expires_at = v_maintenance_expiry,
                    updated_at = now()
                WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id;

                UPDATE public.user_profiles
                SET is_active = true,
                    is_delinquent = false,
                    maintenance_expires_at = v_maintenance_expiry,
                    updated_at = now()
                WHERE id = NEW.user_id AND organization_id = NEW.organization_id;

                -- Atualizar active_until nas configurações
                INSERT INTO public.user_settings (user_id, organization_id, active_until)
                VALUES (NEW.user_id, NEW.organization_id, v_maintenance_expiry)
                ON CONFLICT (user_id) DO UPDATE SET 
                    active_until = v_maintenance_expiry,
                    updated_at = now();

                -- Liberar saldo bloqueado acumulado
                UPDATE public.user_settings
                SET available_balance = available_balance + frozen_balance,
                    frozen_balance = 0,
                    updated_at = now()
                WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id;
            
            -- C. OUTROS PRODUTOS (COMISSÃO FIXA)
            ELSE
                v_commission_amount := COALESCE((v_variations->>'comissao')::numeric, 0);
            END IF;

            -- Aplicar a quantidade do item comprado
            v_commission_amount := v_commission_amount * v_item.quantity;

            -- D. CREDITAR E LOGAR A COMISSÃO
            IF v_commission_amount > 0 AND v_target_user_id IS NOT NULL THEN
                -- Garantir que a carteira exista
                INSERT INTO public.user_settings (user_id, organization_id, total_earnings, available_balance, frozen_balance)
                VALUES (v_target_user_id, NEW.organization_id, 0, 0, 0)
                ON CONFLICT (user_id) DO NOTHING;

                -- Verificar se o afiliado destinatário está ativo
                v_is_active := public.is_affiliate_active(v_target_user_id);

                IF v_is_active THEN
                    -- Fluxo Normal: Credita no saldo disponível
                    UPDATE public.user_settings
                    SET total_earnings = total_earnings + v_commission_amount,
                        available_balance = available_balance + v_commission_amount,
                        updated_at = now()
                    WHERE user_id = v_target_user_id AND organization_id = NEW.organization_id;

                    v_description := 'Comissão Direta - ' || v_item.product_name || ' (Pedido ' || NEW.id || ')';
                    
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
                        v_target_user_id,
                        NEW.id,
                        v_commission_amount,
                        1,
                        'direct',
                        v_description
                    );
                ELSE
                    -- Afiliado Inativo
                    IF v_is_renewal THEN
                        -- Comissão Recorrente (Mensalidade) -> Perda Permanente! (Cláusula Quinta 5.5)
                        -- Vai para o ID Master (GD Finance) e NÃO acumula no frozen_balance
                        UPDATE public.user_settings
                        SET total_earnings = total_earnings + v_commission_amount,
                            available_balance = available_balance + v_commission_amount,
                            updated_at = now()
                        WHERE user_id = v_master_user_id AND organization_id = NEW.organization_id;

                        v_description := 'Comissão Recorrente Perdida (Patrocinador Inativo redirecionado ao Master) - ' || v_item.product_name || ' (Pedido ' || NEW.id || ')';

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
                            v_master_user_id,
                            NEW.id,
                            v_commission_amount,
                            1,
                            'redirected_recurrent_lost',
                            v_description
                        );
                    ELSE
                        -- Comissão de Adesão -> Vai para frozen_balance (Abordagem B)
                        UPDATE public.user_settings
                        SET total_earnings = total_earnings + v_commission_amount,
                            frozen_balance = frozen_balance + v_commission_amount,
                            updated_at = now()
                        WHERE user_id = v_target_user_id AND organization_id = NEW.organization_id;

                        v_description := 'Comissão Adesão Retida (Afiliado Inativo) - ' || v_item.product_name || ' (Pedido ' || NEW.id || ')';

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
                            v_target_user_id,
                            NEW.id,
                            v_commission_amount,
                            1,
                            'held_in_gd_finance',
                            v_description
                        );
                    END IF;
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;


-- 3. Criar RPC para ativação manual utilizando o saldo retido/disponível acumulado
CREATE OR REPLACE FUNCTION public.activate_affiliate_with_balance(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_frozen numeric;
    v_available numeric;
    v_deducted numeric := 0;
    v_fee numeric := 17.00;
    v_maintenance_expiry timestamp with time zone;
    v_org_id uuid;
BEGIN
    -- Obter a organização
    SELECT organization_id INTO v_org_id FROM public.user_profiles WHERE id = p_user_id LIMIT 1;
    IF v_org_id IS NULL THEN
        v_org_id := '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid;
    END IF;

    -- Obter saldos atuais
    SELECT COALESCE(frozen_balance, 0), COALESCE(available_balance, 0) INTO v_frozen, v_available
    FROM public.user_settings
    WHERE user_id = p_user_id AND organization_id = v_org_id;

    IF v_frozen IS NULL THEN
        v_frozen := 0;
    END IF;
    IF v_available IS NULL THEN
        v_available := 0;
    END IF;

    -- Verificar se possui saldo suficiente no total
    IF v_frozen + v_available < v_fee THEN
        RAISE EXCEPTION 'Saldo insuficiente para ativação. Saldo Total: %, Taxa: %', (v_frozen + v_available), v_fee;
    END IF;

    -- Deduzir os 17.00 priorizando o saldo bloqueado
    IF v_frozen >= v_fee THEN
        v_frozen := v_frozen - v_fee;
    ELSE
        v_fee := v_fee - v_frozen;
        v_frozen := 0;
        v_available := v_available - v_fee;
    END IF;

    -- Todo o saldo bloqueado restante é liberado para o saldo disponível
    v_available := v_available + v_frozen;
    v_frozen := 0;

    -- Atualizar saldos no banco
    UPDATE public.user_settings
    SET 
        frozen_balance = v_frozen,
        available_balance = v_available,
        updated_at = now()
    WHERE user_id = p_user_id AND organization_id = v_org_id;

    -- Estender a data de ativação por 30 dias
    SELECT maintenance_expires_at INTO v_maintenance_expiry
    FROM public.user_profiles
    WHERE id = p_user_id AND organization_id = v_org_id;

    IF v_maintenance_expiry IS NULL OR v_maintenance_expiry < now() THEN
        v_maintenance_expiry := now() + interval '30 days';
    ELSE
        v_maintenance_expiry := v_maintenance_expiry + interval '30 days';
    END IF;

    UPDATE public.affiliates
    SET is_active = true,
        is_delinquent = false,
        maintenance_expires_at = v_maintenance_expiry,
        updated_at = now()
    WHERE user_id = p_user_id AND organization_id = v_org_id;

    UPDATE public.user_profiles
    SET is_active = true,
        is_delinquent = false,
        maintenance_expires_at = v_maintenance_expiry,
        updated_at = now()
    WHERE id = p_user_id AND organization_id = v_org_id;

    -- Atualizar active_until nas configurações
    UPDATE public.user_settings
    SET active_until = v_maintenance_expiry,
        updated_at = now()
    WHERE user_id = p_user_id AND organization_id = v_org_id;

    -- Logar a dedução da taxa no histórico de transações/comissões (valor negativo)
    INSERT INTO public.commissions (
        organization_id,
        user_id,
        amount,
        level,
        commission_type,
        description
    ) VALUES (
        v_org_id,
        p_user_id,
        -17.00,
        1,
        'maintenance_fee',
        'Taxa de Manutenção Descontada do Saldo'
    );
END;
$$;
