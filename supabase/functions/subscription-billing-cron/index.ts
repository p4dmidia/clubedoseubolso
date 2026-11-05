import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID") ?? "3F9362BF22FA72B42ECBBE7DD852ABAB";
const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN") ?? "38CBE288FE1233E6885D646B";
const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? "Ffd792d37c5674e08bff13e0a6e568cf9S";

async function sendWhatsApp(phone: string, message: string, orderId: string, operation: string) {
    if (!phone) return;
    try {
        let cleanPhone = phone.replace(/\D/g, "");
        if ((cleanPhone.length === 10 || cleanPhone.length === 11) && !cleanPhone.startsWith("55")) {
            cleanPhone = `55${cleanPhone}`;
        }

        const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
        const response = await fetch(zapiUrl, {
            method: "POST",
            headers: {
                "Client-Token": ZAPI_CLIENT_TOKEN,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ phone: cleanPhone, message: message })
        });

        const respText = await response.text();
        console.log(`[Z-API Cron] Resposta WhatsApp (${response.status}):`, respText);

        await supabase.from("debug_logs").insert({
            operation: operation,
            message: `WhatsApp de régua disparado para ${cleanPhone} (Pedido: ${orderId})`,
            metadata: { order_id: orderId, phone: cleanPhone, status: response.status, response: respText }
        });
    } catch (err: any) {
        console.error(`[Z-API Cron] Erro ao enviar WhatsApp:`, err.message);
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log("[Subscription Billing Cron] Iniciando verificação diária de cobranças e bloqueios...");

        // Buscar token Asaas da organização
        const { data: orgs, error: orgErr } = await supabase
            .from("organizations")
            .select("asaas_access_token, asaas_environment")
            .eq("id", "5111af72-27a5-41fd-8ed9-8c51b78b4fdd")
            .limit(1);

        if (orgErr || !orgs || orgs.length === 0) {
            throw new Error("Organização ou token do Asaas não encontrados.");
        }

        const asaasToken = orgs[0].asaas_access_token;
        const asaasEnv = orgs[0].asaas_environment;
        const baseUrl = asaasEnv === "production" ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3";

        // Buscar pagamentos pendentes e vencidos no Asaas
        const paymentsResp = await fetch(`${baseUrl}/payments?status=PENDING,OVERDUE&limit=100`, {
            headers: { "access_token": asaasToken }
        });

        if (!paymentsResp.ok) {
            throw new Error(`Erro ao consultar pagamentos no Asaas: ${await paymentsResp.text()}`);
        }

        const paymentsData = await paymentsResp.json();
        const paymentsList = paymentsData.data || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const results = {
            totalChecked: paymentsList.length,
            dMinus5Sent: 0,
            dZeroSent: 0,
            preBlockAlertSent: 0,
            autoBlocked: 0
        };

        for (const p of paymentsList) {
            const dueDateStr = p.dueDate;
            if (!dueDateStr) continue;

            const [year, month, day] = dueDateStr.split("-").map(Number);
            const dueDate = new Date(year, month - 1, day);
            dueDate.setHours(0, 0, 0, 0);

            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // > 0: futuro, < 0: passado (atraso)

            const externalRef = p.externalReference || "";
            const baseOrderId = externalRef.replace(/-M\d+$/i, "").trim().replace(/^#/, "");

            // Buscar pedido no banco de dados
            const { data: order } = await supabase
                .from("orders")
                .select("*")
                .or(`id.eq.${baseOrderId},id.eq.#${baseOrderId},payment_id.eq.${p.id}`)
                .maybeSingle();

            if (!order) continue;

            const customerName = (order.customer_name || p.customerName || "Cliente").trim().split(" ")[0];
            const invoiceUrl = p.invoiceUrl || order.payment_preference_id || `https://www.asaas.com/i/${p.id}`;
            const customerPhone = order.customer_phone || p.mobilePhone || "";

            // 1. D-5: 5 dias antes do vencimento
            if (diffDays === 5) {
                const msg = `Olá, *${customerName}*! Tudo bem? 😊\n\nPassando para lembrar que a mensalidade do seu plano no *Clube do Seu Bolso* vence em *5 dias* (${dueDate.toLocaleDateString('pt-BR')}).\n\nPara facilitar o pagamento e manter suas consultas médicas ativas, acesse o link abaixo:\n👉 ${invoiceUrl}\n\nVocê pode pagar via Pix ou Boleto. Qualquer dúvida, conte conosco!`;
                await sendWhatsApp(customerPhone, msg, order.id, "cron_reminder_d_minus_5");
                results.dMinus5Sent++;
            }

            // 2. D-0: No dia do vencimento
            if (diffDays === 0) {
                const msg = `Olá, *${customerName}*! 🔔\n\nA sua mensalidade do *Clube do Seu Bolso* vence *hoje* (${dueDate.toLocaleDateString('pt-BR')}).\n\nGaranta a continuidade do seu acesso à telemedicina 24h sem interrupções:\n👉 ${invoiceUrl}\n\nO pagamento via Pix compensa na hora!`;
                await sendWhatsApp(customerPhone, msg, order.id, "cron_reminder_d_zero");
                results.dZeroSent++;
            }

            // 3. D+2 ou D+3: Alerta pré-bloqueio (2 a 3 dias de atraso)
            if (diffDays === -2 || diffDays === -3) {
                const msg = `⚠️ *Aviso Importante: Mensalidade em Aberto*\n\nOlá, *${customerName}*, identificamos que a mensalidade do seu plano no *Clube do Seu Bolso* venceu em ${dueDate.toLocaleDateString('pt-BR')} e ainda não foi compensada.\n\nEvite a suspensão do seu plano e bloqueio das consultas de telemedicina regularizando sua fatura:\n👉 ${invoiceUrl}\n\nApós 5 dias de atraso o acesso médico é revogado automaticamente pelo sistema.`;
                await sendWhatsApp(customerPhone, msg, order.id, "cron_alert_pre_block");
                results.preBlockAlertSent++;
            }

            // 4. D+5 ou mais: Bloqueio automático após 5 dias de atraso
            if (diffDays <= -5 && order.status !== "Cancelado") {
                console.log(`[Subscription Billing Cron] 🚫 Bloqueando cliente ${order.customer_name} por atraso de ${Math.abs(diffDays)} dias...`);

                // Atualizar no banco para Cancelado/Suspenso
                await supabase
                    .from("orders")
                    .update({
                        status: "Cancelado",
                        payment_status: "overdue",
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", order.id);

                // Revogar na Mais Unidos (IsActive: false)
                try {
                    await supabase.functions.invoke("telemedicine-sync", {
                        body: { orderId: order.id }
                    });
                } catch (syncErr: any) {
                    console.error(`[Subscription Billing Cron] Erro ao revogar telemedicina para ${order.id}:`, syncErr.message);
                }

                // Enviar WhatsApp de notificação de suspensão
                const msg = `❌ *Acesso à Telemedicina Suspenso*\n\nOlá, *${customerName}*, informamos que o seu acesso médico na plataforma foi suspenso devido ao atraso superior a 5 dias no pagamento da sua mensalidade.\n\nPara reativar seu plano e consultas imediatamente, realize o pagamento pelo link seguro:\n👉 ${invoiceUrl}\n\nAssim que o pagamento for identificado, seu acesso será reativado de forma 100% automática!`;
                await sendWhatsApp(customerPhone, msg, order.id, "cron_auto_block_executed");

                results.autoBlocked++;
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err: any) {
        console.error("[Subscription Billing Cron] Erro na execução:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});

