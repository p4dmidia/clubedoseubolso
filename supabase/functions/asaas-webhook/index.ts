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

    try {
        const body = await req.json();
        console.log('[Asaas Webhook] Payload Recebido:', JSON.stringify(body, null, 2));

        const { event, payment } = body;

        if (!event || !payment) {
            console.warn('[Asaas Webhook] Evento ou dados de pagamento ausentes.');
            return new Response("Invalid payload", { status: 200 }); // Retorna 200 para evitar que o Asaas reenvie infinitamente
        }

        const orderId = payment.externalReference;
        const paymentId = payment.id;
        const status = payment.status;

        console.log(`[Asaas Webhook] Evento: ${event}, Pedido: ${orderId}, Status Asaas: ${status}, Pagamento ID: ${paymentId}`);

        if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
            if (!orderId) {
                console.warn(`[Asaas Webhook] Pagamento ${paymentId} confirmado, mas sem externalReference (orderId).`);
                return new Response("No orderId associated", { status: 200 });
            }

            // Tratamento seguro do ID do pedido
            const safeOrderId = String(orderId);

            // Atualizar status do pedido para 'Pago'
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .update({
                    status: "Pago",
                    payment_status: 'paid',
                    payment_id: paymentId,
                    updated_at: new Date().toISOString()
                })
                .or(`id.eq.${safeOrderId},id.eq.#${safeOrderId.replace(/^#/, '')}`)
                .select()
                .maybeSingle();

            if (orderError) {
                console.error(`[Asaas Webhook] Erro ao atualizar pedido ${safeOrderId}:`, orderError);
                throw orderError;
            }

            if (order) {
                console.log(`[Asaas Webhook] ✅ Pedido ${safeOrderId} atualizado para 'Pago'. Processando comissões...`);
                // Processar Upgrade e Comissões
                await processAffiliateAndCommissions(order, supabase);
            } else {
                console.warn(`[Asaas Webhook] Pedido ${safeOrderId} não encontrado no banco de dados.`);
            }
        } else {
            console.log(`[Asaas Webhook] Evento ${event} ignorado.`);
        }

        return new Response("Webhook processed successfully", { status: 200 });
    } catch (error) {
        console.error("[Asaas Webhook Error]:", error.message);
        return new Response(error.message, { status: 400 });
    }
});
