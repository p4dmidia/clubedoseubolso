-- FIX REGISTRATION TRIGGER - CLASSE A (V4 - ROBUST)
-- Este script corrige a falha silenciosa no cadastro e garante a criação dos perfis.
-- IMPORTANTE: COPIE TODO ESTE ARQUIVO E RODE NO "SQL EDITOR" DO SUPABASE

-- 1. Remover o trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Atualizar a função com lógica robusta (SEM EXCEPTION SILENCIOSO)
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
  v_sponsor_affiliate_id uuid;
  v_sponsor_user_id uuid;
  v_login text;
BEGIN
  -- 1. Determinar Login (Username) - Fallback para parte do email se vier vazio
  v_login := COALESCE(NULLIF(new.raw_user_meta_data ->> 'login', ''), split_part(new.email, '@', 1));
  
  -- 2. Nome Completo
  v_full_name := TRIM(CONCAT_WS(' ', 
    new.raw_user_meta_data ->> 'nome', 
    new.raw_user_meta_data ->> 'sobrenome'
  ));
  
  IF v_full_name = '' THEN
    v_full_name := v_login;
  END IF;

  -- 3. Resgatar organization_id (Tenant)
  BEGIN
    v_org_id := NULLIF(new.raw_user_meta_data ->> 'organization_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_org_id := NULL;
  END;

  IF v_org_id IS NULL THEN
     SELECT id INTO v_org_id FROM public.organizations WHERE name = 'Classe A' LIMIT 1;
  END IF;
  
  -- Fallback de segurança se ainda for null (ID fixo da Classe A no projeto)
  IF v_org_id IS NULL THEN
     v_org_id := '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid;
  END IF;

  -- 4. Resolver Patrocinador
  v_sponsor_code := NULLIF(new.raw_user_meta_data ->> 'sponsor_code', '');
  IF v_sponsor_code IS NOT NULL THEN
    SELECT id, user_id INTO v_sponsor_affiliate_id, v_sponsor_user_id
    FROM public.affiliates 
    WHERE LOWER(referral_code) = LOWER(v_sponsor_code) 
    AND organization_id = v_org_id 
    LIMIT 1;
  END IF;

  -- 5. Inserir Perfil (USER_PROFILES)
  -- Removido o bloco EXCEPTION para permitir que erros de SQL cheguem ao usuário no cadastro
  INSERT INTO public.user_profiles (
    id, email, full_name, login, organization_id, 
    sponsor_id, referrer_id, role, status, rank, 
    whatsapp, cpf, cnpj, created_at, updated_at
  )
  VALUES (
    new.id, 
    new.email, 
    v_full_name, 
    v_login, 
    v_org_id, 
    v_sponsor_user_id, 
    v_sponsor_user_id,
    COALESCE(new.raw_user_meta_data ->> 'role', 'affiliate'),
    'active',
    'Consultor',
    new.raw_user_meta_data ->> 'whatsapp',
    new.raw_user_meta_data ->> 'cpf',
    new.raw_user_meta_data ->> 'cnpj',
    new.created_at, 
    new.created_at
  );

  -- 6. Inserir Afiliado (AFFILIATES)
  INSERT INTO public.affiliates (
    user_id, email, full_name, referral_code, 
    sponsor_id, organization_id, whatsapp, 
    cpf, cnpj, is_active, created_at, updated_at
  )
  VALUES (
    new.id,
    new.email,
    v_full_name,
    v_login,
    v_sponsor_affiliate_id,
    v_org_id,
    new.raw_user_meta_data ->> 'whatsapp',
    new.raw_user_meta_data ->> 'cpf',
    new.raw_user_meta_data ->> 'cnpj',
    true,
    new.created_at,
    now()
  );

  -- 7. Criar Configurações (USER_SETTINGS)
  INSERT INTO public.user_settings (user_id, organization_id, created_at, updated_at)
  VALUES (new.id, v_org_id, new.created_at, new.created_at);
  
  RETURN new;
END;
$function$;

-- 3. Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_affiliate_user();
