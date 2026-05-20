import urllib.request
import json
import sys
import urllib.parse

# Ensure UTF-8 output
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

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

def delete_data(endpoint):
    url = f"{supabase_url}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, method="DELETE")
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    try:
        with urllib.request.urlopen(req) as response:
            return {"status": response.status}
    except Exception as e:
        return {"error": str(e)}

def patch_data(endpoint, data):
    url = f"{supabase_url}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, method="PATCH", data=json.dumps(data).encode())
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    try:
        with urllib.request.urlopen(req) as response:
            return {"status": response.status}
    except Exception as e:
        return {"error": str(e)}

def reprocess_order(order_id):
    print(f"--- Reprocessing Order {order_id} ---")
    
    safe_order_id = urllib.parse.quote(order_id)
    
    # 1. Delete existing commissions
    print(f"Deleting commissions for {order_id} (encoded: {safe_order_id})...")
    del_res = delete_data(f"commissions?order_id=eq.{safe_order_id}")
    print(f"Delete Result: {del_res}")
    
    # 2. Toggle status to Pendente
    print(f"Setting status to Pendente...")
    patch_res1 = patch_data(f"orders?id=eq.{safe_order_id}", {"status": "Pendente"})
    print(f"Patch-1 Result: {patch_res1}")
    
    # 3. Toggle status back to Pago
    print(f"Setting status back to Pago...")
    patch_res2 = patch_data(f"orders?id=eq.{safe_order_id}", {"status": "Pago"})
    print(f"Patch-2 Result: {patch_res2}")

# Let's target the specific order from the screenshot
order_to_fix = "#ORD-8233"
reprocess_order(order_to_fix)
