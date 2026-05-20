-- V7 REGISTRATION TRIGGER - CLASSE A (COLLISION HANDLING & ROBUSTNESS)
-- Este script adiciona tratamento de colisão de logins/códigos de indicação e melhora a robustez.

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
   v_error_msg text;
   v_login text;
   v_temp_login text;
   v_exists boolean;
   v_counter integer := 0;
 BEGIN
   -- 1. Determinar Organização (Fallback para Classe A)
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

   -- 2. Determinar Dados Básicos
   v_login := LOWER(TRIM(COALESCE(new.raw_user_meta_data ->> 'login', split_part(new.email, '@', 1))));
   v_full_name := TRIM(CONCAT_WS(' ', new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'sobrenome'));
   IF v_full_name = '' OR v_full_name IS NULL THEN 
     v_full_name := COALESCE(new.raw_user_meta_data ->> 'nome', v_login); 
   END IF;

   -- 3. TRATAMENTO DE COLISÃO DE LOGIN (REFERRAL_CODE)
   -- Garante que o código de indicação seja único na organização
   v_temp_login := v_login;
   LOOP
     SELECT EXISTS (
       SELECT 1 FROM public.affiliates 
       WHERE LOWER(referral_code) = v_temp_login 
       AND organization_id = v_org_id
     ) INTO v_exists;
     
     EXIT WHEN NOT v_exists OR v_counter > 10;
     
     v_counter := v_counter + 1;
     v_temp_login := v_login || substr(md5(random()::text), 1, 4);
   END LOOP;
   v_login := v_temp_login;

   -- 4. Resolver Padrinho (Sponsor)
   v_sponsor_code := NULLIF(new.raw_user_meta_data ->> 'sponsor_code', '');
   
   IF v_sponsor_code IS NOT NULL THEN
     SELECT id, user_id INTO v_sponsor_affiliate_id, v_sponsor_user_id
     FROM public.affiliates 
     WHERE LOWER(referral_code) = LOWER(v_sponsor_code)
     AND organization_id = v_org_id
     LIMIT 1;
   END IF;

   -- Fallback para root se não encontrar patrocinador
   IF v_sponsor_user_id IS NULL THEN
     SELECT id, user_id INTO v_sponsor_affiliate_id, v_sponsor_user_id
     FROM public.affiliates
     WHERE organization_id = v_org_id
     ORDER BY created_at ASC
     LIMIT 1;
   END IF;

   -- 5. Criar Perfil do Usuário
   BEGIN
     INSERT INTO public.user_profiles (
       id, email, role, full_name, login, 
       whatsapp, cpf, cnpj, registration_type, 
       organization_id, sponsor_id, referrer_id,
       status, rank, created_at, updated_at
     )
     VALUES (
       new.id, 
       new.email, 
       COALESCE(new.raw_user_meta_data ->> 'role', 'affiliate'),
       v_full_name,
       v_login,
       new.raw_user_meta_data ->> 'whatsapp',
       new.raw_user_meta_data ->> 'cpf',
       new.raw_user_meta_data ->> 'cnpj',
       new.raw_user_meta_data ->> 'registration_type',
       v_org_id,
       v_sponsor_user_id,
       v_sponsor_user_id,
       'active',
       'Consultor',
       new.created_at, 
       new.created_at
     )
     ON CONFLICT (id) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       login = EXCLUDED.login,
       organization_id = EXCLUDED.organization_id,
       sponsor_id = EXCLUDED.sponsor_id;
   EXCEPTION WHEN OTHERS THEN
     GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
     -- Tentar logar erro se a tabela existir
     BEGIN
       INSERT INTO public.debug_logs (process_name, step, order_id, error_message)
       VALUES ('handle_new_affiliate_user', 'user_profiles_insert', new.id::text, v_error_msg);
     EXCEPTION WHEN OTHERS THEN NULL; END;
     RAISE EXCEPTION 'Erro ao salvar perfil (user_profiles): %', v_error_msg;
   END;

   -- 6. Criar Registro de Afiliado
   BEGIN
     INSERT INTO public.affiliates (
       user_id, email, full_name, referral_code, 
       whatsapp, cpf, cnpj, organization_id, sponsor_id, 
       is_active, created_at, updated_at
     )
     VALUES (
       new.id,
       new.email,
       v_full_name,
       v_login,
       new.raw_user_meta_data ->> 'whatsapp',
       new.raw_user_meta_data ->> 'cpf',
       new.raw_user_meta_data ->> 'cnpj',
       v_org_id,
       v_sponsor_affiliate_id,
       true,
       new.created_at,
       new.created_at
     )
     ON CONFLICT (user_id, organization_id) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       referral_code = EXCLUDED.referral_code,
       sponsor_id = EXCLUDED.sponsor_id;
   EXCEPTION WHEN OTHERS THEN
     GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
     BEGIN
       INSERT INTO public.debug_logs (process_name, step, order_id, error_message)
       VALUES ('handle_new_affiliate_user', 'affiliates_insert', new.id::text, v_error_msg);
     EXCEPTION WHEN OTHERS THEN NULL; END;
     RAISE EXCEPTION 'Erro ao salvar afiliado (affiliates): %', v_error_msg;
   END;

   -- 7. Criar Configurações Iniciais
   BEGIN
     INSERT INTO public.user_settings (user_id, organization_id, created_at, updated_at)
     VALUES (new.id, v_org_id, new.created_at, new.created_at)
     ON CONFLICT (user_id) DO NOTHING;
   EXCEPTION WHEN OTHERS THEN NULL; END;
   
   RETURN new;
 END;
 $function$;
