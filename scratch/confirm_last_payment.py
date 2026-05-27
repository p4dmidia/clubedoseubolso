import urllib.request
import json
import sys
from supabase import create_client, Client

def confirm_payment():
    url = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"
    
    supabase: Client = create_client(url, anon_key)
    try:
        # Fazer login como admin para passar pela RLS
        print("Realizando login como admin...")
        supabase.auth.sign_in_with_password({
            "email": "admin@seuclube.com",
            "password": "SenhaAdmin123!"
        })

        # 1. Buscar o pedido pendente mais recente
        print("Buscando o pedido pendente mais recente...")
        res = supabase.table("orders").select("id, payment_id, total_amount").order("created_at", desc=True).limit(1).execute()
        if not res.data:
            print("Nenhum pedido encontrado no banco de dados.")
            return
        
        order = res.data[0]
        payment_id = order.get("payment_id")
        order_id = order.get("id")
        print(f"Pedido encontrado: {order_id} | ID de pagamento do Asaas: {payment_id} | Valor: R$ {order['total_amount']}")
        
        if not payment_id:
            print("Este pedido não possui um ID de pagamento do Asaas associado.")
            return

        # 2. Obter a chave do Asaas do banco de dados (da organização)
        print("Buscando chave do Asaas da organização...")
        org_res = supabase.table("organizations").select("asaas_access_token").eq("id", "5111af72-27a5-41fd-8ed9-8c51b78b4fdd").single().execute()
        asaas_token = org_res.data.get("asaas_access_token")
        
        if not asaas_token:
            print("Token do Asaas não encontrado na organização.")
            return

        # 3. Chamar a API de confirmação de testes do Asaas Sandbox
        confirm_url = f"https://api-sandbox.asaas.com/v3/sandbox/payments/{payment_id}/confirm"
        print(f"Enviando requisição de confirmação para: {confirm_url}")
        
        req = urllib.request.Request(confirm_url, method="POST")
        req.add_header("access_token", asaas_token)
        req.add_header("Content-Type", "application/json")
        req.add_header("User-Agent", "ClubeDoSeuBolsoIntegration")
        
        try:
            with urllib.request.urlopen(req) as response:
                resp_data = response.read().decode('utf-8')
                print("\n[Sucesso] Pagamento simulado no Asaas Sandbox!")
                print("Resposta do Asaas:")
                print(resp_data)
        except urllib.error.HTTPError as api_err:
            print(f"Erro na primeira tentativa (/sandbox/payments/): {api_err.code} - {api_err.read().decode('utf-8')}")
            # Tentar com a URL no singular
            try:
                confirm_url_alt = f"https://api-sandbox.asaas.com/v3/sandbox/payment/{payment_id}/confirm"
                print(f"Tentando URL alternativa: {confirm_url_alt}")
                req_alt = urllib.request.Request(confirm_url_alt, method="POST")
                req_alt.add_header("access_token", asaas_token)
                req_alt.add_header("Content-Type", "application/json")
                req_alt.add_header("User-Agent", "ClubeDoSeuBolsoIntegration")
                
                with urllib.request.urlopen(req_alt) as response_alt:
                    resp_data_alt = response_alt.read().decode('utf-8')
                    print("\n[Sucesso] Pagamento simulado com URL alternativa!")
                    print("Resposta:")
                    print(resp_data_alt)
            except urllib.error.HTTPError as api_err_alt:
                print(f"Erro na segunda tentativa (/sandbox/payment/): {api_err_alt.code} - {api_err_alt.read().decode('utf-8')}")
            except Exception as e_alt:
                print(f"Erro genérico na segunda tentativa: {e_alt}")
        except Exception as e:
            print(f"Erro genérico na primeira tentativa: {e}")

    except Exception as e:
        print(f"Erro: {e}", file=sys.stderr)

if __name__ == "__main__":
    confirm_payment()
