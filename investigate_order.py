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

# Check user profile for fiel01@gmail.com
user = get_data("user_profiles?email=eq.fiel01@gmail.com")
print(f"User Profile: {json.dumps(user, indent=2)}")

# Check affiliates for the same email
affiliate = get_data("affiliates?email=eq.fiel01@gmail.com")
print(f"Affiliate: {json.dumps(affiliate, indent=2)}")

# Check all orders to see if any exist for this price
orders = get_data("orders?total_amount=eq.0.5")
print(f"Orders with 0.5: {json.dumps(orders, indent=2)}")

# Check last orders
last_orders = get_data("orders?order=created_at.desc&limit=5")
print(f"Last orders: {json.dumps(last_orders, indent=2)}")
