-- SCRIPT DE SEGURANÇA MULTITENANT (RLS) - CORREÇÃO DE ACESSO À TABELA ORGANIZATIONS/TENANTS
-- Este script corrige a falta de RLS na tabela organizations e inclui o restante das políticas base.

-- 1. Forçar a habilitação do RLS em todas as tabelas afetadas (Incluindo organizations)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_cashiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Limpar todas as políticas (RLS) antigas que possam vazar dados
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- 3. CRIAR AS NOVAS POLÍTICAS MULTITENANT MATADORAS
-- ============================================================================

-- --- 1. organizations (Você mencionou que estava sem RLS, aqui está a correção!) ---
-- Apenas permite leitura da SUA própria organização via front-end (Logado)
CREATE POLICY "Leitura_Organizations_Propria" ON public.organizations FOR SELECT 
TO authenticated
USING (id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

-- Permite que sistemas de backend logados visualizem as organizações (Você pode restringir isso via admin-claims se aplicar futuramente)
CREATE POLICY "Leitura_Publica_Restrita" ON public.organizations FOR SELECT 
TO anon 
USING (true); -- Permitir listagem pública no carregamento da tela de login (Ex: Escolher o Inquilino) 


-- --- 2. user_profiles ---
CREATE POLICY "Leitura_Profiles_Tenant" ON public.user_profiles FOR SELECT 
TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "Alteracao_Propria_Profile" ON public.user_profiles FOR UPDATE 
TO authenticated USING (id = auth.uid()); -- Usuário só altera a si mesmo


-- --- 3. affiliates ---
CREATE POLICY "Leitura_Affiliates_Tenant" ON public.affiliates FOR SELECT 
TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "Alteracao_Propria_Affiliate" ON public.affiliates FOR UPDATE 
TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Insert_Publico_Affiliate_Tenant" ON public.affiliates FOR INSERT 
WITH CHECK (true); -- Permitir cadastro de fora para cair no Trigger.


-- --- 4. products & product_categories (CATÁLOGO) ---
CREATE POLICY "Leitura_Products_Tenant" ON public.products FOR SELECT 
TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "Leitura_Categories_Tenant" ON public.product_categories FOR SELECT 
TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

-- Regra de Alteração (Se precisar de Flag Admin depois, adicione 'AND auth.jwt()->>'role' = 'admin'' aqui)
CREATE POLICY "Modifica_Products_Tenant" ON public.products FOR ALL 
TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "Modifica_Categories_Tenant" ON public.product_categories FOR ALL 
TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);


-- --- 5. orders & order_items ---
CREATE POLICY "Leitura_Orders_Tenant" ON public.orders FOR SELECT 
TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "Modifica_Orders_Tenant" ON public.orders FOR ALL 
TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "Leitura_OrderItems_Tenant" ON public.order_items FOR SELECT 
TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "Modifica_OrderItems_Tenant" ON public.order_items FOR ALL 
TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);


-- --- 6. Demais tabelas financeiras fechadas por Tenant ---
-- companies
CREATE POLICY "Leitura_Companies_Tenant" ON public.companies FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Modifica_Companies_Tenant" ON public.companies FOR ALL TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

-- company_cashiers
CREATE POLICY "Leitura_Cashiers_Tenant" ON public.company_cashiers FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Modifica_Cashiers_Tenant" ON public.company_cashiers FOR ALL TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

-- customer_coupons
CREATE POLICY "Leitura_Coupons_Tenant" ON public.customer_coupons FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Modifica_Coupons_Tenant" ON public.customer_coupons FOR ALL TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

-- company_purchases
CREATE POLICY "Leitura_Purchases_Tenant" ON public.company_purchases FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Modifica_Purchases_Tenant" ON public.company_purchases FOR ALL TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

-- withdrawals
CREATE POLICY "Leitura_Withdrawals_Tenant" ON public.withdrawals FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Criar_Copia_Withdrawal" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- user_settings
CREATE POLICY "Leitura_Settings_Tenant" ON public.user_settings FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Modifica_Settings_Tenant" ON public.user_settings FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- 4. O "PULO DO GATO" - FORÇANDO O CLASSE A PARA OS USUARIOS ATUAIS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_auth_user_app_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE 
    v_org_id uuid;
BEGIN
  v_org_id := (new.raw_user_meta_data ->> 'organization_id')::uuid;
  
  IF v_org_id IS NULL THEN
     SELECT id INTO v_org_id FROM public.organizations WHERE name = 'Classe A' LIMIT 1;
  END IF;

  new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('organization_id', v_org_id);
  
  RETURN new;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_app_metadata ON auth.users;
CREATE TRIGGER on_auth_user_app_metadata
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_app_metadata();
