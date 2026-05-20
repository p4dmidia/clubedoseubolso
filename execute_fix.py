import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def patch_data(endpoint, data):
    url = f"{supabase_url}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, method="PATCH", data=json.dumps(data).encode())
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    try:
        with urllib.request.urlopen(req) as response:
            return {"status": response.status}
    except Exception as e:
        return {"error": str(e)}

def get_data(endpoint):
    url = f"{supabase_url}/rest/v1/{endpoint}"
    req = urllib.request.Request(url)
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": str(e)}

# 1. Obter detalhes do pedido para gilgalmissoes@gmail.com
# Queremos o pedido de 0.50 que tenha itens
items = get_data("order_items?unit_price=eq.0.5&select=order_id")
if not items or "error" in items:
    print("Nenhum item de 0.50 encontrado.")
    exit(1)

valid_order_id = items[0]['order_id']
print(f"ID do Pedido identificado: {valid_order_id}")

# 2. Mudar e-mail para fiel01@gmail.com e status para Pago
order_update = {
    "customer_email": "fiel01@gmail.com",
    "customer_name": "fiel 01",
    "status": "Pago",
    "payment_method": "Saldo Classe A"
}
res1 = patch_data(f"orders?id=eq.{valid_order_id}", order_update)
print(f"Update Order: {res1}")

# 3. Deduzir saldo de fiel01@gmail.com
# Primeiro pegamos o saldo atual
fiel_id = "7e57d5d8-f44c-46ed-8c14-46e191321620"
settings = get_data(f"user_settings?user_id=eq.{fiel_id}")
if settings and "error" not in settings and len(settings) > 0:
    current_balance = settings[0]['available_balance']
    new_balance = float(current_balance) - 0.5
    res2 = patch_data(f"user_settings?user_id=eq.{fiel_id}", {"available_balance": new_balance})
    print(f"Update Balance: {res2}")
else:
    print("Settings não encontradas para fiel01.")

# 4. Ativar Afiliado
res3 = patch_data(f"user_profiles?id=eq.{fiel_id}", {"is_active": True, "last_activation_at": "now()"}) # 'now()' might not work in REST, let's use iso format
import datetime
now_iso = datetime.datetime.now().isoformat()
res3 = patch_data(f"user_profiles?id=eq.{fiel_id}", {"is_active": True, "last_activation_at": now_iso})
print(f"Update Profile: {res3}")
