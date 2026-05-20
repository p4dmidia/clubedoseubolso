-- ==========================================
-- SCRIPT DE MIGRACAO: CLUBE DO SEU BOLSO V1.1
-- ==========================================
-- Instrucoes: Copie e cole este script no Editor SQL (SQL Editor) do painel do seu Supabase e execute-o.

-- 1. ADICIONAR COLUNAS DE INADIMPLENCIA E EXPIRACAO
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS maintenance_expires_at timestamp with time zone;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_delinquent boolean DEFAULT false;

ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS maintenance_expires_at timestamp with time zone;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS is_delinquent boolean DEFAULT false;


-- 2. CADASTRO DAS NOVAS CATEGORIAS
INSERT INTO public.product_categories (name, parent_id, organization_id)
SELECT name, parent_id, organization_id
FROM (
    VALUES 
    ('Telemedicina'::text, NULL::integer, '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid),
    ('Energia por Assinatura'::text, NULL::integer, '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid),
    ('Estratégias de Crédito'::text, NULL::integer, '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid),
    ('Sistema'::text, NULL::integer, '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid)
) AS v(name, parent_id, organization_id)
WHERE NOT EXISTS (
    SELECT 1 FROM public.product_categories pc 
    WHERE pc.name = v.name AND pc.organization_id = v.organization_id
);


-- 3. CADASTRO DOS PRODUTOS E TAXAS DE SISTEMA (IDEMPOTENTE COM UUIDs FIXOS)
DO $$
DECLARE
    v_telemed_id bigint;
    v_sistema_id bigint;
    v_energia_id bigint;
    v_credito_id bigint;
    v_org_id uuid := '5111af72-27a5-41fd-8ed9-8c51b78b4fdd';
BEGIN
    -- Obter os IDs das categorias correspondentes
    SELECT id INTO v_telemed_id FROM public.product_categories WHERE name = 'Telemedicina' AND organization_id = v_org_id;
    SELECT id INTO v_sistema_id FROM public.product_categories WHERE name = 'Sistema' AND organization_id = v_org_id;
    SELECT id INTO v_energia_id FROM public.product_categories WHERE name = 'Energia por Assinatura' AND organization_id = v_org_id;
    SELECT id INTO v_credito_id FROM public.product_categories WHERE name = 'Estratégias de Crédito' AND organization_id = v_org_id;

    -- Telemedicina Individual Essencial
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc01-9a7c936df312', 'Telemedicina Individual Essencial', 'Plano de telemedicina individual essencial', 17.90, v_telemed_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Telemedicina Individual Premium
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc02-9a7c936df312', 'Telemedicina Individual Premium', 'Plano de telemedicina individual premium', 34.90, v_telemed_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Telemedicina Familiar Essencial
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc03-9a7c936df312', 'Telemedicina Familiar Essencial', 'Plano de telemedicina familiar essencial', 44.90, v_telemed_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Telemedicina Familiar Premium
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc04-9a7c936df312', 'Telemedicina Familiar Premium', 'Plano de telemedicina familiar premium', 87.90, v_telemed_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Taxa de Adesão EVA
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc05-9a7c936df312', 'Adesão Escritório Virtual', 'Taxa de ativação do Escritório Virtual do Afiliado', 44.00, v_sistema_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Taxa de Manutenção EVA
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc06-9a7c936df312', 'Manutenção Mensal EVA', 'Taxa de manutenção mensal do Escritório Virtual do Afiliado', 17.00, v_sistema_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Simulação de Energia
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc07-9a7c936df312', 'Simulação de Energia por Assinatura', 'Formulário de captação de lead para energia limpa', 0.00, v_energia_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;

    -- Simulação de Crédito
    INSERT INTO public.products (id, name, description, price, category_id, is_active, organization_id)
    VALUES ('d3b07384-d113-4171-bc08-9a7c936df312', 'Simulação de Estratégias de Crédito', 'Formulário de captação de lead para portabilidade/redução de juros', 0.00, v_credito_id, true, v_org_id)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, category_id = EXCLUDED.category_id, is_active = true;
END $$;


-- 4. DESATIVAR PRODUTOS ANTIGOS DO CATALOGO
UPDATE public.products
SET is_active = false
WHERE organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'
  AND id NOT IN (
    'd3b07384-d113-4171-bc01-9a7c936df312',
    'd3b07384-d113-4171-bc02-9a7c936df312',
    'd3b07384-d113-4171-bc03-9a7c936df312',
    'd3b07384-d113-4171-bc04-9a7c936df312',
    'd3b07384-d113-4171-bc05-9a7c936df312',
    'd3b07384-d113-4171-bc06-9a7c936df312',
    'd3b07384-d113-4171-bc07-9a7c936df312',
    'd3b07384-d113-4171-bc08-9a7c936df312'
  );


-- 5. FUNÇÃO E CRON DE VERIFICAÇÃO DIÁRIA DE INADIMPLÊNCIA
CREATE OR REPLACE FUNCTION public.check_delinquency()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Atualizar afiliados cujo prazo de manutenção mensal expirou
    UPDATE public.affiliates
    SET is_active = false,
        is_delinquent = true,
        updated_at = now()
    WHERE organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'
      AND maintenance_expires_at IS NOT NULL
      AND maintenance_expires_at < now()
      AND (is_active = true OR is_delinquent = false);

    -- Atualizar perfis correspondentes
    UPDATE public.user_profiles
    SET is_active = false,
        is_delinquent = true,
        updated_at = now()
    WHERE organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'
      AND maintenance_expires_at IS NOT NULL
      AND maintenance_expires_at < now()
      AND (is_active = true OR is_delinquent = false);
END;
$$;


-- 6. ATUALIZAÇÃO DA FUNÇÃO E TRIGGER DE DISTRIBUIÇÃO E ATIVAÇÃO
CREATE OR REPLACE FUNCTION public.distribute_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_affiliate RECORD;
    v_master_affiliate_id uuid;
    v_master_user_id uuid;
    v_target_user_id uuid;
    
    v_commission_amount numeric;
    v_is_renewal boolean;
    v_sponsor_is_active boolean;
    v_sponsor_is_delinquent boolean;
    v_description text;
BEGIN
    -- Só processa se o status mudar para 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Evita processamento de comissão duplicado para o mesmo pedido
        IF EXISTS (SELECT 1 FROM public.commissions WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- Buscar o afiliado patrocinador que indicou a venda (Geração 1)
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

        -- Buscar o ID Master da organização (o afiliado raiz sem patrocinador ou com código 'master')
        SELECT id, user_id INTO v_master_affiliate_id, v_master_user_id 
        FROM public.affiliates 
        WHERE organization_id = NEW.organization_id 
          AND (referral_code = 'master' OR sponsor_id IS NULL)
        ORDER BY created_at ASC 
        LIMIT 1;

        -- Se mesmo assim não achou o master, pega o primeiro afiliado registrado na organização
        IF v_master_user_id IS NULL THEN
            SELECT id, user_id INTO v_master_affiliate_id, v_master_user_id 
            FROM public.affiliates 
            WHERE organization_id = NEW.organization_id
            ORDER BY created_at ASC 
            LIMIT 1;
        END IF;

        -- Loop nos itens do pedido para aplicar a comissão ou ativar as taxas do EVA
        FOR v_item IN 
            SELECT product_id, product_name, unit_price, quantity 
            FROM public.order_items 
            WHERE order_id = NEW.id 
        LOOP
            v_commission_amount := 0;
            v_is_renewal := false;

            -- A. PRODUTOS DE TELEMEDICINA
            IF v_item.product_id IN (
                'd3b07384-d113-4171-bc01-9a7c936df312', -- Individual Essencial
                'd3b07384-d113-4171-bc02-9a7c936df312', -- Individual Premium
                'd3b07384-d113-4171-bc03-9a7c936df312', -- Familiar Essencial
                'd3b07384-d113-4171-bc04-9a7c936df312'  -- Familiar Premium
            ) THEN
                -- Verificar se é uma mensalidade (recorrência) ou primeira compra (adesão)
                SELECT EXISTS (
                    SELECT 1 
                    FROM public.order_items oi
                    JOIN public.orders o ON oi.order_id = o.id
                    WHERE o.user_id = NEW.user_id
                      AND o.status = 'Pago'
                      AND o.id != NEW.id
                      AND oi.product_id = v_item.product_id
                ) INTO v_is_renewal;

                IF v_is_renewal THEN
                    -- Valores fixos para Mensalidade
                    v_commission_amount := CASE 
                        WHEN v_item.product_id = 'd3b07384-d113-4171-bc01-9a7c936df312' THEN 5.00
                        WHEN v_item.product_id = 'd3b07384-d113-4171-bc02-9a7c936df312' THEN 7.00
                        WHEN v_item.product_id = 'd3b07384-d113-4171-bc03-9a7c936df312' THEN 10.00
                        WHEN v_item.product_id = 'd3b07384-d113-4171-bc04-9a7c936df312' THEN 17.58
                        ELSE 0
                    END;
                ELSE
                    -- Valores fixos para Adesão
                    v_commission_amount := CASE 
                        WHEN v_item.product_id = 'd3b07384-d113-4171-bc01-9a7c936df312' THEN 7.00
                        WHEN v_item.product_id = 'd3b07384-d113-4171-bc02-9a7c936df312' THEN 10.00
                        WHEN v_item.product_id = 'd3b07384-d113-4171-bc03-9a7c936df312' THEN 25.00
                        WHEN v_item.product_id = 'd3b07384-d113-4171-bc04-9a7c936df312' THEN 35.00
                        ELSE 0
                    END;
                END IF;

                -- Multiplicar pelo número de itens comprados
                v_commission_amount := v_commission_amount * v_item.quantity;

            -- B. TAXAS DE SISTEMA (ADESÃO / MANUTENÇÃO EVA)
            ELSIF v_item.product_id = 'd3b07384-d113-4171-bc05-9a7c936df312' THEN
                -- Ativação/Adesão: Ativa o afiliado e define 30 dias de expiração
                UPDATE public.affiliates
                SET is_active = true,
                    is_delinquent = false,
                    maintenance_expires_at = now() + interval '30 days',
                    updated_at = now()
                WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id;

                UPDATE public.user_profiles
                SET is_active = true,
                    is_delinquent = false,
                    maintenance_expires_at = now() + interval '30 days',
                    updated_at = now()
                WHERE id = NEW.user_id AND organization_id = NEW.organization_id;

            ELSIF v_item.product_id = 'd3b07384-d113-4171-bc06-9a7c936df312' THEN
                -- Manutenção Mensal: Adiciona 30 dias à expiração da assinatura
                UPDATE public.affiliates
                SET is_active = true,
                    is_delinquent = false,
                    maintenance_expires_at = CASE 
                        WHEN maintenance_expires_at IS NULL OR maintenance_expires_at < now() THEN now() + interval '30 days'
                        ELSE maintenance_expires_at + interval '30 days'
                    END,
                    updated_at = now()
                WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id;

                UPDATE public.user_profiles
                SET is_active = true,
                    is_delinquent = false,
                    maintenance_expires_at = CASE 
                        WHEN maintenance_expires_at IS NULL OR maintenance_expires_at < now() THEN now() + interval '30 days'
                        ELSE maintenance_expires_at + interval '30 days'
                    END,
                    updated_at = now()
                WHERE id = NEW.user_id AND organization_id = NEW.organization_id;
            END IF;

            -- C. PROCESSAMENTO E DISTRIBUIÇÃO DA COMISSÃO
            IF v_commission_amount > 0 THEN
                v_target_user_id := NULL;
                v_sponsor_is_active := false;
                v_sponsor_is_delinquent := false;

                -- Obter dados de atividade do patrocinador
                IF v_affiliate IS NOT NULL THEN
                    SELECT user_id, is_active, is_delinquent 
                    INTO v_target_user_id, v_sponsor_is_active, v_sponsor_is_delinquent 
                    FROM public.user_profiles 
                    WHERE id = v_affiliate.user_id;
                END IF;

                -- REGRA CRÍTICA: Se o patrocinador for nulo, inativo ou inadimplente, a comissão vai para o ID Master
                IF v_target_user_id IS NULL OR v_sponsor_is_active = false OR v_sponsor_is_delinquent = true THEN
                    v_target_user_id := v_master_user_id;
                    v_description := 'Comissão Clube do Seu Bolso (Redirecionada ao Master devido a Patrocinador inativo) - ' || v_item.product_name || ' (Pedido ' || NEW.id || ')';
                ELSE
                    v_description := 'Comissão Clube do Seu Bolso - ' || v_item.product_name || ' (Pedido ' || NEW.id || ')';
                END IF;

                -- Creditar se houver um destinatário válido
                IF v_target_user_id IS NOT NULL THEN
                    -- Garante existência da carteira (user_settings)
                    INSERT INTO public.user_settings (user_id, organization_id, total_earnings, available_balance, frozen_balance, is_active_this_month, created_at, updated_at)
                    VALUES (v_target_user_id, NEW.organization_id, 0, 0, 0, true, now(), now())
                    ON CONFLICT (user_id) DO NOTHING;

                    -- Creditar saldo
                    UPDATE public.user_settings 
                    SET 
                        total_earnings = total_earnings + v_commission_amount,
                        available_balance = available_balance + v_commission_amount,
                        updated_at = now()
                    WHERE user_id = v_target_user_id;

                    -- Registrar no extrato de comissões
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
                        1, -- Comissão Direta
                        'direct',
                        v_description
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- Recriar gatilho na tabela orders
DROP TRIGGER IF EXISTS trigger_distribute_commissions ON public.orders;
CREATE TRIGGER trigger_distribute_commissions
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.distribute_commissions();
