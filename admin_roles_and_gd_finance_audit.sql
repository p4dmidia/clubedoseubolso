-- SCRIPT DE ATUALIZAÇÃO DO BANCO DE DADOS: NÍVEIS ADMINISTRATIVOS E RLS
-- Execute este script no SQL Editor do Supabase para aplicar as alterações.

-- 1. Atualizar public.is_admin() para incluir 'admin_gerente'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'admin_master', 'admin_op', 'admin_gerente')
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar public.admin_create_user() para permitir execução por 'admin_gerente'
CREATE OR REPLACE FUNCTION public.admin_create_user(
    p_email text,
    p_password text,
    p_role text,
    p_full_name text,
    p_whatsapp text,
    p_cpf text,
    p_cnpj text,
    p_login text,
    p_sponsor_code text
)
RETURNS uuid AS $$
DECLARE
    v_user_id uuid;
    v_encrypted_pw text;
    v_org_id uuid;
BEGIN
    -- Verificar se quem está chamando é admin (Master, Operador ou Gerente)
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('admin', 'admin_master', 'admin_op', 'admin_gerente')
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores podem criar usuários.';
    END IF;

    -- Verificar se o e-mail já existe no auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        RAISE EXCEPTION 'Este e-mail já está sendo usado por outro usuário.';
    END IF;

    -- Obter a organização do admin logado
    SELECT organization_id INTO v_org_id FROM public.user_profiles WHERE id = auth.uid();
    
    -- Fallback: Obter a primeira organização cadastrada na tabela
    IF v_org_id IS NULL THEN
        SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    END IF;

    -- Hash do password com pgcrypto
    v_encrypted_pw := crypt(p_password, gen_salt('bf'));
    v_user_id := gen_random_uuid();

    -- Inserir na tabela auth.users
    INSERT INTO auth.users (
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        'authenticated',
        'authenticated',
        p_email,
        v_encrypted_pw,
        now(),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        jsonb_build_object(
            'role', p_role,
            'nome', p_full_name,
            'sobrenome', '',
            'whatsapp', p_whatsapp,
            'cpf', p_cpf,
            'cnpj', p_cnpj,
            'login', COALESCE(p_login, split_part(p_email, '@', 1)),
            'sponsor_code', p_sponsor_code,
            'organization_id', v_org_id
        ),
        now(),
        now()
    );

    -- Gravar log de auditoria administrativa
    INSERT INTO public.admin_audit_logs (admin_id, action_type, target_id, details)
    VALUES (auth.uid(), 'create_user', v_user_id, jsonb_build_object('email', p_email, 'role', p_role));

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- 3. Atualizar Políticas de RLS da tabela public.admin_audit_logs para usar is_admin()
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- 4. Atualizar Políticas de RLS da tabela public.anti_fraud_logs para usar is_admin()
DROP POLICY IF EXISTS "Admins can view anti fraud logs" ON public.anti_fraud_logs;
CREATE POLICY "Admins can view anti fraud logs" ON public.anti_fraud_logs
  FOR SELECT USING (public.is_admin());

-- 5. Criar função para atualizar dados de administradores de forma segura (admin_update_admin_user)
CREATE OR REPLACE FUNCTION public.admin_update_admin_user(
    p_user_id uuid,
    p_email text,
    p_password text,
    p_role text,
    p_full_name text,
    p_whatsapp text,
    p_cpf text
)
RETURNS void AS $$
DECLARE
    v_encrypted_pw text;
BEGIN
    -- Verificar se quem está chamando é admin Master
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('admin', 'admin_master')
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores Master podem alterar dados de outros administradores.';
    END IF;

    -- Atualizar user_profiles
    UPDATE public.user_profiles
    SET 
        email = p_email,
        role = p_role,
        full_name = p_full_name,
        whatsapp = p_whatsapp,
        cpf = NULLIF(p_cpf, ''),
        updated_at = now()
    WHERE id = p_user_id;

    -- Atualizar auth.users
    UPDATE auth.users
    SET 
        email = p_email,
        raw_user_meta_data = raw_user_meta_data || 
            jsonb_build_object(
                'role', p_role,
                'nome', p_full_name,
                'whatsapp', p_whatsapp,
                'cpf', p_cpf
            ),
        updated_at = now()
    WHERE id = p_user_id;

    -- Se senha informada, atualizar encrypted_password
    IF p_password IS NOT NULL AND p_password <> '' THEN
        v_encrypted_pw := crypt(p_password, gen_salt('bf'));
        UPDATE auth.users
        SET encrypted_password = v_encrypted_pw
        WHERE id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- Conceder permissão de execução
GRANT EXECUTE ON FUNCTION public.admin_update_admin_user(uuid, text, text, text, text, text, text) TO authenticated;

