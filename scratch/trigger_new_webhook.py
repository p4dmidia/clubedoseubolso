import urllib.request
import json
import sys
from supabase import create_client, Client

def trigger_and_verify():
    # 1. Disparar o webhook manualmente para o novo pedido
    webhook_url = "https://qbjzhcxwtpskrlbgjagc.supabase.co/functions/v1/asaas-webhook"
    
    payload = {
        "id": "evt_test_simulation_new",
        "event": "PAYMENT_RECEIVED",
        "dateCreated": "2026-05-27 14:50:00",
        "payment": {
            "object": "payment",
            "id": "pay_71uhwzcjikzd9h6h",
            "dateCreated": "2026-05-27",
            "customer": "cus_000000000000",
            "value": 17.90,
            "billingType": "PIX",
            "status": "RECEIVED",
            "externalReference": "ORD-1779904028747-4483"
        }
    }
    
    print(f"Enviando payload do webhook para: {webhook_url}...")
    req = urllib.request.Request(webhook_url, data=json.dumps(payload).encode('utf-8'), method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "AsaasWebhookSimulator")
    
    try:
        with urllib.request.urlopen(req) as response:
            resp_data = response.read().decode('utf-8')
            print(f"[Sucesso Webhook] Resposta: {resp_data}")
    except Exception as e:
        print(f"Erro ao disparar webhook: {e}")
        return

    # 2. Verificar o status do pedido no banco de dados e as comissões geradas
    url = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"
    
    supabase: Client = create_client(url, anon_key)
    try:
        supabase.auth.sign_in_with_password({
            "email": "admin@seuclube.com",
            "password": "SenhaAdmin123!"
        })
        
        # Verificar Pedido
        print("\n--- STATUS DO PEDIDO APÓS WEBHOOK ---")
        order_res = supabase.table("orders").select("id, status, referral_code, user_id").eq("id", "ORD-1779904028747-4483").single().execute()
        order = order_res.data
        print(f"ID: {order['id']} | Status: {order['status']} | Referral: {order['referral_code']} | User ID: {order['user_id']}")
        
        # Verificar Comissões do Pedido
        print("\n--- COMISSÕES LANÇADAS ---")
        comm_res = supabase.table("commissions").select("*").eq("order_id", "ORD-1779904028747-4483").execute()
        if comm_res.data:
            for comm in comm_res.data:
                print(f"ID: {comm['id']} | User ID: {comm['user_id']} | Valor: R$ {comm['amount']} | Tipo: {comm['commission_type']} | Desc: {comm['description']}")
        else:
            print("Nenhuma comissão encontrada para este pedido.")
            
    except Exception as e:
        print(f"Erro de verificação: {e}")

if __name__ == "__main__":
    trigger_and_verify()
