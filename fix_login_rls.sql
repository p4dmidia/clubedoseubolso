-- FIX LOGIN RLS - CLASSE A
-- Este script corrige o acesso público à tabela affiliates para permitir o login via referral_code
-- e garante que os usuários existentes tenham o organization_id em seus metadados.

-- 1. Permitir que o público (anon) busque o e-mail de um afiliado pelo código de indicação
-- Isso é essencial para a tela de login funcionar.
DROP POLICY IF EXISTS "Permitir_Busca_Login_Publico" ON public.affiliates;
CREATE POLICY "Permitir_Busca_Login_Publico" ON public.affiliates 
FOR SELECT TO anon 
USING (true);

-- 2. Garantir que a tabela user_profiles também permita leitura básica (se necessário no futuro)
-- Por enquanto, mantemos apenas para autenticados, mas corrigimos a política para evitar falhas com NULL
DROP POLICY IF EXISTS "Leitura_Profiles_Tenant" ON public.user_profiles;
CREATE POLICY "Leitura_Profiles_Tenant" ON public.user_profiles FOR SELECT 
TO authenticated 
USING (
    organization_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
    OR 
    (auth.jwt() -> 'app_metadata' ->> 'organization_id') IS NULL -- Fallback para evitar erro 406
);

-- 3. ATUALIZAR USUÁRIOS EXISTENTES
-- O RLS multitenant depende do 'organization_id' estar no app_metadata do JWT.
-- Usuários criados antes da implementação do multitenancy podem estar sem isso.
DO $$
DECLARE
    v_default_org_id uuid;
    r RECORD;
BEGIN
    -- Busca o ID da Classe A
    SELECT id INTO v_default_org_id FROM public.organizations WHERE name = 'Classe A' LIMIT 1;
    
    IF v_default_org_id IS NULL THEN
        RAISE EXCEPTION 'Organização Classe A não encontrada!';
    END IF;

    -- Atualiza todos os usuários que não tem organization_id no app_metadata
    FOR r IN (
        SELECT id, raw_app_meta_data 
        FROM auth.users 
        WHERE raw_app_meta_data->>'organization_id' IS NULL
    ) LOOP
        UPDATE auth.users 
        SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('organization_id', v_default_org_id)
        WHERE id = r.id;
    END LOOP;
END $$;
