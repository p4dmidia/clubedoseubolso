import urllib.request
import json
from datetime import datetime, timezone

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

today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
print(f"Checking orders for {today}...")

orders = get_data(f"orders?created_at=gte.{today}T00:00:00Z&order=created_at.desc")
print(f"Total orders today: {len(orders) if isinstance(orders, list) else 'Error'}")

if isinstance(orders, list):
    for o in orders:
        print(f"Order: {o['id']} | Email: {o['customer_email']} | Amount: {o['total_amount']} | Status: {o['status']} | Payment: {o['payment_method']}")
else:
    print(orders)

# Check user_settings too
user_id = "7e57d5d8-f44c-46ed-8c14-46e191321620"
settings = get_data(f"user_settings?user_id=eq.{user_id}")
print(f"User Settings (fiel01): {json.dumps(settings, indent=2)}")

# Check for any new transactions
transactions = get_data(f"wallet_transactions?created_at=gte.{today}T00:00:00Z")
print(f"Transactions today: {json.dumps(transactions, indent=2)}")
