-- FASE 4: LGPD e Anonimização
-- Executar no Supabase SQL Editor

-- Cria função para apagar a conta do usuário seguindo a LGPD (Anonimização de Faturas)
CREATE OR REPLACE FUNCTION public.delete_user_lgpd()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_anon_name text;
BEGIN
    -- Identificar o usuário que está pedindo a exclusão
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    -- Gerar nome anonimizado com ID curto
    v_anon_name := 'Anon_' || substr(md5(v_user_id::text), 1, 6);

    -- 1. Anonimizar Pedidos e Comissões
    UPDATE public.orders 
    SET 
        customer_name = v_anon_name,
        customer_email = v_anon_name || '@deleted.lgpd',
        customer_cpf = '000.000.000-00',
        customer_phone = '00000000000',
        shipping_address = 'Dado Excluído - LGPD'
    WHERE customer_email = (SELECT email FROM public.user_profiles WHERE id = v_user_id);

    -- 2. Log de Auditoria
    INSERT INTO public.admin_audit_logs (action_type, target_id, details)
    VALUES ('lgpd_account_deletion', v_user_id, jsonb_build_object('reason', 'user_requested_deletion', 'anon_id', v_anon_name));

    -- 3. Deletar Perfil e Usuário Auth (O ON DELETE CASCADE limpa affiliates e afins)
    -- Atenção: para deletar o Auth via RPC requer permissão especial, 
    -- então o ideal é usar o supabase-admin ou, na ausência, deletar apenas os perfis.
    -- Vamos deletar o profile, o que desloga e inutiliza a conta publicamente.
    DELETE FROM public.user_profiles WHERE id = v_user_id;

    -- Deleção direta em auth.users (necessário SECURITY DEFINER)
    DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;
