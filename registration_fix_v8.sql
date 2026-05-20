-- V8 MULTI-TENANT TRIGGER (PADRONIZADO)
-- Este script é genérico e funciona para todas as organizações (Classe A, Bella Sousa, etc.)
-- sem interferência mútua.

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
   v_temp_login text;
   v_exists boolean;
   v_counter integer := 0;
 BEGIN
   -- 1. Determinar Organização de forma DINÂMICA
   -- Prioridade 1: Meta-data direta
   v_org_id := NULLIF(new.raw_user_meta_data ->> 'organization_id', '')::uuid;
   
   -- Prioridade 2: Se não houver ID, tenta buscar pelo nome da organização no meta-data (se existir)
   IF v_org_id IS NULL AND (new.raw_user_meta_data ->> 'organization_name') IS NOT NULL THEN
      SELECT id INTO v_org_id FROM public.organizations 
      WHERE LOWER(name) = LOWER(new.raw_user_meta_data ->> 'organization_name') 
      LIMIT 1;
   END IF;

   -- Se ainda for nulo, o sistema não pode prosseguir com segurança
   IF v_org_id IS NULL THEN
      RAISE EXCEPTION 'Erro de Multi-tenant: organization_id não identificado no cadastro.';
   END IF;

   -- 2. Determinar Dados Básicos
   v_login := LOWER(TRIM(COALESCE(new.raw_user_meta_data ->> 'login', split_part(new.email, '@', 1))));
   v_full_name := TRIM(CONCAT_WS(' ', new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'sobrenome'));
   IF v_full_name = '' OR v_full_name IS NULL THEN 
     v_full_name := COALESCE(new.raw_user_meta_data ->> 'nome', v_login); 
   END IF;

   -- 3. TRATAMENTO DE COLISÃO DE LOGIN (Restrito à Organização)
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

   -- 4. Resolver Padrinho (Sponsor) - SEMPRE DENTRO DA MESMA ORG
   v_sponsor_code := NULLIF(new.raw_user_meta_data ->> 'sponsor_code', '');
   
   IF v_sponsor_code IS NOT NULL THEN
     SELECT id, user_id INTO v_sponsor_affiliate_id, v_sponsor_user_id
     FROM public.affiliates 
     WHERE LOWER(referral_code) = LOWER(v_sponsor_code)
     AND organization_id = v_org_id
     LIMIT 1;
   END IF;

   -- Fallback para o afiliado raiz da MESMA organização
   IF v_sponsor_user_id IS NULL THEN
     SELECT id, user_id INTO v_sponsor_affiliate_id, v_sponsor_user_id
     FROM public.affiliates
     WHERE organization_id = v_org_id
     ORDER BY created_at ASC
     LIMIT 1;
   END IF;

   -- 5. Criar Perfil do Usuário
   INSERT INTO public.user_profiles (
     id, email, role, full_name, login, 
     organization_id, sponsor_id, referrer_id,
     status, rank, created_at, updated_at
   )
   VALUES (
     new.id, 
     new.email, 
     COALESCE(new.raw_user_meta_data ->> 'role', 'affiliate'),
     v_full_name,
     v_login,
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

   -- 6. Criar Registro de Afiliado
   INSERT INTO public.affiliates (
     user_id, email, full_name, referral_code, 
     organization_id, sponsor_id, 
     is_active, created_at, updated_at
   )
   VALUES (
     new.id,
     new.email,
     v_full_name,
     v_login,
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

   -- 7. Criar Configurações Iniciais
   INSERT INTO public.user_settings (user_id, organization_id, created_at, updated_at)
   VALUES (new.id, v_org_id, new.created_at, new.created_at)
   ON CONFLICT (user_id) DO NOTHING;
   
   RETURN new;
 END;
 $function$;
