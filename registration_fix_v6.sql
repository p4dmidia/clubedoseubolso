-- V6 REGISTRATION TRIGGER - CLASSE A (FIXED SPONSOR MAPPING)
-- Este script corrige o mapeamento de sponsor_id que estava usando o ID de afiliado no perfil de usuário.

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
 BEGIN
   -- A. Log de Início (Opcional, mas mantido para consistência)
   -- Nota: Logs em tabelas podem ser perdidos em caso de ROLLBACK total da transação.
   
   -- B. Determinar Dados Básicos
   v_login := COALESCE(new.raw_user_meta_data ->> 'login', split_part(new.email, '@', 1));
   v_full_name := TRIM(CONCAT_WS(' ', new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'sobrenome'));
   IF v_full_name = '' THEN v_full_name := v_login; END IF;

   -- C. Determinar Organização (Fallback para Classe A)
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

   -- D. Resolver Padrinho (Sponsor) - PEGAR AMBOS OS IDS
   v_sponsor_code := NULLIF(new.raw_user_meta_data ->> 'sponsor_code', '');
   
   IF v_sponsor_code IS NOT NULL THEN
     -- Pegamos o id (afiliado) e user_id (usuário) do padrinho
     SELECT id, user_id INTO v_sponsor_affiliate_id, v_sponsor_user_id
     FROM public.affiliates 
     WHERE LOWER(referral_code) = LOWER(v_sponsor_code)
     AND organization_id = v_org_id
     LIMIT 1;
   END IF;

   -- Fallback para cabeça de rede (se não tem patrocinador, vincula ao root da empresa)
   IF v_sponsor_user_id IS NULL THEN
     SELECT id, user_id INTO v_sponsor_affiliate_id, v_sponsor_user_id
     FROM public.affiliates
     WHERE organization_id = v_org_id
     ORDER BY created_at ASC
     LIMIT 1;
   END IF;

   -- E. Criar Perfil do Usuário
   -- IMPORTANTE: sponsor_id no perfil DEVE ser o user_id do padrinho
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
       v_sponsor_user_id, -- <--- USANDO O USER_ID AQUI
       v_sponsor_user_id, -- <--- USANDO O USER_ID AQUI
       'active',
       'Consultor',
       new.created_at, 
       new.created_at
     );
   EXCEPTION WHEN OTHERS THEN
     GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
     RAISE EXCEPTION 'Erro ao salvar perfil (user_profiles): %', v_error_msg;
   END;

   -- F. Criar Registro de Afiliado
   -- IMPORTANTE: sponsor_id no cadastro de afiliado DEVE ser o ID de afiliado do padrinho
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
       v_sponsor_affiliate_id, -- <--- USANDO O ID DE AFILIADO AQUI
       true,
       new.created_at,
       new.created_at
     );
   EXCEPTION WHEN OTHERS THEN
     GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
     RAISE EXCEPTION 'Erro ao salvar afiliado (affiliates): %', v_error_msg;
   END;

   -- G. Criar Configurações Iniciais
   BEGIN
     INSERT INTO public.user_settings (user_id, organization_id, created_at, updated_at)
     VALUES (new.id, v_org_id, new.created_at, new.created_at);
   EXCEPTION WHEN OTHERS THEN NULL; END;
   
   RETURN new;
 END;
 $function$;
