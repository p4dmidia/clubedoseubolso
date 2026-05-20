
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

print("--- TABLE INSPECTION ---")

# Check affiliates columns
affiliates = get_data("affiliates?limit=1")
print(f"Affiliates columns: {list(affiliates[0].keys()) if affiliates and not isinstance(affiliates, dict) else 'Error'}")
if affiliates and not isinstance(affiliates, dict):
    print(f"Sample affiliate: {json.dumps(affiliates[0], indent=2)}")

# Check commissions columns
commissions = get_data("commissions?limit=1")
print(f"Commissions columns: {list(commissions[0].keys()) if commissions and not isinstance(commissions, dict) else 'Error'}")

# Check user_settings columns
user_settings = get_data("user_settings?limit=1")
print(f"User Settings columns: {list(user_settings[0].keys()) if user_settings and not isinstance(user_settings, dict) else 'Error'}")

# List recent pending orders with their IDs
pending_orders = get_data("orders?status=eq.Pendente&limit=5&select=id,customer_name,referral_code")
print(f"Pending orders: {json.dumps(pending_orders, indent=2)}")
