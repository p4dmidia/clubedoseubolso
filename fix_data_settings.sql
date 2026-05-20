-- 1. Corrige os dados existentes: 
-- Garante que todos os registros em user_settings tenham um organization_id
UPDATE public.user_settings us
SET organization_id = p.organization_id
FROM public.user_profiles p
WHERE us.user_id = p.id
AND us.organization_id IS NULL;

-- 2. Caso ainda existam nulos (ex: perfis sem org_id), define o padrão da Classe A
UPDATE public.user_settings 
SET organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'::uuid
WHERE organization_id IS NULL;

-- 3. Verifica se sobrou algum nulo
SELECT COUNT(*) as nulos_restantes FROM public.user_settings WHERE organization_id IS NULL;
