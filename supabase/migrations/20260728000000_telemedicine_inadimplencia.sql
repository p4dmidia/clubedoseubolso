-- Migration: Add telemedicine status tracking columns and setup cron structure
-- Path: supabase/migrations/20260728000000_telemedicine_inadimplencia.sql

-- 1. Adicionar colunas na tabela user_profiles para rastrear o status da telemedicina
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS telemedicine_status text DEFAULT 'active'::text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS telemedicine_blocked_at timestamp with time zone;

-- 2. Adicionar colunas na tabela orders para rastrear faturas atrasadas do Asaas
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_due_date timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_overdue_at timestamp with time zone;

-- 3. Atualizar o status inicial da telemedicina para usuários que já possuem planos pagos ativos
UPDATE public.user_profiles
SET telemedicine_status = 'active'
WHERE id IN (
    SELECT DISTINCT o.user_id 
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    JOIN public.products p ON oi.product_id = p.id
    LEFT JOIN public.product_categories pc ON p.category_id = pc.id
    WHERE o.status = 'Pago'
      AND (pc.name = 'Planos' OR p.name ILIKE '%Telemedicina%')
);
