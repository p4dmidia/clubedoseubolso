import urllib.request
import json
import sys

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
    print("Searching for user fiel01@gmail.com...")
    # Try different table names since I don't know the exact schema
    res_profiles = get_data("user_profiles?email=eq.fiel01@gmail.com")
    print(f"Profiles: {res_profiles}")
    
    res_affiliates = get_data("affiliates?email=eq.fiel01@gmail.com")
    print(f"Affiliates: {res_affiliates}")
    
    # Check for orders for this email
    res_orders = get_data("orders?customer_email=eq.fiel01@gmail.com")
    print(f"Orders (fiel01@gmail.com): {res_orders}")
    
    # Check for orders with amount 0.5
    res_orders_05 = get_data("orders?total_amount=eq.0.5")
    print(f"Orders (amount 0.5): {res_orders_05}")

    # Check for commissions or transactions
    # Maybe the table is 'commissions' or 'wallet_transactions'
    res_commissions = get_data("commissions?email=eq.fiel01@gmail.com")
    print(f"Commissions: {res_commissions}")

investigate()
