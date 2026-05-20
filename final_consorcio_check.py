import urllib.request
import json
import base64

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_data(endpoint):
    url = f"{supabase_url}/rest/v1/{endpoint}"
    req = urllib.request.Request(url)
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return {"error": str(e)}

print("SEARCHING CATEGORIES:")
cats = get_data("product_categories?select=id,name")
if isinstance(cats, list):
    for c in cats:
        if "CONSORCIO" in c['name'].upper() or "CONSÓRCIO" in c['name'].upper():
            print(f"FOUND CAT: {c['id']} - {c['name']}")

print("\nSEARCHING PRODUCTS:")
prods = get_data("products?select=id,name&organization_id=eq.5111af72-27a5-41fd-8ed9-8c51b78b4fdd")
if isinstance(prods, list):
    for p in prods:
        if "CONSORCIO" in p['name'].upper() or "CONSÓRCIO" in p['name'].upper():
            print(f"FOUND PROD: {p['id']} - {p['name']}")
