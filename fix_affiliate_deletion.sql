-- FIX AFFILIATE DELETION AND USER CLEANUP

-- 1. ADICIONAR ON DELETE CASCADE ÀS TABELAS RELACIONADAS
-- Isso garante que ao deletar um usuário em auth.users, tudo o que for dele suma automaticamente.

-- Perfil de Usuário
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey,
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Afiliados
ALTER TABLE public.affiliates 
DROP CONSTRAINT IF EXISTS affiliates_user_id_fkey,
ADD CONSTRAINT affiliates_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Configurações (Saldos)
ALTER TABLE public.user_settings 
DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey,
ADD CONSTRAINT user_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Saques
ALTER TABLE public.withdrawals 
DROP CONSTRAINT IF EXISTS withdrawals_user_id_fkey,
ADD CONSTRAINT withdrawals_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Cupons de Clientes
ALTER TABLE public.customer_coupons 
DROP CONSTRAINT IF EXISTS customer_coupons_user_id_fkey,
ADD CONSTRAINT customer_coupons_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- 2. FUNÇÃO PARA DELETAR USUÁRIO DO AUTH (SECURITY DEFINER)
-- Permite que um admin delete um usuário do sistema de autenticação via RPC.

DROP FUNCTION IF EXISTS public.admin_delete_user(uuid);

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Verificar se quem está chamando é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: Somente administradores podem excluir usuários.';
  END IF;

  -- Deletar o usuário de auth.users (isso disparará o CASCADE para as outras tabelas)
  DELETE FROM auth.users WHERE id = p_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;


-- 3. LIMPEZA DO USUÁRIO ESPECÍFICO (gilgalmissoes@gmail.com)
-- Como o afiliado já foi deletado, mas ele ficou no auth, vamos remover do auth agora.
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'gilgalmissoes@gmail.com';
    
    IF v_user_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = v_user_id;
        RAISE NOTICE 'Usuário gilgalmissoes@gmail.com removido com sucesso.';
    END IF;
END $$;
