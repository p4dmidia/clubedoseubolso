import urllib.request
import json

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

prods = get_data("products?select=is_active,organization_id")
if isinstance(prods, list):
    count_total = len(prods)
    count_active = sum(1 for p in prods if p.get('is_active') == True)
    count_classea = sum(1 for p in prods if p.get('organization_id') == '5111af72-27a5-41fd-8ed9-8c51b78b4fdd')
    count_active_classea = sum(1 for p in prods if p.get('is_active') == True and p.get('organization_id') == '5111af72-27a5-41fd-8ed9-8c51b78b4fdd')
    
    print(f"Total Products: {count_total}")
    print(f"Total Active: {count_active}")
    print(f"Total Classe A: {count_classea}")
    print(f"Active Classe A: {count_active_classea}")
else:
    print(prods)
