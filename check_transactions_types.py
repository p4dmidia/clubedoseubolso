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

# Check all unique transaction types
transactions = get_data("wallet_transactions?select=type")
if isinstance(transactions, list):
    types = set(t['type'] for t in transactions if t['type'])
    print(f"Unique transaction types: {types}")

# Check for any transaction related to purchase
res_purchase = get_data("wallet_transactions?type=ilike.*purchase*")
print(f"Purchase transactions: {json.dumps(res_purchase, indent=2)}")

# Check for any transaction with amount 0.5 (or -0.5)
res_05 = get_data("wallet_transactions?amount=eq.0.5")
print(f"Transactions with amount 0.5: {json.dumps(res_05, indent=2)}")

# Check for any transaction with amount -0.5 (deduction)
res_minus_05 = get_data("wallet_transactions?amount=eq.-0.5")
print(f"Transactions with amount -0.5: {json.dumps(res_minus_05, indent=2)}")
