
import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_openapi():
    url = f"{supabase_url}/rest/v1/"
    req = urllib.request.Request(url)
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

spec = get_openapi()
with open("openapi_spec.json", "w", encoding="utf-8") as f:
    json.dump(spec, f, indent=2)

print("OpenAPI spec saved to openapi_spec.json")

# Now check specifically for organization_id in each table
tables = spec['definitions'].keys()
for table in tables:
    props = spec['definitions'][table].get('properties', {})
    if 'organization_id' in props:
        print(f"Table {table:20}: OK")
    else:
        print(f"Table {table:20}: MISSING organization_id")
