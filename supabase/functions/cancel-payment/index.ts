import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Tratar CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { orderId } = await req.json();
        if (!orderId) {
            throw new Error("orderId não fornecido na requisição.");
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Buscar detalhes do pedido
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('payment_id, organization_id, customer_name')
            .eq('id', orderId)
            .maybeSingle();

        if (orderError) throw orderError;
        if (!order) {
            throw new Error(`Pedido ${orderId} não encontrado.`);
        }

        if (!order.payment_id) {
            console.log(`[Cancel Payment] Pedido ${orderId} não possui um ID de pagamento/cobrança do Asaas.`);
            return new Response(JSON.stringify({ 
                success: true, 
                message: "Pedido não possui cobrança do Asaas gerada ou associada." 
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 2. Buscar as credenciais do Asaas da organização
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('asaas_access_token, asaas_environment')
            .eq('id', order.organization_id)
            .maybeSingle();

        if (orgError) throw orgError;
        if (!org || !org.asaas_access_token) {
            throw new Error("Configuração do Asaas (access token) não encontrada para esta organização.");
        }

        const asaasToken = org.asaas_access_token;
        const asaasEnv = org.asaas_environment || 'sandbox';
        const baseUrl = asaasEnv === 'production' 
            ? 'https://api.asaas.com/v3' 
            : 'https://api-sandbox.asaas.com/v3';

        console.log(`[Cancel Payment] Cancelando cobrança ${order.payment_id} no Asaas para o cliente ${order.customer_name || 'N/A'} (Ambiente: ${asaasEnv})...`);

        // 3. Executar a requisição DELETE para a API do Asaas
        const cancelResponse = await fetch(`${baseUrl}/payments/${order.payment_id}`, {
            method: "DELETE",
            headers: {
                "access_token": asaasToken,
                "Content-Type": "application/json",
                "User-Agent": "ClubeDoSeuBolsoIntegration"
            }
        });

        const responseText = await cancelResponse.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch {
            result = { raw: responseText };
        }

        if (!cancelResponse.ok) {
            // Se já estiver cancelada no Asaas, consideramos sucesso para evitar loops/bloqueios
            const isAlreadyCancelled = responseText.toLowerCase().includes("payment_already_cancelled") || 
                                       responseText.toLowerCase().includes("cobrança já foi cancelada") ||
                                       responseText.toLowerCase().includes("payment_not_found") ||
                                       responseText.toLowerCase().includes("não encontrada");
                                       
            if (isAlreadyCancelled) {
                console.log(`[Cancel Payment] A cobrança já se encontra cancelada ou não foi encontrada no Asaas. Prosseguindo.`);
                return new Response(JSON.stringify({ 
                    success: true, 
                    message: "A cobrança já estava inativa ou não foi encontrada no Asaas." 
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
            throw new Error(`Erro na API do Asaas (HTTP ${cancelResponse.status}): ${responseText}`);
        }

        console.log(`[Cancel Payment] Cobrança cancelada com sucesso no Asaas:`, result);

        // Gravar no log de auditoria
        await supabase.from("debug_logs").insert({
            operation: "asaas_cancel_payment",
            message: `Cobrança ${order.payment_id} do pedido ${orderId} (Cliente: ${order.customer_name}) cancelada com sucesso no Asaas.`,
            metadata: {
                order_id: orderId,
                payment_id: order.payment_id,
                response: result
            }
        });

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Cobrança cancelada no Asaas com sucesso.", 
            result 
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error(`[Cancel Payment Error] Erro ao processar cancelamento de cobrança:`, error.message);
        return new Response(JSON.stringify({ 
            error: true, 
            message: error.message 
        }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
