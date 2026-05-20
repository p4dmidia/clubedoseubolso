import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

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

# Check all unique payment methods
orders = get_data("orders?select=payment_method")
if isinstance(orders, list):
    methods = set(o['payment_method'] for o in orders if o['payment_method'])
    print(f"Unique payment methods: {methods}")

# Check for orders with payment_method containing 'Saldo' or 'Balance'
res_saldo = get_data("orders?payment_method=ilike.*Saldo*")
print(f"Orders with Saldo: {json.dumps(res_saldo, indent=2)}")

# Check for orders with payment_method containing 'Carteira' or 'Wallet'
res_wallet = get_data("orders?payment_method=ilike.*Carteira*")
print(f"Orders with Wallet: {json.dumps(res_wallet, indent=2)}")
