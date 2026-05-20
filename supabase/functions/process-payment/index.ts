import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json();
        console.log('Incoming Request:', JSON.stringify(body, null, 2));

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Identificar Campos de ambos os sistemas
        // Classe A usa: orderId, paymentMethod, customerCpf
        // Bela Sousa usa: items, user_info, total_amount, organization_id, referral_code, payment_method_id
        
        const { 
            orderId, 
            paymentMethod, 
            customerCpf,
            items, 
            user_info, 
            total_amount, 
            organization_id, 
            affiliate_id, 
            referral_code, 
            payment_method_id,
            origin // Opcional: para back_urls
        } = body;

        let finalOrder = null;

        // --- MODO A: REGISTRO DE PEDIDO (Bela Sousa / Fluxo Legado) ---
        if (!orderId && items) {
            console.log('[Mode A] Registering new order for Bela Sousa...');
            
            // 1. Resolver afiliado
            let resolved_affiliate_id = null;
            const targetSource = referral_code || affiliate_id;
            
            if (targetSource) {
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetSource);
                let query = supabase.from('user_profiles').select('id');
                
                if (isUUID) {
                    query = query.or(`id.eq.${targetSource},email.ilike.${targetSource},login.eq.${targetSource}`);
                } else {
                    const sanitizedCpf = (typeof targetSource === 'string') ? targetSource.replace(/\D/g, '') : '';
                    query = query.or(`email.ilike.${targetSource},login.eq.${targetSource},cpf.eq.${targetSource},cpf.eq.${sanitizedCpf}`);
                }

                const { data: affData } = await query
                    .eq('organization_id', organization_id)
                    .maybeSingle();

                if (affData) {
                    resolved_affiliate_id = affData.id;
                }
            }

            // 2. Calcular comissão
            let commission_amount = 0;
            let recipient_id = null;

            if (resolved_affiliate_id) {
                const { data: buyerProfile } = await supabase
                    .from('user_profiles')
                    .select('referrer_id, sponsor_id')
                    .eq('id', resolved_affiliate_id)
                    .maybeSingle();
                
                recipient_id = buyerProfile?.referrer_id || buyerProfile?.sponsor_id;

                if (items && items.length > 0 && recipient_id) {
                    const { data: configData } = await supabase
                        .from('site_configs')
                        .select('*')
                        .eq('organization_id', organization_id)
                        .maybeSingle();

                    let rateOrValue = 10;
                    let isFixed = false;

                    if (configData) {
                        isFixed = configData.commission_type === 'fixed';
                        if (Array.isArray(configData.level_commissions) && configData.level_commissions.length > 0) {
                            rateOrValue = parseFloat(configData.level_commissions[0]) || 0;
                        }
                    }
                    
                    commission_amount = isFixed ? rateOrValue : (total_amount || 0) * (rateOrValue / 100);
                    if (isNaN(commission_amount)) commission_amount = 0;
                }
            }

            // 3. Inserir Pedido
            const order_ref = `WA_${Date.now().toString().slice(-6)}`;
            const insertData = {
                organization_id: organization_id,
                customer_name: user_info?.name || 'Cliente',
                customer_email: (user_info?.email && user_info.email !== '-') ? user_info.email : null,
                whatsapp: (user_info?.whatsapp && user_info.whatsapp !== '-') ? user_info.whatsapp : null,
                total_amount: total_amount || 0,
                items: items, 
                status: 'pending',
                payment_id: order_ref,
                payment_method: payment_method_id || 'whatsapp',
                affiliate_id: resolved_affiliate_id,
                referrer_id: recipient_id,
                commission_amount: commission_amount
            };

            const { data: orderData, error: dbError } = await supabase.from('orders').insert(insertData).select();
            if (dbError) throw new Error(`Erro ao salvar pedido: ${dbError.message}`);
            if (!orderData || orderData.length === 0) throw new Error("Erro ao confirmar registro do pedido.");

            finalOrder = orderData[0];

            // Se for WhatsApp, encerra aqui com sucesso
            if (insertData.payment_method === 'whatsapp') {
                return new Response(JSON.stringify({ success: true, order: finalOrder, message: 'Pedido registrado.' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // --- MODO B: PROCESSAMENTO DE PAGAMENTO (Classe A / Novos Métodos) ---
        const targetOrderId = orderId || finalOrder?.id || finalOrder?.payment_id;
        const targetPaymentMethod = paymentMethod || payment_method_id || finalOrder?.payment_method;

        if (targetOrderId && targetPaymentMethod !== 'whatsapp') {
            console.log(`[Mode B] Processing Payment for: ${targetOrderId} via ${targetPaymentMethod}`);
            
            // Tratamento seguro do ID para evitar erro .replace() se for undefined
            const safeId = String(targetOrderId);

            // 1. Buscar detalhes do pedido
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .select("*, order_items(*)")
                .or(`id.eq.${safeId},id.eq.#${safeId.replace(/^#/, "")},payment_id.eq.${safeId}`)
                .single();

            if (orderError || !order) throw new Error(`Pedido ${safeId} não encontrado.`);

            // 2. Buscar credenciais
            const { data: org } = await supabase.from("organizations").select("*").eq("id", order.organization_id).single();
            const accessToken = org?.mercadopago_access_token || (org?.mercadopago_config as any)?.access_token;

            if (!accessToken) throw new Error("Configuração do Mercado Pago não encontrada para esta organização.");

            if (targetPaymentMethod === "pix") {
                // --- Lógica PIX ---
                const cleanDoc = (customerCpf || order.customer_cpf || "").replace(/\D/g, "");
                const docType = cleanDoc.length === 11 ? "CPF" : cleanDoc.length === 14 ? "CNPJ" : null;

                if (!docType) throw new Error("Documento (CPF/CNPJ) inválido para pagamento PIX.");

                const paymentData = {
                    transaction_amount: Number(order.total_amount),
                    description: `Pedido ${order.id} - ${org?.name || "Loja"}`,
                    payment_method_id: "pix",
                    installments: 1,
                    payer: {
                        email: order.customer_email || "cliente@mercado.com",
                        first_name: order.customer_name?.split(" ")[0] || "Cliente",
                        last_name: order.customer_name?.split(" ").slice(1).join(" ") || "Sistema",
                        identification: { type: docType, number: cleanDoc }
                    },
                    external_reference: order.id,
                    notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook?org_id=${order.organization_id}`,
                };

                const response = await fetch("https://api.mercadopago.com/v1/payments", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                        "X-Idempotency-Key": `pix-${order.id}-${Date.now()}`
                    },
                    body: JSON.stringify(paymentData),
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || "Erro no Mercado Pago (PIX)");

                const transactionData = result.point_of_interaction?.transaction_data;
                
                await supabase.from("orders").update({ 
                    payment_id: result.id.toString(),
                    pix_qr_code: transactionData?.qr_code,
                    pix_qr_code_base64: transactionData?.qr_code_base64,
                    pix_copy_paste: transactionData?.qr_code,
                    status: 'Pendente'
                }).eq("id", order.id);

                return new Response(JSON.stringify({
                    success: true,
                    qr_code: transactionData?.qr_code,
                    qr_code_base64: transactionData?.qr_code_base64,
                    copy_paste: transactionData?.qr_code,
                    payment_id: result.id,
                    ticket_url: transactionData?.ticket_url
                }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

            } else {
                // --- Lógica Checkout Pro (Cartão e outros) ---
                const items = order.order_items?.length > 0 
                    ? order.order_items.map((item: any) => ({
                        title: item.product_name,
                        quantity: item.quantity,
                        unit_price: Number(item.unit_price),
                        currency_id: "BRL",
                      }))
                    : [{
                        title: `Pedido ${order.id}`,
                        quantity: 1,
                        unit_price: Number(order.total_amount),
                        currency_id: "BRL",
                      }];

                // Adicionar Frete se houver
                if (order.shipping_cost && Number(order.shipping_cost) > 0) {
                    items.push({
                        title: "Frete",
                        quantity: 1,
                        unit_price: Number(order.shipping_cost),
                        currency_id: "BRL",
                    });
                }

                const preferenceData = {
                    items,
                    payer: { email: order.customer_email || "cliente@mercado.com" },
                    external_reference: order.id,
                    back_urls: {
                        success: `${origin || "https://classea.vercel.app"}/checkout/success`,
                        failure: `${origin || "https://classea.vercel.app"}/checkout`,
                        pending: `${origin || "https://classea.vercel.app"}/checkout`,
                    },
                    auto_return: "approved",
                    notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook?org_id=${order.organization_id}`,
                };

                const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
                    body: JSON.stringify(preferenceData),
                });

                const result = await response.json();
                if (!result.id) throw new Error(result.message || "Erro ao criar preferência MP");

                await supabase.from("orders").update({ payment_preference_id: result.id }).eq("id", order.id);

                return new Response(JSON.stringify({ success: true, id: result.id, init_point: result.init_point }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        throw new Error("Dados insuficientes para processar o pedido.");

    } catch (error) {
        console.error("Payment Error:", error.message);
        return new Response(JSON.stringify({ 
            error: true,
            message: error.message,
            details: "Verifique se todos os dados do pedido e o documento (CPF/CNPJ) estão corretos."
        }), {
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
