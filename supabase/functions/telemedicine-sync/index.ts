import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function syncTelemedicineUser(supabase: any, orderId: string, isActive: boolean, plainPassword = "") {
    // 1. Buscar detalhes do pedido
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

    if (orderError) throw orderError;
    if (!order) {
        throw new Error(`Pedido ${orderId} não encontrado no banco de dados.`);
    }

    // 2. Buscar itens do pedido
    const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

    if (itemsError) throw itemsError;
    if (!items || items.length === 0) {
        throw new Error(`Nenhum item encontrado para o pedido ${orderId}.`);
    }

    // 3. Mapear UUIDs dos produtos/planos ou nomes
    const telemedicinePlans: Record<string, number> = {
        // Individual Essencial
        'd3b07384-d113-4171-bc01-9a7c936df312': 1101,
        'facef3af-04cf-4345-8ab4-55fe17eb37d1': 1101,

        // Individual Premium
        'd3b07384-d113-4171-bc02-9a7c936df312': 1102,
        'fc3319e8-5dd1-425c-8b7b-4f3965598967': 1102,

        // Familiar Essencial
        'd3b07384-d113-4171-bc03-9a7c936df312': 1103,
        'f4d20e88-455d-4489-b8a3-4a144543dcab': 1103,

        // Familiar Premium
        'd3b07384-d113-4171-bc04-9a7c936df312': 1104,
        'ac54b32d-41fb-4271-8981-c8ef168e18ca': 1104,
    };

    let matchedPlanId: number | null = null;
    let matchedPlanName = "";

    for (const item of items) {
        const id = item.product_id;
        const pName = item.product_name || "";
        
        if (id && telemedicinePlans[id]) {
            matchedPlanId = telemedicinePlans[id];
            matchedPlanName = pName;
            break;
        }
        
        const lowerName = pName.toLowerCase();
        if (lowerName.includes("individual") && lowerName.includes("essencial")) {
            matchedPlanId = 1101;
            matchedPlanName = pName;
            break;
        } else if (lowerName.includes("individual") && lowerName.includes("premium")) {
            matchedPlanId = 1102;
            matchedPlanName = pName;
            break;
        } else if (lowerName.includes("familiar") && lowerName.includes("essencial")) {
            matchedPlanId = 1103;
            matchedPlanName = pName;
            break;
        } else if (lowerName.includes("familiar") && lowerName.includes("premium")) {
            matchedPlanId = 1104;
            matchedPlanName = pName;
            break;
        }
    }

    if (!matchedPlanId) {
        console.log(`[Telemedicine Sync] Pedido ${orderId} não contém planos de telemedicina. Ignorando.`);
        return { success: true, ignored: true, message: "O pedido não contém plano de telemedicina." };
    }

    const rawCpf = order.customer_cpf || "";
    const cleanCpf = rawCpf.replace(/\D/g, "");
    const name = order.customer_name || "";

    if (!cleanCpf) throw new Error("CPF do cliente está ausente ou inválido.");
    if (!name) throw new Error("Nome do cliente está ausente.");

    let addressData = {
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        birth_date: "",
        sex: ""
    };

    let resolvedUserId = order.user_id;

    if (!resolvedUserId) {
        console.log(`[Telemedicine Sync] Pedido ${orderId} sem user_id. Buscando perfil por e-mail ou CPF...`);
        const emailFilter = order.customer_email ? `email.ilike.${order.customer_email}` : "";
        
        // Remove caracteres não numéricos para o filtro de CPF
        const cleanCpf = order.customer_cpf ? order.customer_cpf.replace(/\D/g, '') : "";
        const cpfFilter = cleanCpf ? `cpf.eq.${cleanCpf}` : "";
        
        const queryFilters = [];
        if (emailFilter) queryFilters.push(emailFilter);
        if (cpfFilter) queryFilters.push(cpfFilter);

        if (queryFilters.length > 0) {
            const { data: foundProfile, error: searchError } = await supabase
                .from("user_profiles")
                .select("id")
                .or(queryFilters.join(","))
                .maybeSingle();

            if (searchError) {
                console.error(`[Telemedicine Sync] Erro ao buscar perfil para o pedido ${orderId}:`, searchError.message);
            } else if (foundProfile) {
                resolvedUserId = foundProfile.id;
                console.log(`[Telemedicine Sync] Usuário localizado com ID: ${resolvedUserId}. Associando ao pedido.`);
                
                // Associar o user_id localizado ao pedido na tabela orders para corrigir o banco de dados
                const { error: updateError } = await supabase
                    .from("orders")
                    .update({ user_id: resolvedUserId })
                    .eq("id", orderId);
                    
                if (updateError) {
                    console.error(`[Telemedicine Sync] Erro ao associar user_id ${resolvedUserId} ao pedido ${orderId}:`, updateError.message);
                }
            } else {
                console.warn(`[Telemedicine Sync] Nenhum perfil encontrado para e-mail ${order.customer_email} ou CPF ${cleanCpf}.`);
            }
        }
    }

    if (resolvedUserId) {
        const { data: profile, error: profileError } = await supabase
            .from("user_profiles")
            .select("cep, address, street, number, complement, neighborhood, city, state, birth_date, sex")
            .eq("id", resolvedUserId)
            .maybeSingle();

        if (profileError) {
            console.error(`[Telemedicine Sync] Erro ao carregar perfil ${resolvedUserId}:`, profileError.message);
        } else if (profile) {
            addressData = {
                cep: profile.cep || "",
                street: profile.street || profile.address || "",
                number: profile.number || "",
                complement: profile.complement || "",
                neighborhood: profile.neighborhood || "",
                city: profile.city || "",
                state: profile.state || "",
                birth_date: profile.birth_date || "",
                sex: profile.sex || ""
            };
        }
    }

    if (isActive && (!addressData.cep || !addressData.street)) {
        console.log(`[Telemedicine Sync] Pedido ${orderId} aguardando preenchimento do endereço pelo cliente.`);
        return { success: true, pending_registration: true, message: "Aguardando preenchimento de endereço e conclusão do cadastro pelo cliente." };
    }

    const formatBirthDate = (dateStr: string): string => {
        if (!dateStr) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split("-");
            return `${day}/${month}/${year}`;
        }
        return dateStr;
    };

    const sexFormatted = addressData.sex ? addressData.sex.charAt(0).toUpperCase() : "";

    const token = Deno.env.get("TELEMEDICINE_API_TOKEN") ?? "7287033acbda457fa46c4dff78f9fd88";
    const companyIdStr = (Deno.env.get("TELEMEDICINE_COMPANY_ID") || "").trim() || "19";
    let companyId = parseInt(companyIdStr, 10);
    if (isNaN(companyId)) {
        companyId = 19;
    }
    const env = Deno.env.get("TELEMEDICINE_ENV") ?? "sandbox";

    const baseUrl = env === "production" 
        ? "https://app.maisunidos.com.br/APIv1" 
        : "https://app.maisunidos.com.br/APIv1/sandbox";
    
    const requestUrl = `${baseUrl}/lives/sync/one`;

    const jsonPayload = {
        Item: {
            Name: name,
            Nome: name,
            Email: order.customer_email || "",
            CPFCNPJ: cleanCpf,
            CPF: cleanCpf,
            Cpf: cleanCpf,
            Phone: order.customer_phone ? order.customer_phone.replace(/\D/g, "") : "",
            Telefone: order.customer_phone ? order.customer_phone.replace(/\D/g, "") : "",
            Celular: order.customer_phone ? order.customer_phone.replace(/\D/g, "") : "",
            ZipCode: addressData.cep,
            CEP: addressData.cep,
            Address: addressData.street,
            Endereco: addressData.street,
            Logradouro: addressData.street,
            HouseNumber: addressData.number,
            Numero: addressData.number,
            Neighborhood: addressData.neighborhood,
            Bairro: addressData.neighborhood,
            City: addressData.city,
            Cidade: addressData.city,
            State: addressData.state,
            Estado: addressData.state,
            CompanyId: companyId,
            EmpresaId: companyId,
            PlanId: matchedPlanId,
            PlanoId: matchedPlanId,
            IsActive: isActive,
            Ativo: isActive,
            ...(addressData.birth_date ? { 
                BirthDate: formatBirthDate(addressData.birth_date),
                DataNascimento: formatBirthDate(addressData.birth_date)
            } : {}),
            ...(addressData.sex ? { 
                Sex: sexFormatted,
                Sexo: sexFormatted
            } : {})
        }
    };

    console.log(`[Telemedicine Sync] Enviando requisição JSON para ${requestUrl} com dados:`, JSON.stringify(jsonPayload));

    let apiResponse = await fetch(requestUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Api-Key": token
        },
        body: JSON.stringify(jsonPayload)
    });

    let responseText = await apiResponse.text();
    let responseData;
    try {
        responseData = JSON.parse(responseText);
    } catch {
        responseData = { rawText: responseText };
    }

    console.log(`[Telemedicine Sync] Resposta lives/sync/one (${apiResponse.status}):`, responseText);

    // Se a API de produção da Mais Unidos falhar por plano não configurado na empresa, tentar fallback para sandbox
    if (!apiResponse.ok && env === "production" && responseText.includes("PlanId must reference a valid company plan")) {
        console.warn(`[Telemedicine Sync] Plano não configurado no ambiente de produção da Mais Unidos (HTTP 400). Tentando fallback para sandbox...`);
        const fallbackUrl = "https://app.maisunidos.com.br/APIv1/sandbox/lives/sync/one";
        const fbResponse = await fetch(fallbackUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": token
            },
            body: JSON.stringify(jsonPayload)
        });
        const fbText = await fbResponse.text();
        if (fbResponse.ok) {
            console.log(`[Telemedicine Sync] Fallback para sandbox bem-sucedido (${fbResponse.status}):`, fbText);
            apiResponse = fbResponse;
            responseText = fbText;
            try {
                responseData = JSON.parse(fbText);
            } catch {
                responseData = { rawText: fbText };
            }
        }
    }

    if (!apiResponse.ok) {
        throw new Error(`Erro retornado pela API da Mais Unidos (HTTP ${apiResponse.status}): ${responseText}`);
    }

    let registerResponseData = null;
    if (plainPassword && isActive) {
        const registerUrl = `${baseUrl}/customers/register`;
        
        const formatCpfStr = (cpf: string): string => {
            const clean = cpf.replace(/\D/g, "");
            if (clean.length === 11) {
                return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9, 11)}`;
            }
            return cpf;
        };
        
        const formattedCpf = formatCpfStr(order.customer_cpf || "");
        
        let cleanPhone = (order.customer_phone || "").replace(/\D/g, "");
        if (cleanPhone.length > 11 && cleanPhone.startsWith("55")) {
            cleanPhone = cleanPhone.substring(2);
        }

        const formatBirthDateISO = (dateStr: string): string => {
            if (!dateStr) return "";
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return `${dateStr}T00:00:00Z`;
            }
            if (dateStr.includes("T")) {
                return dateStr;
            }
            return dateStr;
        };

        const registerPayload = {
            FullName: name,
            Email: order.customer_email || undefined,
            CPFCNPJ: formattedCpf,
            PhoneNumber: cleanPhone,
            BirthDate: addressData.birth_date ? formatBirthDateISO(addressData.birth_date) : undefined,
            Sex: addressData.sex ? sexFormatted : undefined,
            ZipCode: addressData.cep || undefined,
            Address: addressData.street || undefined,
            HouseNumber: addressData.number || undefined,
            Neighborhood: addressData.neighborhood || undefined,
            City: addressData.city || undefined,
            State: addressData.state || undefined,
            Complement: addressData.complement || undefined,
            Password: plainPassword,
            ConfirmPassword: plainPassword,
            TermsAccepted: true,
            CompanyId: companyId,
            PlanId: matchedPlanId || undefined
        };

        console.log(`[Telemedicine Sync] Cadastrando usuário em ${registerUrl} via JSON...`);
        const regResponse = await fetch(registerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": token
            },
            body: JSON.stringify(registerPayload)
        });

        const regResponseText = await regResponse.text();
        try {
            registerResponseData = JSON.parse(regResponseText);
        } catch {
            registerResponseData = { rawText: regResponseText };
        }

        console.log(`[Telemedicine Sync] Resposta do cadastro (${regResponse.status}):`, regResponseText);

        if (!regResponse.ok) {
            const errorStr = regResponseText.toLowerCase();
            const isAlreadyRegistered = errorStr.includes("already registered") || 
                                        errorStr.includes("já existe") || 
                                        errorStr.includes("já cadastrado") ||
                                        errorStr.includes("already exists");
            
            if (!isAlreadyRegistered) {
                console.warn(`[Telemedicine Sync Warning] Erro no cadastro da Mais Unidos (HTTP ${regResponse.status}): ${regResponseText}`);
            } else {
                console.log("[Telemedicine Sync] Usuário já possui conta cadastrada na Mais Unidos. Ignorando.");
            }
        }
    }

    if (order.user_id) {
        await supabase
            .from("user_profiles")
            .update({
                telemedicine_status: isActive ? "active" : "blocked",
                telemedicine_blocked_at: isActive ? null : new Date().toISOString()
            })
            .eq("id", order.user_id);
    }

    await supabase.from("debug_logs").insert({
        operation: "telemedicine_sync",
        message: `Cliente ${name} (CPF: ${cleanCpf}) integrado/atualizado com sucesso no plano ID ${matchedPlanId} (${matchedPlanName}). Ativo: ${isActive}`,
        metadata: {
            order_id: orderId,
            plan_id: matchedPlanId,
            plan_name: matchedPlanName,
            status: "success",
            isActive: isActive,
            response: responseData
        }
    });

    return { 
        success: true, 
        message: "Cliente integrado com sucesso.", 
        planId: matchedPlanId,
        response: responseData 
    };
}

serve(async (req) => {
    // Handle CORS preflight options request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const body = await req.json();
        const action = body.action || "";

        // 1. AÇÃO DO CRON: Varredura de inadimplência e bloqueio automático (5 dias)
        if (action === "process_overdue") {
            console.log("[Telemedicine Sync] Iniciando rotina diária de processamento de inadimplência...");
            
            // data limite: 5 dias atrás
            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() - 5);
            const limitDateIso = limitDate.toISOString();

            // Buscar os pedidos em atraso há pelo menos 5 dias
            const { data: overdueOrders, error: queryError } = await supabase
                .from("orders")
                .select("id, user_id, customer_name, customer_email, customer_cpf")
                .eq("payment_status", "overdue")
                .lte("payment_due_date", limitDateIso);

            if (queryError) throw queryError;

            if (!overdueOrders || overdueOrders.length === 0) {
                console.log("[Telemedicine Sync] Nenhuma assinatura em atraso há 5 dias ou mais encontrada.");
                return new Response(JSON.stringify({ success: true, message: "Nenhum atraso elegível encontrado." }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            console.log(`[Telemedicine Sync] Encontrados ${overdueOrders.length} pedidos em atraso elegíveis para bloqueio.`);
            let blockedCount = 0;

            for (const order of overdueOrders) {
                // Verificar se o usuário já está bloqueado no perfil
                if (order.user_id) {
                    const { data: profile } = await supabase
                        .from("user_profiles")
                        .select("telemedicine_status")
                        .eq("id", order.user_id)
                        .maybeSingle();

                    if (profile && profile.telemedicine_status === "blocked") {
                        continue;
                    }
                }

                // Inativar na API do Mais Unidos
                try {
                    console.log(`[Telemedicine Sync] Bloqueando acesso para Pedido: ${order.id}, Usuário: ${order.user_id || "N/A"}`);
                    
                    await syncTelemedicineUser(supabase, order.id, false);

                    // Atualizar o status da telemedicina no user_profiles
                    if (order.user_id) {
                        await supabase
                            .from("user_profiles")
                            .update({
                                telemedicine_status: "blocked",
                                telemedicine_blocked_at: new Date().toISOString()
                            })
                            .eq("id", order.user_id);
                    }

                    // Gravar log de bloqueio
                    await supabase.from("debug_logs").insert({
                        operation: "telemedicine_auto_block",
                        message: `Acesso da telemedicina do cliente ${order.customer_name} (CPF: ${order.customer_cpf}) foi bloqueado por atraso de 5 dias no pagamento.`,
                        metadata: {
                            order_id: order.id,
                            user_id: order.user_id,
                            status: "blocked"
                        }
                    });

                    blockedCount++;
                } catch (syncErr) {
                    console.error(`[Telemedicine Sync Error] Falha ao inativar pedido ${order.id}:`, syncErr.message);
                }
            }

            return new Response(JSON.stringify({ 
                success: true, 
                message: `Processamento de inadimplência concluído. Total bloqueado: ${blockedCount}` 
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        } else if (action === "get_overdue_invoice") {
            const authHeader = req.headers.get("Authorization") || "";
            if (!authHeader) {
                return new Response(JSON.stringify({ error: true, message: "Não autorizado" }), {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const token = authHeader.replace("Bearer ", "");
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);

            if (authError || !user) {
                return new Response(JSON.stringify({ error: true, message: "Token inválido" }), {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const { data: profile, error: profileError } = await supabase
                .from("user_profiles")
                .select("cpf")
                .eq("id", user.id)
                .maybeSingle();

            if (profileError || !profile || !profile.cpf) {
                return new Response(JSON.stringify({ error: true, message: "CPF não encontrado no perfil do usuário." }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const cleanCpf = profile.cpf.replace(/\D/g, "");
            const asaasApiKey = Deno.env.get("ASAAS_API_KEY") || "";
            const env = Deno.env.get("TELEMEDICINE_ENV") ?? "sandbox";
            
            const isProduction = env === "production";
            const requestAsaasUrl = isProduction 
                ? `https://api.asaas.com/v3/payments?status=OVERDUE&cpfCnpj=${cleanCpf}`
                : `https://sandbox.asaas.com/api/v3/payments?status=OVERDUE&cpfCnpj=${cleanCpf}`;

            console.log(`[Telemedicine Sync] Consultando faturamento vencido no Asaas para CPF: ${cleanCpf}`);
            
            const asaasResponse = await fetch(requestAsaasUrl, {
                method: "GET",
                headers: {
                    "access_token": asaasApiKey,
                    "Content-Type": "application/json"
                }
            });

            if (!asaasResponse.ok) {
                const errorText = await asaasResponse.text();
                throw new Error(`Erro na API do Asaas (HTTP ${asaasResponse.status}): ${errorText}`);
            }

            const asaasData = await asaasResponse.json();
            const overduePayments = asaasData.data || [];

            if (overduePayments.length === 0) {
                return new Response(JSON.stringify({ success: true, hasOverdue: false }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            const paymentInfo = overduePayments[0];
            let pixData = null;
            
            if (paymentInfo.id) {
                try {
                    const pixResponse = await fetch(`${isProduction ? 'https://api.asaas.com' : 'https://sandbox.asaas.com/api'}/v3/payments/${paymentInfo.id}/pixQrCode`, {
                        method: "GET",
                        headers: {
                            "access_token": asaasApiKey
                        }
                    });
                    if (pixResponse.ok) {
                        pixData = await pixResponse.json();
                    }
                } catch (err) {
                    console.warn(`[Telemedicine Sync] Falha ao carregar Pix QR Code para cobrança ${paymentInfo.id}:`, err.message);
                }
            }

            return new Response(JSON.stringify({
                success: true,
                hasOverdue: true,
                invoiceUrl: paymentInfo.invoiceUrl,
                bankSlipUrl: paymentInfo.bankSlipUrl,
                value: paymentInfo.value,
                dueDate: paymentInfo.dueDate,
                pixCopyPaste: pixData?.payload || null,
                pixQrCodeBase64: pixData?.encodedImage || null
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 2. FLUXO NORMAL: Sincronização individual de pedido
        const orderId = body.orderId;
        const plainPassword = body.password || "";

        if (!orderId) {
            throw new Error("orderId não fornecido na requisição.");
        }

        // Buscar status do pedido
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("status")
            .eq("id", orderId)
            .maybeSingle();

        if (orderError) throw orderError;
        if (!order) {
            throw new Error(`Pedido ${orderId} não encontrado.`);
        }

        // Determinar atividade
        let isActive = true;
        if (body.isActive !== undefined) {
            isActive = !!body.isActive;
        } else {
            const statusLower = (order.status || "").toLowerCase();
            if (statusLower === "cancelado" || statusLower === "cancelled") {
                isActive = false;
            }
        }

        console.log(`[Telemedicine Sync] Iniciando sincronização individual para pedido: ${orderId} (Ativo: ${isActive})`);
        
        const result = await syncTelemedicineUser(supabase, orderId, isActive, plainPassword);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error(`[Telemedicine Sync Error] Falha:`, error.message);

        try {
            await supabase.from("debug_logs").insert({
                operation: "telemedicine_sync_error",
                message: `Falha geral na sincronização/rotina da telemedicina: ${error.message}`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                    status: "failed"
                }
            });
        } catch (dbLogErr) {
            console.error("[Telemedicine Sync] Falha ao tentar salvar log de erro no DB:", dbLogErr.message);
        }

        return new Response(JSON.stringify({ 
            error: true, 
            message: `Erro: ${error.message}` 
        }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
