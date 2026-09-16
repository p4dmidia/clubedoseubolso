import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendApiKey = Deno.env.get("RESEND_API_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function sendConfirmationEmail(order: any) {
  if (!resendApiKey) {
    console.error("[Email] RESEND_API_KEY não configurada nas Secrets do Supabase.");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Classe A <onboarding@resend.dev>", // Usar o domínio padrão caso o real não esteja verificado
        to: [order.customer_email],
        subject: `Pagamento Confirmado! 🚀 - Pedido ${order.id}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
            <div style="background-color: #0B1221; padding: 40px; text-align: center;">
              <h1 style="color: #FBC02D; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Pagamento Confirmado</h1>
            </div>
            <div style="padding: 40px; color: #333; line-height: 1.6;">
              <p>Olá, <strong>${order.customer_name}</strong>!</p>
              <p>Boas notícias! Recebemos a confirmação do seu pagamento para o pedido <strong>${order.id}</strong>.</p>
              
              <div style="background-color: #f8f9fa; border-radius: 15px; padding: 20px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Valor Total:</strong> R$ ${Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p style="margin: 5px 0;"><strong>Método:</strong> ${order.payment_method}</p>
              </div>

              <p>Nossa equipe já está preparando tudo com o padrão de excelência Classe A. Você receberá novas atualizações assim que seu pedido for postado.</p>
              
              <div style="text-align: center; margin-top: 40px;">
                <p style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Classe A Premium Lifestyle</p>
              </div>
            </div>
          </div>
        `
      }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        console.error("[Email] Erro ao disparar email via Resend:", errorData);
    } else {
        console.log(`[Email] Confirmação enviada com sucesso para ${order.customer_email}`);
    }
  } catch (err) {
    console.error("[Email] Erro catastrófico no envio:", err);
  }
}

const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID") ?? "3F9362BF22FA72B42ECBBE7DD852ABAB";
const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN") ?? "38CBE288FE1233E6885D646B";
const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? "Ffd792d37c5674e08bff13e0a6e568cf9S";

async function sendWhatsAppNotification(order: any, isTelemedicinePending: boolean) {
    if (!order || !order.customer_phone) return;

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

        await fetch(zapiUrl, {
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
    } catch (err) {
        console.error("[Z-API] Erro no envio do WhatsApp:", err.message);
    }
}

async function sendAffiliateCommissionWhatsApp(order: any, supabaseClient: any) {
    if (!order) return;

    try {
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

        if (affiliateEarnings.length === 0 && order.split_details && Array.isArray(order.split_details)) {
            for (const item of order.split_details) {
                if (item.user_id && Number(item.amount) > 0) {
                    affiliateEarnings.push({ userId: item.user_id, amount: Number(item.amount) });
                }
            }
        }

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
    try {
        const url = new URL(req.url);
        const topic = url.searchParams.get("topic") || url.searchParams.get("type");
        const id = url.searchParams.get("id") || url.searchParams.get("data.id");

        console.log(`[Webhook] Recebida notificação: topic=${topic}, id=${id}`);

        if (!id) {
            return new Response("No ID provided", { status: 200 });
        }

        const orgId = url.searchParams.get("org_id");
        if (!orgId) {
            console.error("[Webhook] org_id não fornecido na URL.");
            return new Response("org_id missing", { status: 400 });
        }

        const { data: org, error: orgError } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", orgId)
            .single();

        const accessToken = org?.mercadopago_access_token || (org?.mercadopago_config as any)?.access_token;

        if (orgError || !accessToken) {
            return new Response("Organization token not found", { status: 404 });
        }

        if (topic === "payment") {
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) {
                return new Response("Error fetching payment", { status: 200 });
            }

            const payment = await response.json();
            const orderId = payment.external_reference;
            const status = payment.status;

            console.log(`[Webhook] Pedido: ${orderId}, Status MP: ${status}`);

            if (orderId && (status === "approved" || status === "authorized")) {
                const { data: order, error: orderError } = await supabase
                    .from("orders")
                    .update({
                        status: "Pago",
                        payment_status: 'paid',
                        payment_id: payment.id.toString(),
                        payment_status_detail: payment.status_detail,
                        updated_at: new Date().toISOString()
                    })
                    .or(`id.eq.${orderId},id.eq.#${orderId.replace(/^#/, '')}`)
                    .select()
                    .maybeSingle();

                if (orderError) throw orderError;

                if (order) {
                    console.log(`[Webhook] ✅ Pedido ${orderId} atualizado com sucesso para 'Pago'.`);
                    
                    // Processar Upgrade e Comissões
                    await processAffiliateAndCommissions(order, supabase);
                    
                    // Sincronizar com telemedicina (Mais Unidos)
                    let isTelemedicinePending = false;
                    try {
                        console.log(`[Webhook] Disparando sincronização de telemedicina para pedido ${orderId}...`);
                        const { data: syncRes, error: syncErr } = await supabase.functions.invoke('telemedicine-sync', {
                            body: { orderId: orderId }
                        });
                        if (syncErr) {
                            console.error(`[Webhook] Erro no invoke da telemedicina para pedido ${orderId}:`, syncErr);
                        } else {
                            console.log(`[Webhook] Sincronização concluída com sucesso para pedido ${orderId}:`, syncRes);
                            if (syncRes?.pending_registration) {
                                isTelemedicinePending = true;
                            }
                        }
                    } catch (err) {
                        console.error(`[Webhook] Erro ao disparar sincronização da telemedicina para pedido ${orderId}:`, err.message);
                    }

                    // Disparar WhatsApp via Z-API (Cliente)
                    await sendWhatsAppNotification(order, isTelemedicinePending);

                    // Disparar notificação de comissão no WhatsApp via Z-API (Afiliado / Patrocinador)
                    await sendAffiliateCommissionWhatsApp(order, supabase);
                    
                    // E-mail desativado a pedido do usuário (Mercado Pago faz isso nativamente)
                    // await sendConfirmationEmail(order);
                }
            } else {
                console.log(`[Webhook] ℹ️ Notificação ignorada: Pedido ${orderId}, Status: ${status}. Aguardando status 'approved'.`);
            }
        }

        return new Response("Webhook received", { status: 200 });
    } catch (error) {
        console.error("[Webhook Error]:", error.message);
        return new Response(error.message, { status: 400 });
    }
});
