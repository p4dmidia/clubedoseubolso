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

print("--- Commission Configs ---")
print(json.dumps(get_data("commission_configs"), indent=2))

print("\n--- Recent Orders (0.50) ---")
orders = get_data("orders?total_amount=eq.0.5&select=id,status,referral_code,user_id,customer_email")
print(json.dumps(orders, indent=2))

if orders:
    order_id = orders[0]['id']
    print(f"\n--- Commissions for Order {order_id} ---")
    commissions = get_data(f"commissions?order_id=eq.{order_id}")
    print(json.dumps(commissions, indent=2))

print("\n--- Affiliates ---")
affiliates = get_data("affiliates?select=id,user_id,referral_code,sponsor_id,name")
print(json.dumps(affiliates, indent=2))
