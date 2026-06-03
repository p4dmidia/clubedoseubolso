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

            // --- CÁLCULO DE SPLIT ---
            let splitData = null;
            let splitWalletId = null;
            let splitAmount = 0;

            if (order.referral_code) {
                console.log(`Buscando Wallet ID para o referral_code do afiliado: ${order.referral_code}...`);
                const { data: affiliate } = await supabase
                    .from('affiliates')
                    .select('user_id')
                    .ilike('referral_code', order.referral_code)
                    .maybeSingle();

                if (affiliate) {
                    const { data: userSettings } = await supabase
                        .from('user_settings')
                        .select('asaas_wallet_id')
                        .eq('user_id', affiliate.user_id)
                        .maybeSingle();

                    if (userSettings?.asaas_wallet_id) {
                        splitWalletId = userSettings.asaas_wallet_id;
                        
                        // Obter a comissão configurada para Geração 1
                        const { data: configData } = await supabase
                            .from('commission_configs')
                            .select('*')
                            .eq('key', 'geral')
                            .maybeSingle();

                        let rateValue = 10; // Fallback 10%
                        if (configData && Array.isArray(configData.levels) && configData.levels.length > 0) {
                            rateValue = parseFloat(configData.levels[0].value) || 10;
                        }

                        if (configData?.type === 'fixed') {
                            splitAmount = rateValue;
                        } else {
                            splitAmount = Number((Number(order.total_amount) * (rateValue / 100)).toFixed(2));
                        }

                        if (splitAmount > 0) {
                            splitData = [{
                                walletId: splitWalletId,
                                fixedValue: splitAmount
                            }];
                            console.log(`Configurando split de comissão: R$ ${splitAmount} para Wallet ID: ${splitWalletId}`);
                        }
                    } else {
                        console.log(`Afiliado com código ${order.referral_code} encontrado, mas sem Wallet ID cadastrado.`);
                    }
                } else {
                    console.log(`Nenhum afiliado encontrado para o código de indicação: ${order.referral_code}`);
                }
            }

            const paymentData = {
                customer: asaasCustomerId,
                billingType: "UNDEFINED",
                value: Number(order.total_amount),
                dueDate: dueDate,
                externalReference: order.id,
                ...(splitData ? { splits: splitData } : {})
            };

            const paymentResponse = await fetch(`${baseUrl}/payments`, {
                method: "POST",
                headers: {
                    "access_token": asaasToken,
                    "Content-Type": "application/json",
                    "User-Agent": "ClubeDoSeuBolsoIntegration"
                },
                body: JSON.stringify(paymentData)
            });

            if (!paymentResponse.ok) {
                const errText = await paymentResponse.text();
                throw new Error(`Erro ao criar cobrança no Asaas: ${errText}`);
            }

            const paymentResult = await paymentResponse.json();
            console.log(`Cobrança criada com sucesso! ID Asaas: ${paymentResult.id}`);

            // 4. Salvar o payment_id do Asaas, split e a URL da fatura (invoiceUrl) no pedido
            await supabase.from("orders").update({
                payment_id: paymentResult.id,
                payment_preference_id: paymentResult.invoiceUrl,
                status: 'Pendente',
                split_wallet_id: splitWalletId,
                split_amount: splitAmount,
                updated_at: new Date().toISOString()
            }).eq("id", order.id);

            return new Response(JSON.stringify({
                success: true,
                payment_id: paymentResult.id,
                invoiceUrl: paymentResult.invoiceUrl,
                init_point: paymentResult.invoiceUrl, // Compatibilidade com frontend (Cartão)
                ticket_url: paymentResult.invoiceUrl  // Compatibilidade com frontend (PIX)
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
