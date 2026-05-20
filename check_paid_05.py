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

# Check all unique organization_id in orders
orders = get_data("orders?select=organization_id")
if isinstance(orders, list):
    orgs = set(o['organization_id'] for o in orders if o['organization_id'])
    print(f"Unique organization IDs in orders: {orgs}")

# Check for any order with status 'Pago' or 'completed' and amount 0.5
res_05_paid = get_data("orders?total_amount=eq.0.5&status=in.(Pago,completed)")
print(f"Paid 0.5 orders: {json.dumps(res_05_paid, indent=2)}")
