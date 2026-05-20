
import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_keys(table):
    url = f"{supabase_url}/rest/v1/{table}?limit=1"
    req = urllib.request.Request(url)
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if data and isinstance(data, list):
                return list(data[0].keys())
            return []
    except Exception as e:
        return [f"Error: {str(e)}"]

print(f"Commissions: {get_keys('commissions')}")
print(f"User Settings: {get_keys('user_settings')}")
print(f"Affiliates: {get_keys('affiliates')}")
print(f"Orders: {get_keys('orders')}")
