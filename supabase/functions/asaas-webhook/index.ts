import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function processAffiliateAndCommissions(order: any, supabaseClient: any) {
    // 1. Upgrade de Plano (Heurística: Se comprou algo de R$ 197)
    if (Number(order.total_amount) === 197) {
       await supabaseClient.from('user_profiles').update({
           role: 'affiliate',
           subscription_status: 'active',
           subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
       }).eq('email', order.customer_email);
       console.log(`[Webhook] Usuário ${order.customer_email} promovido a Afiliado com sucesso.`);
    }

    // 2. Fluxo de Comissão e Antifraude
    if (order.referral_code) {
        const { data: affiliate } = await supabaseClient.from('user_profiles')
             .select('id, cpf, email, subscription_status')
             .eq('login', order.referral_code)
             .single();

        if (affiliate) {
             // A. Anti-Fraude: Auto-indicação
             if (affiliate.cpf === order.customer_cpf || affiliate.email === order.customer_email) {
                 console.warn(`[Antifraude] Auto-indicação detectada para pedido ${order.id}.`);
                 await supabaseClient.from('anti_fraud_logs').insert({
                     order_id: order.id,
                     customer_email: order.customer_email,
                     customer_cpf: order.customer_cpf,
                     affiliate_id: affiliate.id,
                     reason: 'self_referral_abuse',
                     action_taken: 'commission_blocked'
                 });
                 return;
             }

             // B. Inadimplência
             let commissionTargetId = affiliate.id;
             if (affiliate.subscription_status === 'inadimplente') {
                 console.warn(`[Regras] Afiliado inadimplente. Desviando comissão para o Master.`);
                 const { data: master } = await supabaseClient.from('user_profiles')
                     .select('id').eq('role', 'admin_master').limit(1).single();
                 if (master) commissionTargetId = master.id;
             }

             // C. Gerar comissão em carência
             const commissionAmount = Number(order.total_amount) * 0.10; // Exemplo de 10%
             await supabaseClient.from('commissions').insert({
                 user_id: commissionTargetId,
                 order_id: order.id,
                 amount: commissionAmount,
                 level: 1,
                 commission_type: 'venda_direta',
                 status: 'pending' // Fica pending aguardando cron de carência
             });
             console.log(`[Webhook] Comissão pending registrada para ${commissionTargetId}.`);
        }
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const asaasToken = req.headers.get("asaas-access-token") ?? "";
    const configuredToken = Deno.env.get("ASAAS_WEBHOOK_SECRET") ?? "";
    const authHeader = req.headers.get("authorization") ?? "";
    const anonKey = Deno.env.get("CLUBE_ANON_KEY") ?? "";
    const isAnonAuthorized = authHeader === `Bearer ${anonKey}` || authHeader.replace("Bearer ", "") === anonKey;

    // Se for uma requisição GET para depuração de logs ou info de diagnóstico
    const urlObj = new URL(req.url);
    const debugAction = urlObj.searchParams.get("debug_action");

    if (debugAction === "get_recent_logs") {
        if ((!configuredToken || asaasToken !== configuredToken) && !isAnonAuthorized) {
            return new Response("Unauthorized", { status: 401, headers: corsHeaders });
        }
        
        try {
            const { data: logs, error } = await supabase
                .from("debug_logs")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(50);
                
            if (error) throw error;
            
            return new Response(JSON.stringify(logs), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
    }

    // 1. Log de Entrada (Para auditar se o webhook está batendo e se os tokens coincidem)
    try {
        const maskedReceived = asaasToken ? `${asaasToken.substring(0, 3)}...${asaasToken.substring(asaasToken.length - 3)}` : "ausente";
        const maskedConfigured = configuredToken ? `${configuredToken.substring(0, 3)}...${configuredToken.substring(configuredToken.length - 3)}` : "ausente";
        
        await supabase.from("debug_logs").insert({
            operation: "asaas_webhook_incoming",
            message: `Chamada recebida do webhook do Asaas. Token recebido: '${maskedReceived}', Token configurado: '${maskedConfigured}'`,
            metadata: {
                has_token_header: !!asaasToken,
                has_configured_secret: !!configuredToken,
                equal: asaasToken === configuredToken
            }
        });
    } catch (err) {
        console.error("[Asaas Webhook] Erro ao gravar log de entrada no DB:", err.message);
    }

    // 2. Validação do Token
    if (!configuredToken || asaasToken !== configuredToken) {
        console.warn(`[Asaas Webhook] Acesso não autorizado. Header token recebido: ${asaasToken}`);
        
        try {
            await supabase.from("debug_logs").insert({
                operation: "asaas_webhook_unauthorized",
                message: `Bloqueado: Token recebido não bate com o configurado.`,
                metadata: {
                    received_token_masked: asaasToken ? `${asaasToken.substring(0, 3)}...${asaasToken.substring(asaasToken.length - 3)}` : "ausente"
                }
            });
        } catch (err) {
            console.error("[Asaas Webhook] Erro ao gravar log de não autorizado no DB:", err.message);
        }
        
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        console.log('[Asaas Webhook] Payload Recebido:', JSON.stringify(body, null, 2));

        const { event, payment } = body;

        if (!event || !payment) {
            console.warn('[Asaas Webhook] Evento ou dados de pagamento ausentes.');
            
            try {
                await supabase.from("debug_logs").insert({
                    operation: "asaas_webhook_invalid_payload",
                    message: "Payload recebido do Asaas é inválido (evento ou dados de pagamento ausentes).",
                    metadata: { body }
                });
            } catch (err) {
                console.error("[Asaas Webhook] Erro ao gravar log de payload inválido:", err.message);
            }
            
            return new Response("Invalid payload", { status: 200 }); // Retorna 200 para evitar reenvio infinito pelo Asaas
        }

        const orderId = payment.externalReference;
        const paymentId = payment.id;
        const status = payment.status;

        console.log(`[Asaas Webhook] Evento: ${event}, Pedido: ${orderId}, Status Asaas: ${status}, Pagamento ID: ${paymentId}`);

        // Registrar recebimento do evento no DB
        try {
            await supabase.from("debug_logs").insert({
                operation: "asaas_webhook_event_received",
                message: `Iniciando processamento do evento '${event}' para o pedido '${orderId}' (Asaas ID: '${paymentId}', Status: '${status}')`,
                metadata: { event, orderId, paymentId, status }
            });
        } catch (err) {
            console.error("[Asaas Webhook] Erro ao gravar log de evento recebido:", err.message);
        }

        if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
            if (!orderId && !paymentId) {
                console.warn(`[Asaas Webhook] Pagamento confirmado, mas sem referências associadas.`);
                return new Response("No orderId or paymentId associated", { status: 200 });
            }

            const safeOrderId = orderId ? String(orderId) : "";

            // Atualizar status do pedido para 'Pago'
            // O filtro .or() agora busca por id do pedido OR id do pedido sem hash OR payment_id do Asaas
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .update({
                    status: "Pago",
                    payment_status: 'paid',
                    payment_id: paymentId,
                    updated_at: new Date().toISOString()
                })
                .or(`id.eq.${safeOrderId},id.eq.#${safeOrderId.replace(/^#/, '')},payment_id.eq.${paymentId}`)
                .select()
                .maybeSingle();

            if (orderError) {
                console.error(`[Asaas Webhook] Erro ao atualizar pedido ${safeOrderId}:`, orderError);
                
                try {
                    await supabase.from("debug_logs").insert({
                        operation: "asaas_webhook_update_db_error",
                        message: `Erro ao atualizar pedido '${safeOrderId}' (Asaas ID: '${paymentId}'): ${orderError.message}`,
                        metadata: { orderError, safeOrderId, paymentId }
                    });
                } catch (logErr) {
                    console.error("[Asaas Webhook] Erro ao gravar log de erro de banco no DB:", logErr.message);
                }
                
                throw orderError;
            }

            if (order) {
                console.log(`[Asaas Webhook] ✅ Pedido ${order.id} atualizado para 'Pago'. Processando comissões...`);
                
                try {
                    await supabase.from("debug_logs").insert({
                        operation: "asaas_webhook_order_paid_success",
                        message: `Pedido '${order.id}' atualizado com sucesso para 'Pago' via Webhook Asaas.`,
                        metadata: { order_id: order.id, payment_id: paymentId }
                    });
                } catch (logErr) {
                    console.error("[Asaas Webhook] Erro ao gravar log de sucesso no DB:", logErr.message);
                }

                // Processar Upgrade e Comissões
                await processAffiliateAndCommissions(order, supabase);

                // Sincronizar com telemedicina (Mais Unidos)
                try {
                    console.log(`[Asaas Webhook] Disparando sincronização de telemedicina para pedido ${order.id}...`);
                    const { data: syncRes, error: syncErr } = await supabase.functions.invoke('telemedicine-sync', {
                        body: { orderId: order.id }
                    });
                    if (syncErr) {
                        console.error(`[Asaas Webhook] Erro no invoke da telemedicina para pedido ${order.id}:`, syncErr);
                    } else {
                        console.log(`[Asaas Webhook] Sincronização concluída com sucesso para pedido ${order.id}:`, syncRes);
                    }
                } catch (err) {
                    console.error(`[Asaas Webhook] Erro ao disparar sincronização da telemedicina para pedido ${order.id}:`, err.message);
                }
            } else {
                console.warn(`[Asaas Webhook] Pedido ${safeOrderId} (Asaas ID: ${paymentId}) não encontrado no banco de dados.`);
                
                try {
                    await supabase.from("debug_logs").insert({
                        operation: "asaas_webhook_order_not_found",
                        message: `Pedido '${safeOrderId}' (Asaas ID: '${paymentId}') não foi encontrado no banco de dados para atualização.`,
                        metadata: { safeOrderId, paymentId }
                    });
                } catch (logErr) {
                    console.error("[Asaas Webhook] Erro ao gravar log de pedido não encontrado no DB:", logErr.message);
                }
            }
        } else if (event === "PAYMENT_OVERDUE") {
            if (!orderId && !paymentId) {
                console.warn(`[Asaas Webhook] Pagamento atrasado, mas sem referências.`);
                return new Response("No orderId or paymentId associated", { status: 200 });
            }

            const safeOrderId = orderId ? String(orderId) : "";
            const dueDate = payment.dueDate;

            console.log(`[Asaas Webhook] Registrando atraso para Pedido: ${safeOrderId} (Asaas ID: ${paymentId}), Vencimento: ${dueDate}`);

            // Atualizar o pedido no banco
            const { error: orderError } = await supabase
                .from("orders")
                .update({
                    payment_status: 'overdue',
                    payment_due_date: dueDate ? `${dueDate}T23:59:59Z` : new Date().toISOString(),
                    last_overdue_at: new Date().toISOString()
                })
                .or(`id.eq.${safeOrderId},id.eq.#${safeOrderId.replace(/^#/, '')},payment_id.eq.${paymentId}`);

            if (orderError) {
                console.error(`[Asaas Webhook] Erro ao atualizar atraso no pedido ${safeOrderId}:`, orderError);
                throw orderError;
            }

            try {
                await supabase.from("debug_logs").insert({
                    operation: "asaas_webhook_order_overdue",
                    message: `Pedido em atraso registrado via Webhook Asaas. ID: '${safeOrderId}' (Asaas ID: '${paymentId}').`,
                    metadata: { safeOrderId, paymentId, dueDate }
                });
            } catch (logErr) {
                console.error("[Asaas Webhook] Erro ao gravar log de atraso no DB:", logErr.message);
            }

        } else if (event === "PAYMENT_DELETED") {
            if (orderId || paymentId) {
                const safeOrderId = orderId ? String(orderId) : "";
                console.log(`[Asaas Webhook] Registrando cancelamento de cobrança para Pedido: ${safeOrderId} (Asaas ID: ${paymentId})`);

                // Atualizar o pedido para 'Cancelado'
                await supabase
                    .from("orders")
                    .update({
                        status: "Cancelado",
                        payment_status: 'deleted',
                        updated_at: new Date().toISOString()
                    })
                    .or(`id.eq.${safeOrderId},id.eq.#${safeOrderId.replace(/^#/, '')},payment_id.eq.${paymentId}`);

                try {
                    await supabase.from("debug_logs").insert({
                        operation: "asaas_webhook_order_cancelled",
                        message: `Pedido cancelado/deletado via Webhook Asaas. ID: '${safeOrderId}' (Asaas ID: '${paymentId}').`,
                        metadata: { safeOrderId, paymentId }
                    });
                } catch (logErr) {
                    console.error("[Asaas Webhook] Erro ao gravar log de cancelamento no DB:", logErr.message);
                }
            }
        } else {
            console.log(`[Asaas Webhook] Evento ${event} ignorado.`);
        }

        return new Response("Webhook processed successfully", { status: 200 });
    } catch (error) {
        console.error("[Asaas Webhook Error]:", error.message);
        
        try {
            await supabase.from("debug_logs").insert({
                operation: "asaas_webhook_process_error",
                message: `Erro geral no processamento do Asaas Webhook: ${error.message}`,
                metadata: { error: error.message, stack: error.stack }
            });
        } catch (logErr) {
            console.error("[Asaas Webhook] Erro ao gravar log de erro geral no DB:", logErr.message);
        }
        
        return new Response(error.message, { status: 400 });
    }
});
