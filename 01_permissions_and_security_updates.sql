-- FASE 1: Atualização de Banco de Dados para Segurança e Perfis

-- 1. Modificar a tabela user_profiles para adequar os novos campos
ALTER TABLE public.user_profiles 
  ALTER COLUMN role SET DEFAULT 'client'::text;

-- Adicionar controle de assinatura para afiliados
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive'::text,
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Adicionar campos de LGPD no user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS lgpd_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS lgpd_ip text,
  ADD COLUMN IF NOT EXISTS lgpd_version text DEFAULT '1.0'::text;

-- 2. Criar a tabela de Auditoria Administrativa (LGPD e Segurança)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type text NOT NULL, -- ex: 'approve_withdrawal', 'change_role', 'delete_user'
    target_id uuid, -- O ID do usuário/recurso que sofreu a ação
    details jsonb, -- Dados adicionais sobre o que mudou
    ip_address text,
    created_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para admin_audit_logs (Apenas Admins podem ver/inserir)
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin_master', 'admin_op')
    )
  );

CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin_master', 'admin_op')
    )
  );

-- 3. Atualizar função de indicação e bloqueio (Exemplo de comissão desvio para Master)
-- OBS: A função final de comissão será aprofundada posteriormente, 
-- mas deixamos a marcação para o status de inadimplência no banco de dados.

-- Comentário: Configurações de JWT (15m acesso, 7d refresh) devem ser feitas 
-- diretamente no painel do Supabase em: Authentication -> Policies / Configuration.
