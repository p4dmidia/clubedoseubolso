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

# Get time 1 hour ago
one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
print(f"Checking for new orders since {one_hour_ago}...")

orders = get_data(f"orders?created_at=gte.{one_hour_ago}")
print(f"Orders: {json.dumps(orders, indent=2)}")

# Check for new wallet transactions
transactions = get_data(f"wallet_transactions?created_at=gte.{one_hour_ago}")
print(f"Wallet Transactions: {json.dumps(transactions, indent=2)}")

# Check for withdrawals
withdrawals = get_data(f"withdrawals?created_at=gte.{one_hour_ago}")
print(f"Withdrawals: {json.dumps(withdrawals, indent=2)}")
