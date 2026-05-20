-- ============================================================================
-- SCRIPT SQL UNIFICADO - BANCO DE DADOS COMPLETO (CLUBE DO SEU BOLSO)
-- ============================================================================
-- Este script configura do zero toda a estrutura do Supabase para o sistema.
-- Ele remove tabelas existentes (em ordem segura) e recria:
-- 1. Extensões necessárias
-- 2. As 22 tabelas principais com todos os campos e chaves estrangeiras
-- 3. Funções auxiliares, de auditoria e exclusão segura
-- 4. Triggers de sincronização de perfil, comissão MMN, criação de conta e consórcio
-- 5. Buckets de armazenamento (avatars, product-images, marketing-materials) com RLS
-- 6. Habilitação de RLS em todas as tabelas e aplicação de políticas multitenant
-- 7. Carga inicial de dados (Organização Classe A, Comissões e Categorias padrão)
-- ============================================================================

-- ============================================================================
-- 1. EXTENSÕES & LIMPEZA DE ESTRUTURA
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpar triggers e tabelas anteriores para garantir recriação limpa
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_app_metadata ON auth.users;

DROP TABLE IF EXISTS public.marketing_materials CASCADE;
DROP TABLE IF EXISTS public.debug_logs CASCADE;
DROP TABLE IF EXISTS public.security_logs CASCADE;
DROP TABLE IF EXISTS public.consortium_draws CASCADE;
DROP TABLE IF EXISTS public.consortium_participants CASCADE;
DROP TABLE IF EXISTS public.consortium_groups CASCADE;
DROP TABLE IF EXISTS public.commissions CASCADE;
DROP TABLE IF EXISTS public.commission_configs CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.product_subcategories CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.withdrawals CASCADE;
DROP TABLE IF EXISTS public.company_purchases CASCADE;
DROP TABLE IF EXISTS public.customer_coupons CASCADE;
DROP TABLE IF EXISTS public.company_cashiers CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.affiliates CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- ============================================================================
-- 2. CRIAÇÃO DAS TABELAS
-- ============================================================================

-- --- 1. organizations ---
CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    domain text,
    mercadopago_access_token text,
    mercadopago_public_key text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
COMMENT ON COLUMN public.organizations.mercadopago_access_token IS 'Token de acesso do Mercado Pago por organização';
COMMENT ON COLUMN public.organizations.mercadopago_public_key IS 'Chave pública do Mercado Pago por organização';

-- --- 2. user_profiles ---
CREATE TABLE public.user_profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text,
    role text DEFAULT 'affiliate'::text,
    full_name text,
    login text,
    whatsapp text,
    cpf text UNIQUE,
    cnpj text UNIQUE,
    registration_type text,
    organization_id uuid REFERENCES public.organizations(id) NOT NULL,
    sponsor_id uuid, -- Guarda o ID de usuário do patrocinador
    referrer_id uuid, -- Guarda o ID de usuário de quem recomendou
    status text DEFAULT 'active'::text,
    rank text DEFAULT 'Consultor'::text,
    avatar_url text,
    cep text,
    address text,
    street text,
    "number" text,
    complement text,
    neighborhood text,
    city text,
    "state" text,
    mocha_user_id text UNIQUE,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_profiles_id_unique UNIQUE (id)
);

-- --- 3. affiliates ---
CREATE TABLE public.affiliates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name text,
    cpf text UNIQUE,
    email text UNIQUE,
    whatsapp text,
    referral_code text UNIQUE,
    sponsor_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    last_access_at timestamp with time zone,
    position_slot integer,
    cnpj text UNIQUE,
    organization_id uuid REFERENCES public.organizations(id) NOT NULL,
    avatar_url text,
    cep text,
    address text,
    street text,
    "number" text,
    complement text,
    neighborhood text,
    city text,
    "state" text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT affiliates_user_id_unique UNIQUE (user_id)
);

-- --- 4. companies ---
CREATE TABLE public.companies (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    razao_social text NOT NULL,
    nome_fantasia text NOT NULL,
    cnpj text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    telefone text NOT NULL,
    responsavel text NOT NULL,
    senha_hash text NOT NULL,
    endereco text,
    site_instagram text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    organization_id uuid REFERENCES public.organizations(id) NOT NULL
);

-- --- 5. company_cashiers ---
CREATE TABLE public.company_cashiers (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    company_id bigint REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    name text,
    cpf text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    is_active boolean DEFAULT true,
    last_access_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    organization_id uuid REFERENCES public.organizations(id) NOT NULL
);

-- --- 6. customer_coupons ---
CREATE TABLE public.customer_coupons (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    coupon_code text UNIQUE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
    cpf text UNIQUE NOT NULL,
    last_used_at timestamp with time zone,
    total_usage_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    organization_id uuid REFERENCES public.organizations(id) NOT NULL
);

-- --- 7. company_purchases ---
CREATE TABLE public.company_purchases (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    company_id bigint REFERENCES public.companies(id) ON DELETE CASCADE,
    cashier_id bigint REFERENCES public.company_cashiers(id) ON DELETE SET NULL,
    customer_coupon_id bigint REFERENCES public.customer_coupons(id) ON DELETE SET NULL,
    customer_coupon text NOT NULL,
    cashier_cpf text,
    purchase_value numeric NOT NULL,
    cashback_percentage numeric NOT NULL,
    cashback_generated numeric NOT NULL,
    purchase_date date NOT NULL,
    purchase_time time with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    organization_id uuid REFERENCES public.organizations(id) NOT NULL
);

-- --- 8. withdrawals ---
CREATE TABLE public.withdrawals (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_requested numeric NOT NULL,
    fee_amount numeric DEFAULT 0.00,
    net_amount numeric NOT NULL,
    status text DEFAULT 'pending'::text,
    pix_key text NOT NULL,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    organization_id uuid REFERENCES public.organizations(id) NOT NULL
);

-- --- 9. user_settings ---
CREATE TABLE public.user_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    pix_key text,
    leg_preference text DEFAULT 'automatic'::text,
    total_earnings numeric DEFAULT 0.00,
    available_balance numeric DEFAULT 0.00,
    frozen_balance numeric DEFAULT 0.00,
    is_active_this_month boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    organization_id uuid REFERENCES public.organizations(id) NOT NULL
);

-- --- 10. product_categories ---
CREATE TABLE public.product_categories (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name text UNIQUE NOT NULL,
    parent_id bigint REFERENCES public.product_categories(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    organization_id uuid REFERENCES public.organizations(id) NOT NULL
);

-- --- 11. product_subcategories ---
CREATE TABLE public.product_subcategories (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    category_id bigint REFERENCES public.product_categories(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT product_subcategories_name_category_id_key UNIQUE (name, category_id)
);

-- --- 12. products ---
CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    category_id bigint REFERENCES public.product_categories(id) ON DELETE SET NULL,
    subcategory_id bigint REFERENCES public.product_subcategories(id) ON DELETE SET NULL,
    price numeric NOT NULL,
    stock_quantity integer DEFAULT 0,
    image_url text,
    is_active boolean DEFAULT true,
    sales_count integer DEFAULT 0,
    weight numeric DEFAULT 0.5,
    length integer DEFAULT 16,
    width integer DEFAULT 11,
    height integer DEFAULT 2,
    origin_zip text DEFAULT '82820-160'::text,
    variations jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    organization_id uuid REFERENCES public.organizations(id) NOT NULL
);
COMMENT ON COLUMN public.products.variations IS 'Armazena opções como tamanhos, cores, numeração, etc. Ex: {"sizes": ["P", "M"], "colors": ["Preto", "Azul"]}';

-- --- 13. orders ---
CREATE TABLE public.orders (
    id text PRIMARY KEY,
    customer_name text NOT NULL,
    customer_email text,
    customer_phone text,
    shipping_address text,
    total_amount numeric NOT NULL,
    status text DEFAULT 'Pendente'::text,
    payment_method text,
    referral_code text,
    tracking_code text,
    payment_id text,
    payment_preference_id text,
    payment_status text,
    payment_status_detail text,
    shipping_cost numeric DEFAULT 0.00,
    shipping_method text,
    customer_cpf text,
    pix_qr_code text,
    pix_qr_code_base64 text,
    pix_copy_paste text,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    organization_id uuid REFERENCES public.organizations(id) NOT NULL
);
COMMENT ON COLUMN public.orders.customer_cpf IS 'CPF do cliente para fins de emissão de NF e processamento de PIX no Mercado Pago';

-- --- 14. order_items ---
CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id text REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    product_name text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    organization_id uuid REFERENCES public.organizations(id) NOT NULL
);

-- --- 15. commission_configs ---
CREATE TABLE public.commission_configs (
    key text PRIMARY KEY,
    type text NOT NULL DEFAULT 'percent'::text,
    active_generations integer NOT NULL DEFAULT 7,
    levels jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    organization_id uuid REFERENCES public.organizations(id) NOT NULL
);

-- --- 16. commissions ---
CREATE TABLE public.commissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id text REFERENCES public.orders(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    level integer NOT NULL,
    commission_type text,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- --- 17. consortium_groups ---
CREATE TABLE public.consortium_groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL CONSTRAINT consortium_groups_type_check CHECK (type IN ('colchao', 'livre_escolha', 'standard')),
    max_participants integer NOT NULL,
    current_participants integer DEFAULT 0,
    status text DEFAULT 'open'::text CONSTRAINT consortium_groups_status_check CHECK (status IN ('open', 'full', 'finished')),
    current_month integer DEFAULT 0,
    next_draw_date timestamp with time zone,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

-- --- 18. consortium_participants ---
CREATE TABLE public.consortium_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.consortium_groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    lucky_number integer NOT NULL,
    status text DEFAULT 'active'::text CONSTRAINT consortium_participants_status_check CHECK (status IN ('active', 'contemplated')),
    customer_name text,
    customer_cpf text,
    customer_email text,
    joined_at timestamp with time zone DEFAULT now(),
    CONSTRAINT consortium_participants_group_id_lucky_number_key UNIQUE (group_id, lucky_number)
);

-- --- 19. consortium_draws ---
CREATE TABLE public.consortium_draws (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.consortium_groups(id) ON DELETE CASCADE,
    winner_id uuid REFERENCES public.consortium_participants(id) ON DELETE SET NULL,
    draw_date timestamp with time zone DEFAULT now(),
    lottery_number text NOT NULL,
    details text,
    month_number integer,
    video_url text,
    official_result_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- --- 20. security_logs ---
CREATE TABLE public.security_logs (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_email text,
    ip_address text,
    location text,
    device_info text,
    event_type text NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- --- 21. debug_logs ---
CREATE TABLE public.debug_logs (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    operation text,
    message text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- --- 22. marketing_materials ---
CREATE TABLE public.marketing_materials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    type text NOT NULL CONSTRAINT marketing_materials_type_check CHECK (type IN ('video', 'banner', 'script', 'pdf')),
    thumbnail_url text,
    file_url text,
    content text,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 3. FUNÇÕES AUXILIARES E GATILHOS (TRIGGERS) COMUNS
-- ============================================================================

-- Função para atualizar a coluna updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar o trigger de updated_at nas tabelas relevantes
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON public.affiliates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_company_cashiers_updated_at BEFORE UPDATE ON public.company_cashiers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customer_coupons_updated_at BEFORE UPDATE ON public.customer_coupons FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_marketing_materials_updated_at BEFORE UPDATE ON public.marketing_materials FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Função utilitária: Verificar se o usuário autenticado é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sincronizar atualizações de user_profiles para affiliates
CREATE OR REPLACE FUNCTION public.sync_profile_to_affiliate()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.affiliates
    SET 
        full_name = COALESCE(NEW.full_name, full_name),
        cpf = COALESCE(NEW.cpf, cpf),
        whatsapp = COALESCE(NEW.whatsapp, whatsapp),
        address = COALESCE(NEW.address, address),
        cep = COALESCE(NEW.cep, cep),
        street = COALESCE(NEW.street, street),
        "number" = COALESCE(NEW.number, "number"),
        complement = COALESCE(NEW.complement, complement),
        neighborhood = COALESCE(NEW.neighborhood, neighborhood),
        city = COALESCE(NEW.city, city),
        "state" = COALESCE(NEW.state, "state"),
        updated_at = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_update
    AFTER UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_affiliate();

-- Exclusão de usuários de forma segura (admin_delete_user)
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: Somente administradores podem excluir usuários.';
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Relacionamento customizado para PostgREST (PostgreSQL / Supabase Join Helpers)
ALTER TABLE public.withdrawals DROP CONSTRAINT IF EXISTS withdrawals_user_id_fkey;
ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.affiliates(user_id) ON DELETE CASCADE;

-- ============================================================================
-- 4. LOGICA DE CRIAÇÃO E CONTROLE DE TENANTS (ORGANIZATIONS)
-- ============================================================================

-- Gatilho para injetar a organização padrão Classe A no app_metadata do usuário
CREATE OR REPLACE FUNCTION public.handle_auth_user_app_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE 
    v_org_id uuid;
BEGIN
  BEGIN
    v_org_id := (new.raw_user_meta_data ->> 'organization_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_org_id := NULL;
  END;
  
  IF v_org_id IS NULL THEN
     SELECT id INTO v_org_id FROM public.organizations WHERE name = 'Classe A' LIMIT 1;
  END IF;

  IF v_org_id IS NULL THEN
     v_org_id := '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid;
  END IF;

  new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('organization_id', v_org_id);
  
  RETURN new;
END;
$function$;

CREATE TRIGGER on_auth_user_app_metadata
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_app_metadata();

-- Gatilho para cadastrar automaticamente perfis e configurações de afiliados novos no auth
CREATE OR REPLACE FUNCTION public.handle_new_affiliate_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
 AS $function$
 DECLARE
   v_full_name text;
   v_sponsor_affiliate_id uuid;
   v_sponsor_user_id uuid;
   v_org_id uuid;
   v_sponsor_code text;
   v_login text;
 BEGIN
   -- Determinar login e nome
   v_login := COALESCE(new.raw_user_meta_data ->> 'login', split_part(new.email, '@', 1));
   v_full_name := TRIM(CONCAT_WS(' ', new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'sobrenome'));
   IF v_full_name = '' THEN v_full_name := v_login; END IF;

   -- Determinar Organização
   BEGIN
     v_org_id := NULLIF(new.raw_user_meta_data ->> 'organization_id', '')::uuid;
   EXCEPTION WHEN OTHERS THEN
     v_org_id := NULL;
   END;

   IF v_org_id IS NULL THEN
      SELECT id INTO v_org_id FROM public.organizations WHERE name = 'Classe A' LIMIT 1;
   END IF;
   IF v_org_id IS NULL THEN
      v_org_id := '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid;
   END IF;

   -- Resolver Padrinho (Sponsor)
   v_sponsor_code := NULLIF(new.raw_user_meta_data ->> 'sponsor_code', '');
   
   IF v_sponsor_code IS NOT NULL THEN
     SELECT id, user_id INTO v_sponsor_affiliate_id, v_sponsor_user_id
     FROM public.affiliates 
     WHERE LOWER(referral_code) = LOWER(v_sponsor_code)
     AND organization_id = v_org_id
     LIMIT 1;
   END IF;

   -- Fallback: Se não houver patrocinador, vincula ao primeiro afiliado criado da organização
   IF v_sponsor_user_id IS NULL THEN
     SELECT id, user_id INTO v_sponsor_affiliate_id, v_sponsor_user_id
     FROM public.affiliates
     WHERE organization_id = v_org_id
     ORDER BY created_at ASC
     LIMIT 1;
   END IF;

   -- Criar Perfil do Usuário
   BEGIN
     INSERT INTO public.user_profiles (
       id, email, role, full_name, login, 
       whatsapp, cpf, cnpj, registration_type, 
       organization_id, sponsor_id, referrer_id,
       status, rank, created_at, updated_at
     ) VALUES (
       new.id, new.email, 
       COALESCE(new.raw_user_meta_data ->> 'role', 'affiliate'),
       v_full_name, v_login,
       new.raw_user_meta_data ->> 'whatsapp',
       new.raw_user_meta_data ->> 'cpf',
       new.raw_user_meta_data ->> 'cnpj',
       new.raw_user_meta_data ->> 'registration_type',
       v_org_id, v_sponsor_user_id, v_sponsor_user_id, 
       'active', 'Consultor', new.created_at, new.created_at
     );
   EXCEPTION WHEN OTHERS THEN 
     NULL; -- Segue de forma resiliente
   END;

   -- Criar Registro na tabela Affiliates
   BEGIN
     INSERT INTO public.affiliates (
       user_id, email, full_name, referral_code, 
       whatsapp, cpf, cnpj, organization_id, sponsor_id, 
       is_active, created_at, updated_at
     ) VALUES (
       new.id, new.email, v_full_name, v_login,
       new.raw_user_meta_data ->> 'whatsapp',
       new.raw_user_meta_data ->> 'cpf',
       new.raw_user_meta_data ->> 'cnpj',
       v_org_id, v_sponsor_affiliate_id, 
       true, new.created_at, new.created_at
     );
   EXCEPTION WHEN OTHERS THEN 
     NULL;
   END;

   -- Criar Configurações Iniciais de Saldo
   BEGIN
     INSERT INTO public.user_settings (user_id, organization_id, created_at, updated_at)
     VALUES (new.id, v_org_id, new.created_at, new.created_at);
   EXCEPTION WHEN OTHERS THEN 
     NULL; 
   END;
   
   RETURN new;
 END;
 $function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_affiliate_user();

-- ============================================================================
-- 5. LÓGICA DE DISTRIBUIÇÃO DE COMISSÕES (MMN)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.distribute_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_affiliate RECORD;
    v_current_sponsor_id uuid;
    v_config RECORD;
    v_commission_amount numeric;
    v_gen_count integer := 0;
    v_active_gens integer;
    v_target_user_id uuid;
    v_is_master boolean := false;
    v_config_key text;
BEGIN
    -- Só processa se o status mudar para 'Pago'
    IF (OLD.status IS NULL OR OLD.status != 'Pago') AND NEW.status = 'Pago' THEN
        
        -- Evita duplicidade no processamento das comissões do pedido
        IF EXISTS (SELECT 1 FROM public.commissions WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- A. Identificar se o pedido contém Consórcio Master (Colchão)
        SELECT EXISTS (
            SELECT 1 FROM public.order_items oi
            JOIN public.products p ON oi.product_id = p.id
            LEFT JOIN public.product_categories pc ON p.category_id = pc.id
            WHERE oi.order_id = NEW.id
            AND (p.name ILIKE '%Colchão%' OR pc.name ILIKE '%Colchão%')
        ) INTO v_is_master;

        v_config_key := CASE WHEN v_is_master THEN 'mattress' ELSE 'geral' END;

        -- B. Buscar configurações de comissão (prioriza chave específica)
        SELECT * INTO v_config FROM public.commission_configs WHERE key = v_config_key;
        
        IF v_config IS NULL THEN
            SELECT * INTO v_config FROM public.commission_configs WHERE key = 'geral';
        END IF;

        IF v_config IS NULL THEN
            RETURN NEW;
        END IF;

        v_active_gens := v_config.active_generations;

        -- C. Identificar o Afiliado Recomendador (Geração 1)
        
        -- Prioridade 1: Código de referência (referral_code) explícito no pedido
        IF NEW.referral_code IS NOT NULL AND NEW.referral_code != '' THEN
            SELECT * INTO v_affiliate FROM public.affiliates 
            WHERE LOWER(referral_code) = LOWER(NEW.referral_code) 
            AND organization_id = NEW.organization_id
            AND (
                NEW.organization_id != '5111af72-27a5-41fd-8ed9-8c51b78b4fdd' -- Outras empresas
                OR user_id != NEW.user_id                                    -- Classe A: Sem autocomissão
            )
            LIMIT 1;
        END IF;

        -- Prioridade 2: Patrocinador cadastrado no perfil do comprador
        IF v_affiliate IS NULL AND NEW.user_id IS NOT NULL THEN
            SELECT a.* INTO v_affiliate 
            FROM public.affiliates a
            JOIN public.user_profiles p ON p.sponsor_id = a.user_id
            WHERE p.id = NEW.user_id 
            AND a.organization_id = NEW.organization_id
            AND (
                NEW.organization_id != '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'
                OR a.user_id != NEW.user_id
            )
            LIMIT 1;
        END IF;

        -- Sem patrocinador ou afiliado elegível, não distribui comissão
        IF v_affiliate IS NULL THEN
            RETURN NEW;
        END IF;

        v_current_sponsor_id := v_affiliate.id;

        -- D. Distribuição multinível subindo a árvore de patrocinadores
        WHILE v_gen_count < v_active_gens AND v_current_sponsor_id IS NOT NULL LOOP
            v_gen_count := v_gen_count + 1;
            
            -- Pega o percentual/valor configurado para este nível
            SELECT (lvl->>'value')::numeric INTO v_commission_amount
            FROM jsonb_array_elements(v_config.levels) AS lvl
            WHERE (lvl->>'level')::integer = v_gen_count;

            IF v_commission_amount IS NOT NULL AND v_commission_amount > 0 THEN
                
                -- Se a configuração for percentual, calcula com base no valor do pedido
                IF v_config.type = 'percent' THEN
                    v_commission_amount := NEW.total_amount * (v_commission_amount / 100);
                END IF;

                -- Obter o ID de autenticação do patrocinador atual
                SELECT user_id INTO v_target_user_id FROM public.affiliates WHERE id = v_current_sponsor_id;

                IF v_target_user_id IS NOT NULL THEN
                    -- Atualizar saldo em user_settings (Garante resiliência criando se não existir)
                    INSERT INTO public.user_settings (user_id, organization_id, total_earnings, available_balance)
                    VALUES (v_target_user_id, NEW.organization_id, v_commission_amount, v_commission_amount)
                    ON CONFLICT (user_id) DO UPDATE SET 
                        total_earnings = public.user_settings.total_earnings + v_commission_amount,
                        available_balance = public.user_settings.available_balance + v_commission_amount,
                        updated_at = now();

                    -- Registrar log na tabela commissions
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
                        v_gen_count,
                        v_config.type,
                        'Comissão ' || v_config_key || ' Geração ' || v_gen_count || ' - Pedido ' || NEW.id
                    );
                END IF;
            END IF;

            -- Avançar para o próximo nível da rede
            SELECT sponsor_id INTO v_current_sponsor_id 
            FROM public.affiliates 
            WHERE id = v_current_sponsor_id 
            AND organization_id = NEW.organization_id;
            
            -- Break de segurança contra loops infinitos
            IF v_gen_count > 50 THEN EXIT; END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_distribute_commissions
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.distribute_commissions();

-- ============================================================================
-- 6. LÓGICA DE AUTOMAÇÃO E PROCESSAMENTO DE CONSÓRCIOS
-- ============================================================================

-- Gatilho para alocação automática de cotas de consórcios na confirmação de pagamento
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
        
        -- Loop pelos itens do pedido confirmando produtos/categorias que contêm consórcio
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
            -- Definição de regras com base no nome do produto
            IF row_item.p_name ILIKE '%Livre Escolha%' THEN
                limit_participants := 12;
                group_type_slug := 'livre_escolha';
            ELSE
                limit_participants := 18;
                group_type_slug := 'colchao';
            END IF;

            -- Processar individualmente cada quantidade/cota adquirida
            FOR current_idx IN 1..row_item.quantity LOOP
                
                -- Buscar grupo aberto que corresponda ao limite e organização
                target_group_id := NULL;
                SELECT g.id INTO target_group_id
                FROM public.consortium_groups g
                WHERE g.status = 'open'
                AND g.max_participants = limit_participants
                AND g.organization_id = NEW.organization_id
                AND g.current_participants < limit_participants
                ORDER BY g.created_at ASC
                LIMIT 1;

                -- Criar novo grupo de consórcio caso não exista nenhum aberto
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

                -- Buscar o menor número da sorte (Lucky Number) disponível no grupo
                SELECT next_num INTO next_lucky_num
                FROM generate_series(1, limit_participants) next_num
                WHERE next_num NOT IN (
                    SELECT lucky_number 
                    FROM public.consortium_participants 
                    WHERE group_id = target_group_id
                )
                ORDER BY next_num ASC
                LIMIT 1;

                -- Adicionar participante ao grupo
                IF next_lucky_num IS NOT NULL THEN
                    INSERT INTO public.consortium_participants (
                        group_id, user_id, customer_name, customer_cpf, customer_email, lucky_number, status
                    ) VALUES (
                        target_group_id, NEW.user_id, NEW.customer_name, NEW.customer_cpf, NEW.customer_email, next_lucky_num, 'active'
                    );

                    -- Contar participantes ativos no grupo atualizado
                    SELECT count(*) INTO participants_count 
                    FROM public.consortium_participants 
                    WHERE group_id = target_group_id;

                    UPDATE public.consortium_groups
                    SET current_participants = participants_count
                    WHERE id = target_group_id;

                    -- Fechar o grupo caso tenha atingido a capacidade máxima
                    IF participants_count >= limit_participants THEN
                        UPDATE public.consortium_groups
                        SET status = 'full'
                        WHERE id = target_group_id;
                    END IF;
                END IF;

            END LOOP;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_on_order_paid_consortium
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    WHEN (NEW.status = 'Pago')
    EXECUTE FUNCTION public.handle_consortium_purchase();

-- Função para verificar se usuário pertence a algum consórcio (Front-End menu)
CREATE OR REPLACE FUNCTION public.is_consortium_member(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.consortium_participants WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. CONFIGURAÇÃO DE STORAGE BUCKETS (ARMZENAMENTO PÚBLICO)
-- ============================================================================

-- Habilitar buckets se a extensão storage estiver instalada
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('marketing-materials', 'marketing-materials', true) ON CONFLICT (id) DO NOTHING;

-- Limpar políticas de storage anteriores
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Marketing Materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Marketing Materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Marketing Materials" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Marketing Materials" ON storage.objects;

-- Políticas de Storage: Avatars
CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Políticas de Storage: Imagens de Produtos
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admin Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Admin Update Access" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Admin Delete Access" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin());

-- Políticas de Storage: Materiais de Marketing
CREATE POLICY "Public Access Marketing Materials" ON storage.objects FOR SELECT USING (bucket_id = 'marketing-materials');
CREATE POLICY "Admin Upload Marketing Materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketing-materials' AND public.is_admin());
CREATE POLICY "Admin Update Marketing Materials" ON storage.objects FOR UPDATE USING (bucket_id = 'marketing-materials' AND public.is_admin());
CREATE POLICY "Admin Delete Marketing Materials" ON storage.objects FOR DELETE USING (bucket_id = 'marketing-materials' AND public.is_admin());

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) MULTITENANT (INQUILINOS)
-- ============================================================================

-- Ativar RLS em todas as tabelas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_cashiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consortium_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consortium_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consortium_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_materials ENABLE ROW LEVEL SECURITY;

-- Limpar todas as políticas ativas
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- --- Políticas de Acesso por Tenant (organization_id no app_metadata do JWT) ---

-- 1. organizations
CREATE POLICY "Leitura_Publica_Organizations" ON public.organizations FOR SELECT USING (true);

-- 2. user_profiles
CREATE POLICY "Leitura_Profiles_Tenant" ON public.user_profiles FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Alteracao_Propria_Profile" ON public.user_profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admin_Full_Profiles" ON public.user_profiles FOR ALL TO authenticated USING (public.is_admin());

-- 3. affiliates
CREATE POLICY "Leitura_Affiliates_Tenant" ON public.affiliates FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Alteracao_Propria_Affiliate" ON public.affiliates FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert_Publico_Affiliate" ON public.affiliates FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin_Full_Affiliates" ON public.affiliates FOR ALL TO authenticated USING (public.is_admin());

-- 4. products, categories e subcategories (Públicos para o catálogo, modificado por admin)
CREATE POLICY "Leitura_Publica_Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Leitura_Publica_Categories" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Leitura_Publica_Subcategories" ON public.product_subcategories FOR SELECT USING (true);
CREATE POLICY "Admin_Modifica_Products" ON public.products FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin_Modifica_Categories" ON public.product_categories FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin_Modifica_Subcategories" ON public.product_subcategories FOR ALL TO authenticated USING (public.is_admin());

-- 5. orders & order_items
CREATE POLICY "Insere_Pedido_Publico" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Leitura_Propria_Orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Modifica_Orders_Tenant" ON public.orders FOR ALL TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "Insere_Itens_Pedido_Publico" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Leitura_OrderItems_Tenant" ON public.order_items FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Modifica_OrderItems_Tenant" ON public.order_items FOR ALL TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

-- 6. user_settings (saldos)
CREATE POLICY "Leitura_Settings_Tenant" ON public.user_settings FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Modifica_Settings_Propria" ON public.user_settings FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin_Full_Settings" ON public.user_settings FOR ALL TO authenticated USING (public.is_admin());

-- 7. withdrawals (saques)
CREATE POLICY "Leitura_Withdrawals_Tenant" ON public.withdrawals FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Criar_Copia_Withdrawal" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin_Full_Withdrawals" ON public.withdrawals FOR ALL TO authenticated USING (public.is_admin());

-- 8. commissions
CREATE POLICY "Leitura_Propria_Commissions" ON public.commissions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin_Full_Commissions" ON public.commissions FOR ALL TO authenticated USING (public.is_admin());

-- 9. commission_configs
CREATE POLICY "Leitura_Configs_Publico" ON public.commission_configs FOR SELECT USING (true);
CREATE POLICY "Admin_Full_Configs" ON public.commission_configs FOR ALL TO authenticated USING (public.is_admin());

-- 10. consortium_groups, consortium_participants & consortium_draws
CREATE POLICY "Leitura_Publica_Groups" ON public.consortium_groups FOR SELECT USING (true);
CREATE POLICY "Leitura_Publica_Draws" ON public.consortium_draws FOR SELECT USING (true);
CREATE POLICY "Leitura_Propria_Participants" ON public.consortium_participants FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin_Full_Groups" ON public.consortium_groups FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin_Full_Participants" ON public.consortium_participants FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin_Full_Draws" ON public.consortium_draws FOR ALL TO authenticated USING (public.is_admin());

-- 11. marketing_materials
CREATE POLICY "Leitura_Materials_Autenticado" ON public.marketing_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin_Full_Materials" ON public.marketing_materials FOR ALL TO authenticated USING (public.is_admin());

-- 12. Demais tabelas financeiras físicas (Parceiros)
CREATE POLICY "Leitura_Companies_Tenant" ON public.companies FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Modifica_Companies_Tenant" ON public.companies FOR ALL TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "Leitura_Cashiers_Tenant" ON public.company_cashiers FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Modifica_Cashiers_Tenant" ON public.company_cashiers FOR ALL TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "Leitura_Coupons_Tenant" ON public.customer_coupons FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Modifica_Coupons_Tenant" ON public.customer_coupons FOR ALL TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "Leitura_Purchases_Tenant" ON public.company_purchases FOR SELECT TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);
CREATE POLICY "Modifica_Purchases_Tenant" ON public.company_purchases FOR ALL TO authenticated USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

-- ============================================================================
-- 9. DADOS INICIAIS (SEEDING) E CONFIGURAÇÕES PADRÃO
-- ============================================================================

-- 1. Criação do Tenant Padrão "Classe A"
INSERT INTO public.organizations (id, name, domain, created_at, updated_at)
VALUES ('5111af72-27a5-41fd-8ed9-8c51b78b4fdd', 'Classe A', 'classeafaria.com.br', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Configurações de Comissões Padrão (Chave Geral de 7 níveis e Chave Mattress/Colchão)
INSERT INTO public.commission_configs (key, type, active_generations, levels, organization_id)
VALUES (
    'geral', 
    'percent', 
    7, 
    '[
        {"level": 1, "value": 10}, 
        {"level": 2, "value": 5}, 
        {"level": 3, "value": 3}, 
        {"level": 4, "value": 2}, 
        {"level": 5, "value": 1}, 
        {"level": 6, "value": 1}, 
        {"level": 7, "value": 1}
    ]'::jsonb, 
    '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'
)
ON CONFLICT (key) DO UPDATE SET levels = EXCLUDED.levels, active_generations = EXCLUDED.active_generations;

INSERT INTO public.commission_configs (key, type, active_generations, levels, organization_id)
VALUES (
    'mattress', 
    'percent', 
    7, 
    '[
        {"level": 1, "value": 15}, 
        {"level": 2, "value": 6}, 
        {"level": 3, "value": 4}, 
        {"level": 4, "value": 2}, 
        {"level": 5, "value": 2}, 
        {"level": 6, "value": 1}, 
        {"level": 7, "value": 1}
    ]'::jsonb, 
    '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'
)
ON CONFLICT (key) DO UPDATE SET levels = EXCLUDED.levels, active_generations = EXCLUDED.active_generations;

-- 3. Categorias Iniciais do E-Commerce
DO $$
DECLARE
    cat_id_cama bigint;
    cat_id_acessorios bigint;
    cat_id_vest_masc bigint;
    cat_id_calc_masc bigint;
    cat_id_fem bigint;
    v_org_id uuid := '5111af72-27a5-41fd-8ed9-8c51b78b4fdd';
BEGIN
    -- 1. Categoria: Cama
    INSERT INTO public.product_categories (name, organization_id) 
    VALUES ('Cama', v_org_id) 
    ON CONFLICT (name) DO UPDATE SET organization_id = v_org_id 
    RETURNING id INTO cat_id_cama;

    INSERT INTO public.product_subcategories (name, category_id) VALUES 
        ('Base Box', cat_id_cama),
        ('Travesseiros', cat_id_cama),
        ('Cabeceiras', cat_id_cama),
        ('Colchões Estáticos', cat_id_cama),
        ('Colchões Terapêuticos', cat_id_cama)
    ON CONFLICT (name, category_id) DO NOTHING;

    -- 2. Categoria: Acessórios
    INSERT INTO public.product_categories (name, organization_id) 
    VALUES ('Acessórios', v_org_id) 
    ON CONFLICT (name) DO UPDATE SET organization_id = v_org_id 
    RETURNING id INTO cat_id_acessorios;

    INSERT INTO public.product_subcategories (name, category_id) VALUES 
        ('Carteiras', cat_id_acessorios),
        ('Cintos', cat_id_acessorios),
        ('Pulseiras', cat_id_acessorios)
    ON CONFLICT (name, category_id) DO NOTHING;

    -- 3. Categoria: Vestuário Masculino
    INSERT INTO public.product_categories (name, organization_id) 
    VALUES ('Vestuário Masculino', v_org_id) 
    ON CONFLICT (name) DO UPDATE SET organization_id = v_org_id 
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
    INSERT INTO public.product_categories (name, organization_id) 
    VALUES ('Calçado Masculino', v_org_id) 
    ON CONFLICT (name) DO UPDATE SET organization_id = v_org_id 
    RETURNING id INTO cat_id_calc_masc;

    INSERT INTO public.product_subcategories (name, category_id) VALUES 
        ('Sapatênis', cat_id_calc_masc),
        ('Tênis', cat_id_calc_masc),
        ('Sapato Social', cat_id_calc_masc),
        ('Chinelos', cat_id_calc_masc)
    ON CONFLICT (name, category_id) DO NOTHING;

    -- 5. Categoria: Feminino
    INSERT INTO public.product_categories (name, organization_id) 
    VALUES ('Feminino', v_org_id) 
    ON CONFLICT (name) DO UPDATE SET organization_id = v_org_id 
    RETURNING id INTO cat_id_fem;

    INSERT INTO public.product_subcategories (name, category_id) VALUES 
        ('Acessórios Femininos', cat_id_fem),
        ('Calçados', cat_id_fem),
        ('Vestuário Feminino', cat_id_fem)
    ON CONFLICT (name, category_id) DO NOTHING;

    -- 6. Categoria: Consórcio
    INSERT INTO public.product_categories (name, organization_id) 
    VALUES ('Consórcio', v_org_id) 
    ON CONFLICT (name) DO NOTHING;

    -- 7. Categoria: Promoções
    INSERT INTO public.product_categories (name, organization_id) 
    VALUES ('Promoções', v_org_id) 
    ON CONFLICT (name) DO NOTHING;

END $$;
