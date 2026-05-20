import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_rpc_list():
    # We can try to query information_schema.routines via a generic query if we had one.
    # Since we don't, we can try to "peek" via documentation or common patterns.
    # Alternatively, let's try to just CHECK if the specific one exists with different param names.
    pass

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

print("--- Testing get_category_descendants with variations ---")
res1 = call_rpc("get_category_descendants", {"root_id": 1})
print(f"root_id: {res1}")
res2 = call_rpc("get_category_descendants", {"p_root_id": 1})
print(f"p_root_id: {res2}")
