import urllib.request
import json
import sys

def trigger_webhook():
    webhook_url = "https://qbjzhcxwtpskrlbgjagc.supabase.co/functions/v1/asaas-webhook"
    
    # Payload simulado do Asaas para PAYMENT_RECEIVED
    payload = {
        "id": "evt_test_simulation_123",
        "event": "PAYMENT_RECEIVED",
        "dateCreated": "2026-05-27 14:35:00",
        "payment": {
            "object": "payment",
            "id": "pay_3ri76n271fcsk0fv",
            "dateCreated": "2026-05-27",
            "customer": "cus_000000000000",
            "value": 34.90,
            "billingType": "PIX",
            "status": "RECEIVED",
            "externalReference": "ORD-1779903200316-9580"
        }
    }
    
    print(f"Disparando webhook manualmente para: {webhook_url}...")
    
    req = urllib.request.Request(webhook_url, data=json.dumps(payload).encode('utf-8'), method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "AsaasWebhookSimulator")
    
    try:
        with urllib.request.urlopen(req) as response:
            resp_data = response.read().decode('utf-8')
            print("\n[Sucesso] Webhook executado!")
            print("Resposta da Edge Function:")
            print(resp_data)
    except urllib.error.HTTPError as err:
        print(f"Erro na Edge Function (HTTP {err.code}): {err.read().decode('utf-8')}")
    except Exception as e:
        print(f"Erro genérico: {e}", file=sys.stderr)

if __name__ == "__main__":
    trigger_webhook()
