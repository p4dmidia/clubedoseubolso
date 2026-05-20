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

with open("db_content.txt", "w", encoding="utf-8") as f:
    f.write("--- Organizations ---\n")
    f.write(json.dumps(get_data("organizations"), indent=2) + "\n\n")

    f.write("--- Products ---\n")
    prods = get_data("products?select=id,name,organization_id")
    f.write(f"Count: {len(prods) if isinstance(prods, list) else 'Error'}\n")
    f.write(json.dumps(prods, indent=2) + "\n\n")

    f.write("--- Categories ---\n")
    cats = get_data("product_categories?select=id,name,organization_id")
    f.write(f"Count: {len(cats) if isinstance(cats, list) else 'Error'}\n")
    f.write(json.dumps(cats, indent=2) + "\n\n")
