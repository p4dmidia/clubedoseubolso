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

        // 7. Preparar payloads (tanto form-urlencoded quanto JSON)
        
        // 7a. URLSearchParams (form-urlencoded)
        const params = new URLSearchParams();
        params.append("Item.Name", name);
        params.append("Item.Nome", name);
        if (order.customer_email) {
            params.append("Item.Email", order.customer_email);
        }
        params.append("Item.CPFCNPJ", cleanCpf);
        params.append("Item.CPF", cleanCpf);
        params.append("Item.Cpf", cleanCpf);
        if (order.customer_phone) {
            params.append("Item.Phone", order.customer_phone.replace(/\D/g, ""));
            params.append("Item.Telefone", order.customer_phone.replace(/\D/g, ""));
        }
        params.append("Item.CompanyId", companyId.toString());
        params.append("Item.PlanId", matchedPlanId.toString());
        params.append("Item.IsActive", "true");
        
        if (addressData.cep) {
            params.append("Item.ZipCode", addressData.cep);
            params.append("Item.CEP", addressData.cep);
        }
        if (addressData.street) {
            params.append("Item.Address", addressData.street);
            params.append("Item.Endereco", addressData.street);
        }
        if (addressData.number) {
            params.append("Item.HouseNumber", addressData.number);
            params.append("Item.Numero", addressData.number);
        }
        if (addressData.neighborhood) {
            params.append("Item.Neighborhood", addressData.neighborhood);
            params.append("Item.Bairro", addressData.neighborhood);
        }
        if (addressData.city) {
            params.append("Item.City", addressData.city);
            params.append("Item.Cidade", addressData.city);
        }
        if (addressData.state) {
            params.append("Item.State", addressData.state);
            params.append("Item.Estado", addressData.state);
        }
        if (addressData.birth_date) {
            const bDate = formatBirthDate(addressData.birth_date);
            params.append("Item.BirthDate", bDate);
            params.append("Item.DataNascimento", bDate);
        }
        if (addressData.sex) {
            params.append("Item.Sex", sexFormatted);
            params.append("Item.Sexo", sexFormatted);
        }

        // 7b. Objeto JSON
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

        console.log(`[Telemedicine Sync] Tentando integração via form-urlencoded para ${requestUrl}...`);
        
        let apiResponse = await fetch(requestUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Api-Key": token
            },
            body: params.toString()
        });

        let responseText = await apiResponse.text();
        console.log(`[Telemedicine Sync] Resposta form-urlencoded (${apiResponse.status}):`, responseText);

        // Se falhar, tenta com JSON
        if (!apiResponse.ok) {
            console.log(`[Telemedicine Sync] Tentativa form-urlencoded falhou. Tentando via JSON...`);
            apiResponse = await fetch(requestUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Api-Key": token
                },
                body: JSON.stringify(jsonPayload)
            });

            responseText = await apiResponse.text();
            console.log(`[Telemedicine Sync] Resposta JSON (${apiResponse.status}):`, responseText);
        }

        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch {
            responseData = { rawText: responseText };
        }

        if (!apiResponse.ok) {
            throw new Error(`Erro retornado pela API da Mais Unidos (HTTP ${apiResponse.status}): ${responseText}`);
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
