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

    let requestBody: any = null;
    try {
        const body = await req.json();
        requestBody = body;
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

            // 2. Buscar credenciais Asaas
            const { data: org } = await supabase.from("organizations").select("*").eq("id", order.organization_id).single();
            const asaasToken = org?.asaas_access_token;
            const asaasEnv = org?.asaas_environment || 'sandbox';

            if (!asaasToken) throw new Error("Configuração do Asaas não encontrada para esta organização.");

            const baseUrl = asaasEnv === 'production' 
                ? 'https://api.asaas.com/v3' 
                : 'https://api-sandbox.asaas.com/v3';

            const cleanCpf = (customerCpf || order.customer_cpf || "").replace(/\D/g, "");
            if (!cleanCpf) throw new Error("CPF/CNPJ do cliente é obrigatório para processar o pagamento.");

            // 1. Procurar cliente existente no Asaas
            console.log(`Buscando cliente por CPF/CNPJ ${cleanCpf} no Asaas...`);
            const customerSearchUrl = `${baseUrl}/customers?cpfCnpj=${cleanCpf}`;
            const searchResponse = await fetch(customerSearchUrl, {
                method: "GET",
                headers: {
                    "access_token": asaasToken,
                    "Content-Type": "application/json",
                    "User-Agent": "ClubeDoSeuBolsoIntegration"
                }
            });

            if (!searchResponse.ok) {
                const errText = await searchResponse.text();
                throw new Error(`Erro ao buscar cliente no Asaas: ${errText}`);
            }

            const searchResult = await searchResponse.json();
            let asaasCustomerId = "";

            if (searchResult.data && searchResult.data.length > 0) {
                asaasCustomerId = searchResult.data[0].id;
                console.log(`Cliente encontrado no Asaas: ${asaasCustomerId}`);
            } else {
                // 2. Se não existir, criar cliente
                console.log("Cliente não encontrado. Criando novo cliente no Asaas...");
                const customerData = {
                    name: order.customer_name || "Cliente",
                    cpfCnpj: cleanCpf,
                    email: order.customer_email || undefined,
                    mobilePhone: order.customer_phone ? order.customer_phone.replace(/\D/g, "") : undefined,
                    externalReference: order.user_id || undefined
                };

                const createResponse = await fetch(`${baseUrl}/customers`, {
                    method: "POST",
                    headers: {
                        "access_token": asaasToken,
                        "Content-Type": "application/json",
                        "User-Agent": "ClubeDoSeuBolsoIntegration"
                    },
                    body: JSON.stringify(customerData)
                });

                if (!createResponse.ok) {
                    const errText = await createResponse.text();
                    throw new Error(`Erro ao criar cliente no Asaas: ${errText}`);
                }

                const createResult = await createResponse.json();
                asaasCustomerId = createResult.id;
                console.log(`Cliente criado no Asaas: ${asaasCustomerId}`);
            }

            // 3. Criar cobrança no Asaas (Checkout Asaas / invoiceUrl)
            console.log(`Criando cobrança de R$ ${order.total_amount} para cliente ${asaasCustomerId}...`);
            
            // Gerar data de vencimento: hoje formatada em YYYY-MM-DD
            const dateSP = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
            const year = dateSP.getFullYear();
            const month = String(dateSP.getMonth() + 1).padStart(2, '0');
            const day = String(dateSP.getDate()).padStart(2, '0');
            const dueDate = `${year}-${month}-${day}`;

            // --- CÁLCULO DE COMISSÃO DIRETA (NÍVEL ÚNICO) ---
            let splitData = null;
            const splitDetails: any[] = [];
            const gdFinanceWalletId = org?.gd_finance_wallet_id;
            
            console.log(`GD Finance Wallet ID: ${gdFinanceWalletId || 'Não configurada'}`);

            // 1. Identificar o afiliado inicial (Geração 1)
            let currentAffiliate = null;
            if (order.referral_code) {
                const { data: aff } = await supabase
                    .from('affiliates')
                    .select('*')
                    .ilike('referral_code', order.referral_code)
                    .eq('organization_id', order.organization_id)
                    .maybeSingle();
                currentAffiliate = aff;
            }

            if (!currentAffiliate && order.user_id) {
                const { data: buyerProfile } = await supabase
                    .from('user_profiles')
                    .select('sponsor_id')
                    .eq('id', order.user_id)
                    .maybeSingle();
                
                if (buyerProfile?.sponsor_id) {
                    const { data: aff } = await supabase
                        .from('affiliates')
                        .select('*')
                        .eq('user_id', buyerProfile.sponsor_id)
                        .eq('organization_id', order.organization_id)
                        .maybeSingle();
                    currentAffiliate = aff;
                }
            }

            // Determinar o usuário de destino (caso não haja patrocinador, vai para o ID Master)
            let targetUserId = null;
            if (currentAffiliate) {
                targetUserId = currentAffiliate.user_id;
            } else {
                // Buscar o ID Master da organização (referral_code = 'master' ou sponsor_id IS NULL)
                const { data: masterAff } = await supabase
                    .from('affiliates')
                    .select('user_id')
                    .eq('organization_id', order.organization_id)
                    .or('referral_code.eq.master,sponsor_id.is.null')
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .maybeSingle();
                
                if (masterAff) {
                    targetUserId = masterAff.user_id;
                } else {
                    const { data: firstAff } = await supabase
                        .from('affiliates')
                        .select('user_id')
                        .eq('organization_id', order.organization_id)
                        .order('created_at', { ascending: true })
                        .limit(1)
                        .maybeSingle();
                    targetUserId = firstAff?.user_id;
                }
            }

            // 2. Calcular o valor total da comissão direta e custo de plataforma com base nos itens
            let totalCommission = 0;
            let totalPlatformCost = 0;
            if (order.order_items && order.order_items.length > 0) {
                for (const item of order.order_items) {
                    // Buscar a categoria e variações do produto
                    const { data: prod } = await supabase
                        .from('products')
                        .select('category_id, name, variations')
                        .eq('id', item.product_id)
                        .maybeSingle();
                    
                    let categoryName = '';
                    if (prod?.category_id) {
                        const { data: cat } = await supabase
                            .from('product_categories')
                            .select('name')
                            .eq('id', prod.category_id)
                            .maybeSingle();
                        categoryName = cat?.name || '';
                    }

                    let commissionVal = 0;
                    const variations = prod?.variations || {};
                    const platformCostVal = parseFloat(variations.custo_plataforma || 0);

                    if (categoryName === 'Planos' || prod?.name?.toLowerCase().includes('telemedicina')) {
                        // Verificar se é renovação (recorrência)
                        const { data: pastOrders } = await supabase
                            .from('orders')
                            .select('id')
                            .eq('user_id', order.user_id)
                            .eq('status', 'Pago')
                            .neq('id', order.id);

                        let isRenewal = false;
                        if (pastOrders && pastOrders.length > 0) {
                            const pastOrderIds = pastOrders.map(o => o.id);
                            const { data: pastItems } = await supabase
                                .from('order_items')
                                .select('product_id, product_name')
                                .in('order_id', pastOrderIds);
                            
                            if (pastItems && pastItems.length > 0) {
                                for (const pi of pastItems) {
                                    const { data: pProd } = await supabase
                                        .from('products')
                                        .select('category_id, name')
                                        .eq('id', pi.product_id)
                                        .maybeSingle();
                                    
                                    let pCatName = '';
                                    if (pProd?.category_id) {
                                        const { data: pCat } = await supabase
                                            .from('product_categories')
                                            .select('name')
                                            .eq('id', pProd.category_id)
                                            .maybeSingle();
                                        pCatName = pCat?.name || '';
                                    }

                                    if (pCatName === 'Planos' || pProd?.name?.toLowerCase().includes('telemedicina') || pi.product_name?.toLowerCase().includes('telemedicina')) {
                                        isRenewal = true;
                                        break;
                                    }
                                }
                            }
                        }

                        if (isRenewal) {
                            commissionVal = parseFloat(variations.comissao_mensal || 0);
                        } else {
                            commissionVal = parseFloat(variations.comissao_adesao || 0);
                        }
                    } else {
                        commissionVal = parseFloat(variations.comissao || 0);
                    }

                    totalCommission += commissionVal * (item.quantity || 1);
                    totalPlatformCost += platformCostVal * (item.quantity || 1);
                }
            }

            const gdFinanceShare = Math.max(0, Number((Number(order.total_amount) - totalPlatformCost - totalCommission).toFixed(2)));

            // 3. Processar o split se houver comissão e destinatário
            if (totalCommission > 0 && targetUserId) {
                // Verificar se o afiliado está ativo
                const { data: isActive } = await supabase.rpc('is_affiliate_active', { p_user_id: targetUserId });
                
                // Buscar carteira do afiliado
                const { data: userSettings } = await supabase
                    .from('user_settings')
                    .select('asaas_wallet_id')
                    .eq('user_id', targetUserId)
                    .maybeSingle();

                let status = 'held_in_gd_finance';
                let targetWalletId = null;

                if (isActive) {
                    if (userSettings?.asaas_wallet_id) {
                        targetWalletId = userSettings.asaas_wallet_id;
                        status = 'split_sent';
                    } else {
                        targetWalletId = null;
                        status = 'no_wallet_configured';
                    }
                } else {
                    targetWalletId = null;
                    status = 'held_in_gd_finance';
                }

                const finalWalletId = targetWalletId || gdFinanceWalletId;

                splitDetails.push({
                    level: 1,
                    user_id: targetUserId,
                    amount: totalCommission,
                    wallet_id: finalWalletId,
                    status: finalWalletId ? status : 'no_wallet_configured'
                });
            }

            // 4. Adicionar a comissão própria da GD Finance (Merchant) no split se configurada
            if (gdFinanceShare > 0 && gdFinanceWalletId) {
                splitDetails.push({
                    level: 0,
                    user_id: null,
                    amount: gdFinanceShare,
                    wallet_id: gdFinanceWalletId,
                    status: 'split_sent'
                });
            }

            // Consolidar splits por walletId para evitar carteiras repetidas no payload
            const consolidatedSplitsMap: Record<string, number> = {};
            for (const detail of splitDetails) {
                if (detail.wallet_id && detail.status !== 'no_wallet_configured') {
                    consolidatedSplitsMap[detail.wallet_id] = (consolidatedSplitsMap[detail.wallet_id] || 0) + detail.amount;
                }
            }

            const splitsToSend = Object.entries(consolidatedSplitsMap).map(([walletId, amount]) => ({
                walletId: walletId,
                fixedValue: Number(amount.toFixed(2))
            })).filter(s => s.fixedValue > 0);

            if (splitsToSend.length > 0 && asaasEnv !== 'sandbox') {
                splitData = splitsToSend;
                console.log('Splits consolidados:', JSON.stringify(splitData));
            } else if (splitsToSend.length > 0 && asaasEnv === 'sandbox') {
                console.log('Ambiente sandbox detectado. Ignorando splits no payload do Asaas para evitar erros de carteira inexistente.');
            }

            // Para compatibilidade com a trigger e logs do banco (Nível 1)
            const level1Split = splitDetails.find((s: any) => s.level === 1);
            const splitWalletId = level1Split && level1Split.status === 'split_sent' ? level1Split.wallet_id : null;
            const splitAmount = level1Split && level1Split.status === 'split_sent' ? level1Split.amount : 0;

            let requestOrigin = origin || req.headers.get("origin") || "https://clubedoseubolso.com.br";
            if (requestOrigin.includes("localhost") || requestOrigin.includes("127.0.0.1")) {
                const orgDomain = org?.domain || "clubedoseubolso.com.br";
                requestOrigin = orgDomain.startsWith("http") ? orgDomain : `https://${orgDomain}`;
            }
            
            // Força o uso do subdomínio autorizado pelo Asaas em produção para evitar bloqueio de redirecionamento
            let successUrlBase = requestOrigin;
            if (!successUrlBase.includes("localhost") && !successUrlBase.includes("127.0.0.1")) {
                successUrlBase = "https://clube.maisunidos.com.br";
            }
            const successUrl = `${successUrlBase}/checkout/success/${order.id}`;

            const paymentData: any = {
                customer: asaasCustomerId,
                value: Number(order.total_amount),
                dueDate: dueDate,
                externalReference: order.id,
                ...(splitData ? { splits: splitData } : {})
            };

            if (targetPaymentMethod === 'pix') {
                paymentData.billingType = "PIX";
            } else if (targetPaymentMethod === 'credit') {
                paymentData.billingType = "CREDIT_CARD";
                if (!body.creditCard || !body.creditCardHolderInfo) {
                    throw new Error("Dados do cartão de crédito e do titular são obrigatórios.");
                }
                paymentData.creditCard = {
                    holderName: body.creditCard.holderName,
                    number: body.creditCard.number,
                    expiryMonth: body.creditCard.expiryMonth,
                    expiryYear: body.creditCard.expiryYear,
                    ccv: body.creditCard.cvv
                };
                paymentData.creditCardHolderInfo = {
                    name: body.creditCardHolderInfo.name,
                    email: body.creditCardHolderInfo.email || order.customer_email,
                    cpfCnpj: body.creditCardHolderInfo.cpfCnpj.replace(/\D/g, ""),
                    postalCode: body.creditCardHolderInfo.postalCode.replace(/\D/g, ""),
                    addressNumber: body.creditCardHolderInfo.addressNumber,
                    addressComplement: body.creditCardHolderInfo.addressComplement || undefined,
                    phone: (body.creditCardHolderInfo.phone || order.customer_phone || "").replace(/\D/g, ""),
                };
            } else {
                paymentData.billingType = "UNDEFINED";
                paymentData.callback = {
                    successUrl: successUrl,
                    autoRedirect: true
                };
            }

            let paymentResponse = await fetch(`${baseUrl}/payments`, {
                method: "POST",
                headers: {
                    "access_token": asaasToken,
                    "Content-Type": "application/json",
                    "User-Agent": "ClubeDoSeuBolsoIntegration"
                },
                body: JSON.stringify(paymentData)
            });

            let paymentErrText = "";
            if (!paymentResponse.ok) {
                paymentErrText = await paymentResponse.text();
                console.warn(`Primeira tentativa de cobrança falhou: ${paymentErrText}`);
                
                // Se o erro for de callback/domínio inválido, tenta criar novamente sem as opções de callback
                if (targetPaymentMethod !== 'pix' && targetPaymentMethod !== 'credit' && (paymentErrText.includes("callback") || paymentErrText.includes("domínio") || paymentErrText.includes("dominio"))) {
                    console.log("Tentando criar cobrança novamente sem as configurações de callback...");
                    const { callback: _, ...paymentDataFallback } = paymentData;

                    paymentResponse = await fetch(`${baseUrl}/payments`, {
                        method: "POST",
                        headers: {
                            "access_token": asaasToken,
                            "Content-Type": "application/json",
                            "User-Agent": "ClubeDoSeuBolsoIntegration"
                        },
                        body: JSON.stringify(paymentDataFallback)
                    });

                    if (!paymentResponse.ok) {
                        paymentErrText = await paymentResponse.text();
                    }
                }
            }

            if (!paymentResponse.ok) {
                try {
                    const errJson = JSON.parse(paymentErrText);
                    if (errJson.errors && errJson.errors.length > 0) {
                        const descriptions = errJson.errors.map((e: any) => e.description).join("; ");
                        throw new Error(descriptions);
                    }
                } catch (e: any) {
                    if (e.message && e.message !== "Unexpected token < in JSON at position 0") {
                        throw e;
                    }
                }
                throw new Error(`Erro ao criar cobrança no Asaas: ${paymentErrText}`);
            }

            const paymentResult = await paymentResponse.json();
            console.log(`Cobrança criada com sucesso! ID Asaas: ${paymentResult.id}`);

            // Se for PIX, buscar os dados do QR Code
            if (targetPaymentMethod === 'pix') {
                console.log(`Buscando QR Code do PIX para cobrança ${paymentResult.id}...`);
                const qrResponse = await fetch(`${baseUrl}/payments/${paymentResult.id}/pixQrCode`, {
                    method: "GET",
                    headers: {
                        "access_token": asaasToken,
                        "Content-Type": "application/json",
                        "User-Agent": "ClubeDoSeuBolsoIntegration"
                    }
                });

                if (!qrResponse.ok) {
                    const qrErrText = await qrResponse.text();
                    console.error(`Erro ao buscar QR code no Asaas: ${qrErrText}`);
                } else {
                    const qrData = await qrResponse.json();
                    paymentResult.pixCopyPaste = qrData.payload;
                    paymentResult.pixQrCodeBase64 = qrData.encodedImage;
                }
            }

            const isCreditCardApproved = targetPaymentMethod === 'credit' && (paymentResult.status === 'CONFIRMED' || paymentResult.status === 'RECEIVED');

            // 4. Salvar o payment_id do Asaas, split, split_details e a URL da fatura (invoiceUrl) no pedido
            await supabase.from("orders").update({
                payment_id: paymentResult.id,
                payment_preference_id: targetPaymentMethod === 'credit' ? null : paymentResult.invoiceUrl,
                pix_qr_code_base64: paymentResult.pixQrCodeBase64 || null,
                pix_copy_paste: paymentResult.pixCopyPaste || null,
                status: isCreditCardApproved ? 'Pago' : 'Pendente',
                payment_status: isCreditCardApproved ? 'paid' : 'pending',
                split_wallet_id: splitWalletId,
                split_amount: splitAmount,
                split_details: splitDetails,
                updated_at: new Date().toISOString()
            }).eq("id", order.id);

            return new Response(JSON.stringify({
                success: true,
                payment_id: paymentResult.id,
                status: isCreditCardApproved ? 'Pago' : 'Pendente',
                pix_qr_code_base64: paymentResult.pixQrCodeBase64 || null,
                pix_copy_paste: paymentResult.pixCopyPaste || null,
                invoiceUrl: paymentResult.invoiceUrl || null,
                init_point: paymentResult.invoiceUrl || null,
                ticket_url: paymentResult.invoiceUrl || null
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        throw new Error("Dados insuficientes para processar o pedido.");

    } catch (error) {
        console.error("Payment Error:", error.message);
        if (requestBody?.orderId) {
            try {
                console.log(`[Cleanup] Deleting order ${requestBody.orderId} due to payment failure...`);
                await supabase.from('order_items').delete().eq('order_id', requestBody.orderId);
                await supabase.from('orders').delete().eq('id', requestBody.orderId);
            } catch (cleanupError) {
                console.error("[Cleanup] Failed to delete order:", cleanupError.message);
            }
        }
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
