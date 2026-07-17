-- Script para automatizar a verificação dos afiliados
-- Execute este script no SQL Editor do seu painel do Supabase

-- 1. Alterar o valor padrão da coluna is_verified para true
ALTER TABLE public.affiliates ALTER COLUMN is_verified SET DEFAULT true;

-- 2. Atualizar todos os afiliados existentes que estão marcados como Pendente (false) para Ativo (true)
UPDATE public.affiliates SET is_verified = true WHERE is_verified = false;
