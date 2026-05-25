-- 0. Atualizar o nome da organização no banco de dados para o nome correto do projeto
UPDATE public.organizations SET name = 'Clube do Seu Bolso' WHERE name = 'Classe A';

-- 1. Garantir que a função is_admin() reconheça os novos papéis admin_master e admin_op
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'admin_master', 'admin_op')
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Permitir que qualquer pessoa (anônimos inclusive) grave logs de segurança de tentativas de login
DROP POLICY IF EXISTS "Everyone (auth) can insert security logs" ON public.security_logs;
DROP POLICY IF EXISTS "Allow public insert of security logs" ON public.security_logs;

CREATE POLICY "Allow public insert of security logs" 
ON public.security_logs 
FOR INSERT 
TO public 
WITH CHECK (true);

-- 2. Criar função administrativa de cadastro interno de usuários
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
    -- 1. Verificar se quem está chamando é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('admin', 'admin_master', 'admin_op')
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores podem criar usuários.';
    END IF;

    -- 2. Verificar se o e-mail já existe no auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        RAISE EXCEPTION 'Este e-mail já está sendo usado por outro usuário.';
    END IF;

    -- 3. Obter a organização do admin logado
    SELECT organization_id INTO v_org_id FROM public.user_profiles WHERE id = auth.uid();
    
    -- Fallback: Obter a primeira organização cadastrada na tabela
    IF v_org_id IS NULL THEN
        SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    END IF;

    -- 4. Hash do password com pgcrypto (geralmente instalado no schema extensions ou public)
    v_encrypted_pw := crypt(p_password, gen_salt('bf'));
    v_user_id := gen_random_uuid();

    -- 5. Inserir na tabela auth.users
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

    -- 6. Gravar log de auditoria administrativa
    INSERT INTO public.admin_audit_logs (admin_id, action_type, target_id, details)
    VALUES (auth.uid(), 'create_user', v_user_id, jsonb_build_object('email', p_email, 'role', p_role));

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- Conceder permissão de execução aos usuários logados
GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, text, text, text, text, text, text) TO authenticated;
