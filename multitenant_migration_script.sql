-- MIGRATION SCRIPT PARA ARQUITETURA MULTITENANT
-- Este script irá preparar o banco atual (Classe A) para receber novos inquilinos.

-- 1. Cria a tabela de Organizations (Tenant)
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    domain text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Insere a Organização Principal "Classe A" e Guarda o ID
DO $$
DECLARE
    v_default_org_id uuid;
BEGIN
    SELECT id INTO v_default_org_id FROM public.organizations WHERE name = 'Classe A' LIMIT 1;
    
    IF v_default_org_id IS NULL THEN
        INSERT INTO public.organizations (name, domain) 
        VALUES ('Classe A', 'classea.com.br') 
        RETURNING id INTO v_default_org_id;
    END IF;

    -- 3. Adicionar coluna 'organization_id' e migrar clientes para Organização "Classe A"
    
    -- user_profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='organization_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        UPDATE public.user_profiles SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.user_profiles ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- affiliates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='affiliates' AND column_name='organization_id') THEN
        ALTER TABLE public.affiliates ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        UPDATE public.affiliates SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.affiliates ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- companies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='organization_id') THEN
        ALTER TABLE public.companies ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        UPDATE public.companies SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.companies ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- company_cashiers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_cashiers' AND column_name='organization_id') THEN
        ALTER TABLE public.company_cashiers ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        UPDATE public.company_cashiers SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.company_cashiers ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- customer_coupons
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_coupons' AND column_name='organization_id') THEN
        ALTER TABLE public.customer_coupons ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        UPDATE public.customer_coupons SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.customer_coupons ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- company_purchases
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_purchases' AND column_name='organization_id') THEN
        ALTER TABLE public.company_purchases ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        UPDATE public.company_purchases SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.company_purchases ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- withdrawals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdrawals' AND column_name='organization_id') THEN
        ALTER TABLE public.withdrawals ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        UPDATE public.withdrawals SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.withdrawals ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- user_settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' AND column_name='organization_id') THEN
        ALTER TABLE public.user_settings ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        UPDATE public.user_settings SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.user_settings ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='organization_id') THEN
        ALTER TABLE public.orders ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        UPDATE public.orders SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.orders ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- order_items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='organization_id') THEN
        ALTER TABLE public.order_items ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        UPDATE public.order_items SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.order_items ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- product_categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_categories' AND column_name='organization_id') THEN
        ALTER TABLE public.product_categories ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        UPDATE public.product_categories SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.product_categories ALTER COLUMN organization_id SET NOT NULL;
    END IF;

    -- products
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='organization_id') THEN
        ALTER TABLE public.products ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
        UPDATE public.products SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        ALTER TABLE public.products ALTER COLUMN organization_id SET NOT NULL;
    END IF;
END $$;

-- 4. ATUALIZAR TRIGGER PARA CAIR NA ORGANIZAÇÃO CERTA
-- (Isto adapta o Trigger de usuário padrão para suportar o multi-tenancy)
CREATE OR REPLACE FUNCTION public.handle_new_affiliate_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_full_name text;
  v_org_id uuid;
BEGIN
  v_full_name := TRIM(CONCAT_WS(' ', new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'sobrenome'));
  IF v_full_name = '' THEN v_full_name := 'Novo Afiliado'; END IF;

  -- Resgata organization_id injetado no processo de cadastro do cliente (se vier vazio, joga no Classe A)
  v_org_id := (new.raw_user_meta_data ->> 'organization_id')::uuid;
  
  IF v_org_id IS NULL THEN
     SELECT id INTO v_org_id FROM public.organizations WHERE name = 'Classe A' LIMIT 1;
  END IF;

  INSERT INTO public.user_profiles (id, email, organization_id, created_at, updated_at)
  VALUES (new.id, new.email, v_org_id, new.created_at, new.created_at);

  INSERT INTO public.affiliates (user_id, email, full_name, referral_code, organization_id, created_at, updated_at)
  VALUES (new.id, new.email, v_full_name, new.raw_user_meta_data ->> 'login', v_org_id, new.created_at, new.updated_at);

  INSERT INTO public.user_settings (user_id, organization_id, created_at, updated_at)
  VALUES (new.id, v_org_id, new.created_at, new.created_at);
  
  RETURN new;
END;
$function$;
