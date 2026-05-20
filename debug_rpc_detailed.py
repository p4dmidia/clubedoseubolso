import urllib.request
import json
import ssl

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def call_rpc(name, params):
    url = f"{supabase_url}/rest/v1/rpc/{name}"
    data = json.dumps(params).encode()
    req = urllib.request.Request(url, data=data)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": str(e)}

print("--- Testing get_category_descendants variations ---")

# Try with root_id (int)
print(f"root_id (int 49): {call_rpc('get_category_descendants', {'root_id': 49})}")

# Try with p_root_id (int)
print(f"p_root_id (int 49): {call_rpc('get_category_descendants', {'p_root_id': 49})}")

# Try with root_id (string)
print(f"root_id (str '49'): {call_rpc('get_category_descendants', {'root_id': '49'})}")

# Try with root_id in a different name? 
# Maybe getting the list of all rpcs?
# rpc/info doesn't exist.

# Let's try to see if category 49 exists first
url = f"{supabase_url}/rest/v1/product_categories?id=eq.49&select=id,name"
req = urllib.request.Request(url)
req.add_header("apikey", key)
req.add_header("Authorization", f"Bearer {key}")
try:
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(req, context=context) as response:
        print(f"Category 49 check: {response.read().decode()}")
except Exception as e:
    print(f"Category 49 check failed: {e}")
