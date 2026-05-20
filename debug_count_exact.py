import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE"

def get_data(endpoint):
    url = f"{supabase_url}/rest/v1/{endpoint}"
    req = urllib.request.Request(url)
    req.add_header("apikey", anon_key)
    req.add_header("Authorization", f"Bearer {anon_key}")
    req.add_header("Prefer", "count=exact")
    try:
        with urllib.request.urlopen(req) as response:
            count = response.headers.get("Content-Range")
            data = json.loads(response.read().decode())
            return {"data": data, "count": count}
    except Exception as e:
        return {"error": str(e)}

print("--- Testing ShopPage Query with Count ---")
query = "products?select=*,product_categories(id,name)&organization_id=eq.5111af72-27a5-41fd-8ed9-8c51b78b4fdd&limit=10"
res = get_data(query)

if "error" not in res:
    print(f"Count Header: {res['count']}")
    print(f"Data length: {len(res['data'])}")
else:
    print(res)
