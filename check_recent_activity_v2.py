import urllib.request
import json
from datetime import datetime, timedelta, timezone

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

one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()

with open("recent_output_v2.txt", "w", encoding="utf-8") as f:
    f.write(f"Checking for new activity since {one_hour_ago}...\n")
    
    f.write("\n--- Recent Orders ---\n")
    orders = get_data(f"orders?created_at=gte.{one_hour_ago}")
    f.write(json.dumps(orders, indent=2))
    
    f.write("\n--- Recent Wallet Transactions ---\n")
    transactions = get_data(f"wallet_transactions?created_at=gte.{one_hour_ago}")
    f.write(json.dumps(transactions, indent=2))
    
    f.write("\n--- Recent Withdrawals ---\n")
    withdrawals = get_data(f"withdrawals?created_at=gte.{one_hour_ago}")
    f.write(json.dumps(withdrawals, indent=2))
