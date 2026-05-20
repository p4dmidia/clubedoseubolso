-- FIX REGISTRATION TRIGGER - CLASSE A (V4 - STRICT TENANT REFERRALS)
-- Este script corrige o trigger para vincular corretamente o patrocinador (sponsor_id)
-- APENAS se ele pertencer à mesma organização do novo usuário.

-- 1. Remover o trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Atualizar a função com a lógica de patrocínio
CREATE OR REPLACE FUNCTION public.handle_new_affiliate_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_full_name text;
  v_org_id uuid;
  v_sponsor_code text;
  v_sponsor_id uuid;
BEGIN
  -- Build full name safely
  v_full_name := TRIM(CONCAT_WS(' ', 
    new.raw_user_meta_data ->> 'nome', 
    new.raw_user_meta_data ->> 'sobrenome'
  ));
  
  IF v_full_name = '' THEN
    v_full_name := 'Novo Afiliado';
  END IF;

  -- Get organization_id from metadata or default to Classe A
  BEGIN
    v_org_id := (new.raw_user_meta_data ->> 'organization_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_org_id := NULL;
  END;

  IF v_org_id IS NULL THEN
     SELECT id INTO v_org_id FROM public.organizations WHERE name = 'Classe A' LIMIT 1;
  END IF;

  -- RESOLVER PATROCINADOR (Stricto Senso por Organização)
  v_sponsor_code := new.raw_user_meta_data ->> 'sponsor_code';
  IF v_sponsor_code IS NOT NULL AND v_sponsor_code <> '' THEN
    -- Apenas vincula se o patrocinador (referral_code) existir NA MESMA ORGANIZAÇÃO
    SELECT id INTO v_sponsor_id 
    FROM public.affiliates 
    WHERE LOWER(referral_code) = LOWER(v_sponsor_code) 
    AND organization_id = v_org_id 
    LIMIT 1;
    
    -- Log para debug se necessário (opcional)
    -- RAISE NOTICE 'Sponsor resolution for %: code %, found id %', new.email, v_sponsor_code, v_sponsor_id;
  END IF;

  -- 1. Create Profile
  INSERT INTO public.user_profiles (id, email, organization_id, created_at, updated_at)
  VALUES (new.id, new.email, v_org_id, new.created_at, new.created_at);

  -- 2. Create Affiliate
  INSERT INTO public.affiliates (user_id, email, full_name, referral_code, sponsor_id, organization_id, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    v_full_name,
    LOWER(new.raw_user_meta_data ->> 'login'),
    v_sponsor_id,
    v_org_id,
    new.created_at,
    now()
  );

  -- 3. Create Settings
  INSERT INTO public.user_settings (user_id, organization_id, created_at, updated_at)
  VALUES (
    new.id,
    v_org_id,
    new.created_at,
    new.created_at
  );
  
  RETURN new;
END;
$function$;

-- 3. Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_affiliate_user();
