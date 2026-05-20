-- DIAGNOSE REGISTRATION - CLASSE A
-- Este script verifica o estado das tabelas e do trigger de cadastro.

-- 1. Verificar se a organização "Classe A" existe e qual o ID
SELECT id, name FROM public.organizations WHERE name = 'Classe A';

-- 2. Verificar se o trigger está ativo na tabela auth.users
SELECT trigger_name, event_manipulation, action_statement, action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- 3. Verificar se existem logs de erro recentes (se a função logar)
-- Como a função atual não loga erros no INSERT, vamos criar uma versão "Robiusta" para debug.

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
  -- Log de entrada
  RAISE NOTICE 'DEBUG: Iniciando cadastro para usuário %', new.email;

  v_full_name := TRIM(CONCAT_WS(' ', new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'sobrenome'));
  IF v_full_name = '' THEN v_full_name := 'Novo Afiliado'; END IF;

  -- Resgata organization_id
  BEGIN
    v_org_id := (new.raw_user_meta_data ->> 'organization_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_org_id := NULL;
  END;
  
  -- Fallback para Classe A
  IF v_org_id IS NULL THEN
     SELECT id INTO v_org_id FROM public.organizations WHERE name = 'Classe A' LIMIT 1;
  END IF;

  IF v_org_id IS NULL THEN
     RAISE EXCEPTION 'DEBUG ERROR: v_org_id is NULL. Não foi possível encontrar a organização Classe A.';
  END IF;

  -- 1. Insert Profile
  BEGIN
    INSERT INTO public.user_profiles (id, email, organization_id, created_at, updated_at)
    VALUES (new.id, new.email, v_org_id, new.created_at, new.created_at);
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'DEBUG ERROR in user_profiles: %', SQLERRM;
    RAISE;
  END;

  -- 2. Insert Affiliate
  BEGIN
    INSERT INTO public.affiliates (user_id, email, full_name, referral_code, organization_id, created_at, updated_at)
    VALUES (new.id, new.email, v_full_name, new.raw_user_meta_data ->> 'login', v_org_id, new.created_at, new.updated_at);
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'DEBUG ERROR in affiliates: %', SQLERRM;
    RAISE;
  END;

  -- 3. Insert Settings
  BEGIN
    INSERT INTO public.user_settings (user_id, organization_id, created_at, updated_at)
    VALUES (new.id, v_org_id, new.created_at, new.created_at);
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'DEBUG ERROR in user_settings: %', SQLERRM;
    RAISE;
  END;
  
  RETURN new;
END;
$function$;
