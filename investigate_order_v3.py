import urllib.request
import json
import os

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

def investigate():
    output = []
    
    # 1. Search for user profile
    res_profiles = get_data("user_profiles?email=eq.fiel01@gmail.com")
    output.append(f"Profiles: {json.dumps(res_profiles, indent=2)}")
    
    # 2. Search for affiliate
    res_affiliates = get_data("affiliates?email=eq.fiel01@gmail.com")
    output.append(f"Affiliates: {json.dumps(res_affiliates, indent=2)}")
    
    if isinstance(res_profiles, list) and len(res_profiles) > 0:
        user_id = res_profiles[0].get('id')
        output.append(f"USER ID: {user_id}")
        
        # Search for orders by user_id or email
        res_orders_email = get_data(f"orders?customer_email=eq.fiel01@gmail.com")
        output.append(f"Orders by email: {json.dumps(res_orders_email, indent=2)}")
        
        # Search for transactions or wallet
        # Trying different possible table names
        for table in ["transactions", "wallet", "wallet_transactions", "commissions", "balances"]:
            res = get_data(f"{table}?user_id=eq.{user_id}")
            output.append(f"Table {table}: {json.dumps(res, indent=2)}")

    # 3. Check all orders for amount 0.5
    res_orders_05 = get_data("orders?total_amount=eq.0.5")
    output.append(f"Orders (amount 0.5): {json.dumps(res_orders_05, indent=2)}")

    # 4. Check for orders that might have been created recently
    res_recent = get_data("orders?order=created_at.desc&limit=20")
    output.append(f"Recent orders (last 20): {json.dumps(res_recent, indent=2)}")

    with open("investigation_results.txt", "w", encoding="utf-8") as f:
        f.write("\n\n".join(output))

investigate()
