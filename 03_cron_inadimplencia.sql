-- FASE 3: Automação de Inadimplência (CRON JOB)
-- Executar esta rotina diretamente no Supabase SQL Editor.

-- 1. Criar a função que verifica afiliados com assinatura vencida e congela o status
CREATE OR REPLACE FUNCTION public.processar_inadimplencia_diaria()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    afiliado RECORD;
    qtd_congelados INTEGER := 0;
BEGIN
    -- Log do início da execução
    RAISE LOG 'Iniciando processamento de inadimplência diária: %', now();

    FOR afiliado IN 
        SELECT id, email 
        FROM public.user_profiles 
        WHERE role = 'affiliate' 
          AND subscription_status = 'active'
          AND subscription_expires_at < now()
    LOOP
        -- Atualiza o status para inadimplente
        UPDATE public.user_profiles
        SET subscription_status = 'inadimplente'
        WHERE id = afiliado.id;

        -- Bloqueia saques pendentes desse usuário, para evitar que ele consiga aprovação enquanto inadimplente
        -- (Opcional, mas recomendado como medida de segurança extra)
        -- UPDATE public.withdrawals 
        -- SET status = 'congelado' 
        -- WHERE user_id = afiliado.id AND status = 'pendente';

        qtd_congelados := qtd_congelados + 1;
        
        -- Inserir log de auditoria
        INSERT INTO public.admin_audit_logs (action_type, target_id, details)
        VALUES ('auto_freeze_affiliate', afiliado.id, jsonb_build_object('reason', 'subscription_expired', 'email', afiliado.email));
    END LOOP;

    RAISE LOG 'Processamento concluído. Total de afiliados congelados: %', qtd_congelados;
END;
$$;

-- 2. Agendar a execução diária às 00:00 usando o pg_cron
-- ATENÇÃO: O pg_cron precisa estar habilitado no Supabase (Extensions -> pg_cron).
-- Se a extensão já estiver ativada, a linha abaixo irá criar o agendamento.
SELECT cron.schedule(
    'job_inadimplencia_diaria',
    '0 0 * * *', -- Executa todo dia à meia-noite
    'SELECT public.processar_inadimplencia_diaria()'
);
