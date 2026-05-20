-- QUERY DE VERIFICAÇÃO DE AUTO-COMISSÕES EXISTENTES (CLASSE A)
-- Esta query identifica comissões pagas para a mesma pessoa que fez a compra.

SELECT 
    o.id AS pedido_id,
    o.customer_name AS comprador,
    c.amount AS valor_comissao,
    c.level AS nivel,
    c.created_at AS data_geracao
FROM public.commissions c
JOIN public.orders o ON c.order_id = o.id
WHERE c.user_id = o.user_id -- Beneficiário é o mesmo que o comprador
AND c.organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd' -- Apenas Classe A
ORDER BY c.created_at DESC;

-- CASO QUEIRA REMOVER ESSAS COMISSÕES (E ESTORNAR O SALDO):
-- ATENÇÃO: Execute apenas se tiver certeza.
/*
BEGIN;
-- 1. Estorna o saldo dos usuários
UPDATE public.user_settings us
SET 
    total_earnings = total_earnings - sub.total_to_remove,
    available_balance = available_balance - sub.total_to_remove
FROM (
    SELECT c.user_id, SUM(c.amount) as total_to_remove
    FROM public.commissions c
    JOIN public.orders o ON c.order_id = o.id
    WHERE c.user_id = o.user_id 
    AND c.organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'
    GROUP BY c.user_id
) sub
WHERE us.user_id = sub.user_id;

-- 2. Remove as comissões indevidas
DELETE FROM public.commissions
WHERE id IN (
    SELECT c.id
    FROM public.commissions c
    JOIN public.orders o ON c.order_id = o.id
    WHERE c.user_id = o.user_id 
    AND c.organization_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'
);
COMMIT;
*/
