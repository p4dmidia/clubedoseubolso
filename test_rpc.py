import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def execute_sql(query):
    url = f"{supabase_url}/rest/v1/rpc/proxy_sql" # Trying to see if there is a proxy rpc
    # Actually, standard REST API doesn't allow raw SQL unless there is a specific RPC for it.
    # Let's try to query information_schema via standard REST if possible, or just try to CALL the RPC.
    pass

# Or just test calling it
def call_rpc(name, params):
    url = f"{supabase_url}/rest/v1/rpc/{name}"
    data = json.dumps(params).encode()
    req = urllib.request.Request(url, data=data)
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": str(e)}

# Test with a known category ID (I saw some in debug_cats.py or previous logs)
# From previous logs: categories exist.
print("--- Testing get_category_descendants RPC ---")
res = call_rpc("get_category_descendants", {"root_id": 1}) # Testing with ID 1
print(res)
