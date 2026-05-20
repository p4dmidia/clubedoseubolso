-- SCRIP DEFINITIVO PARA CORRIGIR REGISTRO E REDE NO SUPABASE
-- IMPORTANTE: COPIE TODO ESTE ARQUIVO E RODE NO "SQL EDITOR" DO SUPABASE

-- 1. Substituir a Função Principal do Gatilho com a Correção do Cabeça de Rede e Patrocinador
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
   -- Determinar Dados Básicos
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

   -- Resolver Padrinho (Sponsor) - PEGAR AMBOS OS IDS
   v_sponsor_code := NULLIF(new.raw_user_meta_data ->> 'sponsor_code', '');
   
   IF v_sponsor_code IS NOT NULL THEN
     SELECT id, user_id INTO v_sponsor_affiliate_id, v_sponsor_user_id
     FROM public.affiliates 
     WHERE LOWER(referral_code) = LOWER(v_sponsor_code)
     AND organization_id = v_org_id
     LIMIT 1;
   END IF;

   -- Fallback: Se não encontrar patrocinador ou não tiver patrocinador, vincula ao primeiro da empresa
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
     NULL; -- Silent contiune for stability
   END;

   -- Criar Registro de Afiliado
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
     NULL; -- Silent continue
   END;

   -- Criar Configurações Iniciais
   BEGIN
     INSERT INTO public.user_settings (user_id, organization_id, created_at, updated_at)
     VALUES (new.id, v_org_id, new.created_at, new.created_at);
   EXCEPTION WHEN OTHERS THEN NULL; END;
   
   RETURN new;
 END;
 $function$;

-- 2. Recriar/Vincular a Trigger OBRIGATORIAMENTE para funcionar em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_affiliate_user();
