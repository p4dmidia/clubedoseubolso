
import urllib.request
import json
import urllib.error

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def try_update(order_id):
    url = f"{supabase_url}/rest/v1/orders?id=eq.{order_id.replace('#', '%23')}"
    payload = {
        "status": "Pago",
        "payment_status": "paid",
        "payment_status_detail": "Accreditated Manual (Deep Diagnose)"
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), method="PATCH")
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"SUCCESS for {order_id}: {response.read().decode()}")
    except urllib.error.HTTPError as e:
        print(f"!!! ERROR for {order_id} !!!")
        print(f"Status: {e.code}")
        print(f"Body: {e.read().decode()}")
    except Exception as e:
        print(f"Exception for {order_id}: {str(e)}")

# Test with various formats from the audit
try_update("#ORD-7341")
try_update("ORD-6414")
# Also try a really new one
try_update("#ORD-7640")
