-- FIX AFFILIATE REFERRALS IDS - CLASSE A
-- Este script corrige TODOS os indicados que estão vinculados pelo UserID (auth.users)
-- em vez do ID de Afiliado (public.affiliates), o que impede sua exibição no dashboard.

-- 1. Verificar quantos registros serão corrigidos
SELECT count(*) 
FROM public.affiliates a
JOIN public.affiliates s ON a.sponsor_id = s.user_id AND a.organization_id = s.organization_id
WHERE a.sponsor_id != s.id;

-- 2. Executar a correção global
UPDATE public.affiliates a
SET sponsor_id = s.id,
    updated_at = now()
FROM public.affiliates s
WHERE a.sponsor_id = s.user_id
AND a.organization_id = s.organization_id
AND a.sponsor_id != s.id;

-- 3. (Opcional) Log de conferência para o 'classea@admin.com'
-- Este já foi corrigido via API, mas rodar este SQL garante que futuros casos sejam evitados.
-- O trigger fix_registration_trigger.sql deve estar aplicado para evitar novos erros.
