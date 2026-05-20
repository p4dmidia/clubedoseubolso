-- FASE 2: Atualização de Banco de Dados para Comissões e Antifraude

-- 1. Adicionar status da comissão (para controle de carência)
ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'::text; -- pending, available, cancelled

-- 2. Criar tabela de Logs Antifraude
CREATE TABLE IF NOT EXISTS public.anti_fraud_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id text REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_email text,
    customer_cpf text,
    affiliate_id uuid REFERENCES auth.users(id),
    reason text NOT NULL, -- ex: 'self_referral_abuse', 'multiple_suspicious_purchases'
    action_taken text, -- ex: 'commission_blocked'
    created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.anti_fraud_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view anti fraud logs" ON public.anti_fraud_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin_master', 'admin_op')
    )
  );
