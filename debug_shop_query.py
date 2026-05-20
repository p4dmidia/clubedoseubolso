import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE"

# Exact join query from ShopPage.tsx
# select=*,product_categories(id,name)
def get_data(endpoint):
    url = f"{supabase_url}/rest/v1/{endpoint}"
    req = urllib.request.Request(url)
    req.add_header("apikey", anon_key)
    req.add_header("Authorization", f"Bearer {anon_key}")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": str(e)}

print("--- Testing ShopPage Query ---")
query = "products?select=*,product_categories(id,name)&organization_id=eq.5111af72-27a5-41fd-8ed9-8c51b78b4fdd&limit=10"
prods = get_data(query)

if isinstance(prods, list):
    print(f"Products found: {len(prods)}")
    for p in prods:
        print(f"ID: {p['id']}, Name: {p['name']}, Category: {p.get('product_categories')}")
else:
    print(prods)
