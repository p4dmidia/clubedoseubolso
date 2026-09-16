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

function formatPhone(phone: string): string {
    let clean = phone.replace(/\D/g, "");
    if ((clean.length === 10 || clean.length === 11) && !clean.startsWith("55")) {
        clean = `55${clean}`;
    }
    return clean;
}

async function dispatchZApiText(phone: string, message: string) {
    const cleanPhone = formatPhone(phone);
    const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;

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
    let data;
    try {
        data = JSON.parse(respText);
    } catch {
        data = { raw: respText };
    }

    return { status: response.status, data };
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { type, phone, name } = body;

        if (!phone) {
            return new Response(JSON.stringify({ error: true, message: "Telefone não informado." }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const firstName = (name || "Amigo").trim().split(" ")[0];
        let message = "";

        switch (type) {
            case "affiliate_welcome": {
                const referralCode = body.referralCode || body.login || "";
                const refLink = referralCode 
                    ? `https://www.clubedoseubolso.com.br/?ref=${referralCode}`
                    : `https://www.clubedoseubolso.com.br`;
                const panelLink = `https://www.clubedoseubolso.com.br/affiliate`;

                message = (
                    `🚀 *BEM-VINDO AO CLUBE DO SEU BOLSO!* 🏆\n\n` +
                    `Olá, *${firstName}*! Parabéns por se juntar a nós! Sua conta de Afiliado já está ativa e seu Escritório Virtual está liberado.\n\n` +
                    `🔗 *Seu link exclusivo para divulgar e ganhar comissões:*\n` +
                    `👉 ${refLink}\n\n` +
                    `⚠️ *PASSO OBRIGATÓRIO PARA RECEBER SUAS COMISSÕES:*\n` +
                    `Para que suas comissões possam ser transferidas diretamente para você via Pix, configure sua chave/Wallet Asaas no seu painel:\n` +
                    `👉 ${panelLink}\n\n` +
                    `Boas vendas e conte conosco nessa jornada de crescimento! 💼✨`
                );
                break;
            }

            case "affiliate_commission": {
                const amount = Number(body.amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const clientName = (body.clientName || "Seu indicado").trim().split(" ")[0];
                const shortOrderId = (body.orderId || "").split("-").slice(0, 2).join("-");

                message = (
                    `💰 *PIX NA CONTA! NOVA COMISSÃO!* 🚀\n\n` +
                    `Olá, *${firstName}*!\n\n` +
                    `Você acabou de receber uma comissão de *R$ ${amount}* pela compra realizada pelo seu indicado (*${clientName}*)!\n\n` +
                    `📦 *Resumo:*\n` +
                    `• Pedido: ${shortOrderId || "Confirmado"}\n` +
                    `• Status: Pago e Confirmado ✅\n\n` +
                    `Acesse seu escritório virtual para ver seu extrato e saldo atualizado:\n` +
                    `👉 https://www.clubedoseubolso.com.br/affiliate`
                );
                break;
            }

            case "telemedicine_access": {
                const rawCpf = (body.cpf || "").replace(/\D/g, "");
                const formattedCpf = rawCpf.length === 11 
                    ? `${rawCpf.substring(0, 3)}.${rawCpf.substring(3, 6)}.${rawCpf.substring(6, 9)}-${rawCpf.substring(9)}`
                    : (body.cpf || "cadastrado");

                message = (
                    `🏥 *SUA TELEMEDICINA MAIS UNIDOS ESTÁ ATIVA!* 🎉\n\n` +
                    `Olá, *${firstName}*! Seus dados foram validados e seu acesso à plataforma médica Mais Unidos foi liberado com sucesso!\n\n` +
                    `📱 *Como acessar e instalar o aplicativo no seu celular:*\n` +
                    `1. Acesse o portal pelo seu celular:\n` +
                    `👉 https://app.maisunidos.com.br/Conta/Entrar\n` +
                    `2. Entre com seu *CPF* (${formattedCpf}) e a senha que você cadastrou;\n` +
                    `3. No topo do site, toque no botão *"INSTALAR APP"* e depois em *"Instalar"* para adicionar o ícone do aplicativo direto na tela inicial do seu celular! 📲\n\n` +
                    `Agora você e sua família contam com médicos 24 horas por dia na palma da mão! 🩺✨\n` +
                    `Qualquer dúvida, estamos à disposição por aqui.`
                );
                break;
            }

            case "new_lead": {
                const leadName = (body.leadName || "Novo usuário").trim();

                message = (
                    `👥 *NOVO INDICADO NA SUA REDE!* 🚀\n\n` +
                    `Olá, *${firstName}*!\n\n` +
                    `*${leadName}* acabou de se cadastrar no Clube do Seu Bolso através do seu link de indicação!\n\n` +
                    `Acompanhe o crescimento da sua rede pelo painel:\n` +
                    `👉 https://www.clubedoseubolso.com.br/affiliate`
                );
                break;
            }

            case "custom":
            default: {
                message = body.message || "";
                break;
            }
        }

        if (!message) {
            return new Response(JSON.stringify({ error: true, message: "Mensagem vazia ou tipo não suportado." }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const result = await dispatchZApiText(phone, message);

        try {
            await supabase.from("debug_logs").insert({
                operation: `whatsapp_${type || "custom"}_sent`,
                message: `Notificação WhatsApp (${type}) enviada para ${phone} (${firstName})`,
                metadata: {
                    type,
                    phone: formatPhone(phone),
                    status_code: result.status,
                    response: result.data
                }
            });
        } catch (dbErr) {
            console.error("[send-whatsapp] Erro ao gravar log no DB:", dbErr.message);
        }

        return new Response(JSON.stringify({ success: true, result }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err) {
        console.error("[send-whatsapp] Erro geral:", err.message);
        return new Response(JSON.stringify({ error: true, message: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
