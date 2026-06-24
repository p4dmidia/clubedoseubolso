import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight options request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let orderId = "";
    let matchedPlanId: number | null = null;
    let matchedPlanName = "";
    let cleanCpf = "";
    let name = "";

    try {
        const body = await req.json();
        orderId = body.orderId;
        const plainPassword = body.password || "";

        if (!orderId) {
            throw new Error("orderId não fornecido na requisição.");
        }

        console.log(`[Telemedicine Sync] Iniciando sincronização para pedido: ${orderId}`);

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
            'd3b07384-d113-4171-bc01-9a7c936df312': 1, // Individual Essencial
            'd3b07384-d113-4171-bc02-9a7c936df312': 2, // Individual Premium
            'd3b07384-d113-4171-bc03-9a7c936df312': 3, // Familiar Essencial
            'd3b07384-d113-4171-bc04-9a7c936df312': 4, // Familiar Premium
        };

        for (const item of items) {
            const id = item.product_id;
            const pName = item.product_name || "";
            
            if (id && telemedicinePlans[id]) {
                matchedPlanId = telemedicinePlans[id];
                matchedPlanName = pName;
                break;
            }
            
            // Fallback por comparação de texto no nome do produto
            const lowerName = pName.toLowerCase();
            if (lowerName.includes("individual") && lowerName.includes("essencial")) {
                matchedPlanId = 1;
                matchedPlanName = pName;
                break;
            } else if (lowerName.includes("individual") && lowerName.includes("premium")) {
                matchedPlanId = 2;
                matchedPlanName = pName;
                break;
            } else if (lowerName.includes("familiar") && lowerName.includes("essencial")) {
                matchedPlanId = 3;
                matchedPlanName = pName;
                break;
            } else if (lowerName.includes("familiar") && lowerName.includes("premium")) {
                matchedPlanId = 4;
                matchedPlanName = pName;
                break;
            }
        }

        // 4. Ignorar se não for um plano de telemedicina
        if (!matchedPlanId) {
            console.log(`[Telemedicine Sync] Pedido ${orderId} não contém planos de telemedicina. Ignorando.`);
            return new Response(JSON.stringify({ success: true, message: "Ignorado: O pedido não contém plano de telemedicina." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 5. Validar campos obrigatórios básicos para a Mais Unidos API
        const rawCpf = order.customer_cpf || "";
        cleanCpf = rawCpf.replace(/\D/g, "");
        name = order.customer_name || "";

        if (!cleanCpf) {
            throw new Error("CPF do cliente está ausente ou inválido.");
        }
        if (!name) {
            throw new Error("Nome do cliente está ausente.");
        }

        // 5.5. Buscar endereço e dados adicionais no perfil do usuário
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

        if (order.user_id) {
            const { data: profile } = await supabase
                .from("user_profiles")
                .select("cep, address, street, number, complement, neighborhood, city, state, birth_date, sex")
                .eq("id", order.user_id)
                .maybeSingle();

            if (profile) {
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

        // Se o endereço (CEP ou rua/logradouro) estiver ausente, retornamos pendência para o fluxo finalizar na tela de obrigado
        if (!addressData.cep || !addressData.street) {
            console.log(`[Telemedicine Sync] Pedido ${orderId} aguardando preenchimento do endereço pelo cliente.`);
            return new Response(JSON.stringify({ 
                success: true, 
                pending_registration: true, 
                message: "Aguardando preenchimento de endereço e conclusão do cadastro pelo cliente." 
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
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

        // 6. Carregar configurações de ambiente
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

        // 7. Preparar payload JSON (com variações de chaves em inglês e português para maior robustez)
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
                IsActive: true,
                Ativo: true,
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

        if (!apiResponse.ok) {
            throw new Error(`Erro retornado pela API da Mais Unidos (HTTP ${apiResponse.status}): ${responseText}`);
        }

        // Se uma senha foi fornecida, criamos a conta de login do usuário na Mais Unidos
        let registerResponseData = null;
        if (plainPassword) {
            const registerUrl = `${baseUrl}/customers/register`;
            
            // Auxiliar para formatar CPF com pontos e traço no cadastro
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

        // 8. Gravar log de sucesso
        await supabase.from("debug_logs").insert({
            operation: "telemedicine_sync",
            message: `Cliente ${name} (CPF: ${cleanCpf}) integrado com sucesso no plano ID ${matchedPlanId} (${matchedPlanName}).`,
            metadata: {
                order_id: orderId,
                plan_id: matchedPlanId,
                plan_name: matchedPlanName,
                status: "success",
                response: responseData
            }
        });

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Cliente integrado com sucesso.", 
            planId: matchedPlanId,
            response: responseData 
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error(`[Telemedicine Sync Error] Falha na integração do pedido ${orderId}:`, error.message);

        // Gravar log de erro no banco de dados para auditoria do administrador
        try {
            await supabase.from("debug_logs").insert({
                operation: "telemedicine_sync_error",
                message: `Falha ao integrar cliente ${name || "N/A"} (CPF: ${cleanCpf || "N/A"}) no plano ID ${matchedPlanId || "N/A"}: ${error.message}`,
                metadata: {
                    order_id: orderId,
                    error: error.message,
                    stack: error.stack,
                    status: "failed"
                }
            });
        } catch (dbLogErr) {
            console.error("[Telemedicine Sync] Falha catastrófica ao tentar salvar log de erro no DB:", dbLogErr.message);
        }

        return new Response(JSON.stringify({ 
            error: true, 
            message: `Erro na integração: ${error.message}` 
        }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
