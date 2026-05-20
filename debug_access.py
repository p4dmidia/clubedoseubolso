import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_data(endpoint, key):
    url = f"{supabase_url}/rest/v1/{endpoint}"
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": str(e)}

print("--- Testing Products Access ---")
print("\n[ANON KEY]")
prods_anon = get_data("products?select=id,name,organization_id&limit=5", anon_key)
print(f"Count: {len(prods_anon) if isinstance(prods_anon, list) else 'Error'}")
if isinstance(prods_anon, list):
    for p in prods_anon:
        print(p)
else:
    print(prods_anon)

print("\n[SERVICE ROLE KEY]")
prods_sr = get_data("products?select=id,name,organization_id&limit=5", service_role_key)
print(f"Count: {len(prods_sr) if isinstance(prods_sr, list) else 'Error'}")
if isinstance(prods_sr, list):
    for p in prods_sr:
        print(p)

print("\n--- Testing Categories Access ---")
print("\n[ANON KEY]")
cats_anon = get_data("product_categories?select=id,name,organization_id&limit=5", anon_key)
print(f"Count: {len(cats_anon) if isinstance(cats_anon, list) else 'Error'}")
if isinstance(cats_anon, list):
    for c in cats_anon:
        print(c)
