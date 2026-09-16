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

       if (order.customer_phone) {
           const firstName = (order.customer_name || "Parceiro").trim().split(" ")[0];
           const referralCode = order.customer_email ? order.customer_email.split("@")[0].replace(/[^a-z0-9]/gi, '') : "";
           const refLink = `https://www.clubedoseubolso.com.br/?ref=${referralCode}`;
           const panelLink = `https://www.clubedoseubolso.com.br/affiliate`;
           const welcomeMsg = `🚀 *BEM-VINDO AO CLUBE DO SEU BOLSO!* 🏆\n\nOlá, *${firstName}*! Parabéns por se juntar a nós! Sua conta de Afiliado já está ativa e seu Escritório Virtual está liberado.\n\n🔗 *Seu link exclusivo para divulgar e ganhar comissões:*\n👉 ${refLink}\n\n⚠️ *PASSO OBRIGATÓRIO PARA RECEBER SUAS COMISSÕES:*\nPara que suas comissões possam ser transferidas diretamente para você via Pix, configure sua chave/Wallet Asaas no seu painel:\n👉 ${panelLink}\n\nBoas vendas e conte conosco nessa jornada de crescimento! 💼✨`;
           
           let cleanPhone = order.customer_phone.replace(/\D/g, "");
           if ((cleanPhone.length === 10 || cleanPhone.length === 11) && !cleanPhone.startsWith("55")) {
               cleanPhone = `55${cleanPhone}`;
           }
           const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
           fetch(zapiUrl, {
               method: "POST",
               headers: { "Client-Token": ZAPI_CLIENT_TOKEN, "Content-Type": "application/json" },
               body: JSON.stringify({ phone: cleanPhone, message: welcomeMsg })
           }).catch(e => console.warn("[Z-API] Erro ao enviar boas-vindas do upgrade:", e));
       }
    }
}

const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID") ?? "3F9362BF22FA72B42ECBBE7DD852ABAB";
const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN") ?? "38CBE288FE1233E6885D646B";
const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? "Ffd792d37c5674e08bff13e0a6e568cf9S";

async function sendWhatsAppNotification(order: any, isTelemedicinePending: boolean) {
    if (!order || !order.customer_phone) {
        console.log("[Z-API] Telefone do cliente não encontrado. Ignorando WhatsApp.");
        return;
    }

    try {
        let cleanPhone = order.customer_phone.replace(/\D/g, "");
        if (!cleanPhone) return;

        if ((cleanPhone.length === 10 || cleanPhone.length === 11) && !cleanPhone.startsWith("55")) {
            cleanPhone = `55${cleanPhone}`;
        }

        const firstName = (order.customer_name || "Cliente").trim().split(" ")[0];
        const successUrl = `https://www.clubedoseubolso.com.br/checkout/success?order_id=${encodeURIComponent(order.id)}`;

        let message = "";
        if (isTelemedicinePending) {
            message = `Olá, *${firstName}*! 🎉\n\nConfirmamos o pagamento do seu plano de *Telemedicina Mais Unidos* no Clube do Seu Bolso com sucesso!\n\nPara concluir seu cadastro de paciente e liberar seu acesso imediato às consultas médicas, clique no link seguro abaixo:\n\n👉 ${successUrl}\n\nO preenchimento leva menos de 1 minuto! Se precisar de ajuda, estamos à disposição.`;
        } else {
            message = `Olá, *${firstName}*! 🎉\n\nConfirmamos o pagamento do seu pedido (*#${order.id}*) no Clube do Seu Bolso com sucesso!\n\nVocê pode acompanhar e gerenciar seu pedido pelo link seguro abaixo:\n\n👉 ${successUrl}\n\nObrigado pela preferência!`;
        }

        const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;

        console.log(`[Z-API] Enviando WhatsApp para ${cleanPhone} (Pedido: ${order.id})...`);

        const response = await fetch(zapiUrl, {
            method: "POST",
            headers: {
                "Client-Token": ZAPI_CLIENT_TOKEN,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                phone: cleanPhone,
                message: message
            })
        });

        const respText = await response.text();
        console.log(`[Z-API] Resposta (${response.status}):`, respText);

        try {
            await supabase.from("debug_logs").insert({
                operation: "whatsapp_notification_sent",
                message: `WhatsApp de confirmação enviado para ${cleanPhone} (Pedido: ${order.id})`,
                metadata: {
                    order_id: order.id,
                    phone: cleanPhone,
                    status_code: response.status,
                    response: respText
                }
            });
        } catch (dbErr) {
            console.error("[Z-API] Erro ao salvar log no DB:", dbErr.message);
        }
    } catch (err) {
        console.error("[Z-API] Erro no envio do WhatsApp:", err.message);
    }
}

async function sendAffiliateCommissionWhatsApp(order: any, supabaseClient: any) {
    if (!order) return;

    try {
        // 1. Tentar buscar comissões geradas na tabela commissions
        const { data: commissions, error: commError } = await supabaseClient
            .from("commissions")
            .select("user_id, amount")
            .eq("order_id", order.id);

        let affiliateEarnings: Array<{ userId: string; amount: number }> = [];

        if (!commError && commissions && commissions.length > 0) {
            for (const c of commissions) {
                if (Number(c.amount) > 0 && c.user_id) {
                    affiliateEarnings.push({ userId: c.user_id, amount: Number(c.amount) });
                }
            }
        }

        // 2. Se não encontrou em commissions, verificar split_details
        if (affiliateEarnings.length === 0 && order.split_details && Array.isArray(order.split_details)) {
            for (const item of order.split_details) {
                if (item.user_id && Number(item.amount) > 0) {
                    affiliateEarnings.push({ userId: item.user_id, amount: Number(item.amount) });
                }
            }
        }

        // 3. Fallback: Se tem referral_code e split_amount
        if (affiliateEarnings.length === 0 && order.referral_code && Number(order.split_amount) > 0) {
            const { data: aff } = await supabaseClient
                .from("affiliates")
                .select("user_id")
                .ilike("referral_code", order.referral_code)
                .maybeSingle();

            if (aff?.user_id) {
                affiliateEarnings.push({ userId: aff.user_id, amount: Number(order.split_amount) });
            }
        }

        if (affiliateEarnings.length === 0) {
            console.log(`[Z-API] Nenhuma comissão de afiliado para notificar no pedido ${order.id}.`);
            return;
        }

        const clientFirstName = (order.customer_name || "Seu indicado").trim().split(" ")[0];
        const shortOrderId = order.id.split("-").slice(0, 2).join("-");

        // 4. Para cada afiliado comissionado, disparar via Z-API
        for (const earning of affiliateEarnings) {
            let affName = "Parceiro";
            let affPhone = "";

            const { data: profile } = await supabaseClient
                .from("user_profiles")
                .select("full_name, whatsapp")
                .eq("id", earning.userId)
                .maybeSingle();

            if (profile?.whatsapp) {
                affPhone = profile.whatsapp;
                affName = profile.full_name || affName;
            } else {
                const { data: affData } = await supabaseClient
                    .from("affiliates")
                    .select("full_name, whatsapp")
                    .eq("user_id", earning.userId)
                    .maybeSingle();

                if (affData?.whatsapp) {
                    affPhone = affData.whatsapp;
                    affName = affData.full_name || affName;
                }
            }

            if (!affPhone) {
                console.log(`[Z-API] Afiliado ${earning.userId} não possui WhatsApp cadastrado.`);
                continue;
            }

            let cleanPhone = affPhone.replace(/\D/g, "");
            if ((cleanPhone.length === 10 || cleanPhone.length === 11) && !cleanPhone.startsWith("55")) {
                cleanPhone = `55${cleanPhone}`;
            }

            const affFirstName = affName.trim().split(" ")[0];
            const formattedAmount = earning.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const message = `💰 *PIX NA CONTA! NOVA COMISSÃO!* 🚀\n\nOlá, *${affFirstName}*!\n\nVocê acabou de receber uma comissão de *R$ ${formattedAmount}* pela compra realizada pelo seu indicado (*${clientFirstName}*)!\n\n📦 *Resumo:*\n• Pedido: ${shortOrderId}\n• Status: Pago e Confirmado ✅\n\nAcesse seu escritório virtual para ver seu extrato e saldo atualizado:\n👉 https://www.clubedoseubolso.com.br/affiliate`;

            const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;

            console.log(`[Z-API] Enviando notificação de comissão para ${cleanPhone} (Afiliado: ${affFirstName}, Valor: R$ ${formattedAmount})...`);

            const resp = await fetch(zapiUrl, {
                method: "POST",
                headers: {
                    "Client-Token": ZAPI_CLIENT_TOKEN,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    phone: cleanPhone,
                    message: message
                })
            });

            const respText = await resp.text();
            console.log(`[Z-API] Resposta comissão (${resp.status}):`, respText);

            try {
                await supabaseClient.from("debug_logs").insert({
                    operation: "whatsapp_commission_notification_sent",
                    message: `Comissão de R$ ${formattedAmount} notificada via WhatsApp para ${cleanPhone} (${affFirstName})`,
                    metadata: {
                        order_id: order.id,
                        affiliate_id: earning.userId,
                        phone: cleanPhone,
                        amount: earning.amount,
                        status_code: resp.status,
                        response: respText
                    }
                });
            } catch (dbErr) {
                console.error("[Z-API] Erro ao gravar log de comissão no DB:", dbErr.message);
            }
        }
    } catch (err) {
        console.error("[Z-API] Erro no envio de notificação de comissão:", err.message);
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

    // Se for uma requisição GET para depuração de logs
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
                let isTelemedicinePending = false;
                try {
                    console.log(`[Asaas Webhook] Disparando sincronização de telemedicina para pedido ${order.id}...`);
                    const { data: syncRes, error: syncErr } = await supabase.functions.invoke('telemedicine-sync', {
                        body: { orderId: order.id }
                    });
                    if (syncErr) {
                        console.error(`[Asaas Webhook] Erro no invoke da telemedicina para pedido ${order.id}:`, syncErr);
                    } else {
                        console.log(`[Asaas Webhook] Sincronização concluída com sucesso para pedido ${order.id}:`, syncRes);
                        if (syncRes?.pending_registration) {
                            isTelemedicinePending = true;
                        }
                    }
                } catch (err) {
                    console.error(`[Asaas Webhook] Erro ao disparar sincronização da telemedicina para pedido ${order.id}:`, err.message);
                }

                // Disparar notificação no WhatsApp via Z-API (Cliente)
                await sendWhatsAppNotification(order, isTelemedicinePending);

                // Disparar notificação de comissão no WhatsApp via Z-API (Afiliado / Patrocinador)
                await sendAffiliateCommissionWhatsApp(order, supabase);
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
                const { data: updatedOrder, error: updateError } = await supabase
                    .from("orders")
                    .update({
                        status: "Cancelado",
                        payment_status: 'deleted',
                        updated_at: new Date().toISOString()
                    })
                    .or(`id.eq.${safeOrderId},id.eq.#${safeOrderId.replace(/^#/, '')},payment_id.eq.${paymentId}`)
                    .select('id')
                    .maybeSingle();

                if (updateError) {
                    console.error(`[Asaas Webhook] Erro ao atualizar pedido para Cancelado:`, updateError);
                }

                if (updatedOrder) {
                    try {
                        console.log(`[Asaas Webhook] Disparando desativação de telemedicina para pedido ${updatedOrder.id}...`);
                        const { data: syncRes, error: syncErr } = await supabase.functions.invoke('telemedicine-sync', {
                            body: { orderId: updatedOrder.id }
                        });
                        if (syncErr) {
                            console.error(`[Asaas Webhook] Erro no invoke da telemedicina para cancelamento do pedido ${updatedOrder.id}:`, syncErr);
                        } else {
                            console.log(`[Asaas Webhook] Desativação concluída com sucesso para pedido ${updatedOrder.id}:`, syncRes);
                        }
                    } catch (err) {
                        console.error(`[Asaas Webhook] Erro ao disparar sincronização da telemedicina para cancelamento do pedido ${updatedOrder.id}:`, err.message);
                    }
                }

                try {
                    await supabase.from("debug_logs").insert({
                        operation: "asaas_webhook_order_cancelled",
                        message: `Pedido cancelado/deletado via Webhook Asaas. ID: '${safeOrderId}' (Asaas ID: '${paymentId}').`,
                        metadata: { safeOrderId, paymentId, resolved_order_id: updatedOrder?.id }
                    });
                } catch (logErr) {
                    console.error("[Asaas Webhook] Erro ao gravar log de cancelamento no DB:", logErr.message);
                }
            }
        } else {
            console.log(`[Asaas Webhook] Evento ${event} ignorado.`);
        }

        // Disparar varredura de inadimplência em segundo plano de forma assíncrona
        (async () => {
            try {
                console.log("[Asaas Webhook] Disparando rotina de inadimplência (process_overdue) em segundo plano...");
                const response = await fetch(`${supabaseUrl}/functions/v1/telemedicine-sync`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${supabaseServiceKey}`
                    },
                    body: JSON.stringify({ action: "process_overdue" })
                });
                console.log("[Asaas Webhook] Resposta process_overdue:", response.status);
            } catch (err) {
                console.error("[Asaas Webhook] Erro ao disparar process_overdue:", err.message);
            }
        })();

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
