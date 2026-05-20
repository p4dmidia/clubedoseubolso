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
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return {"error": str(e)}

org_id = "5111af72-27a5-41fd-8ed9-8c51b78b4fdd"

print("--- CATEGORY ANALYSIS ---")
cats = get_data(f"product_categories?select=id,name,parent_id&organization_id=eq.{org_id}")
if "error" in cats:
    print(f"Error fetching categories: {cats['error']}")
else:
    print(f"Total categories: {len(cats)}")
    cat_map = {c['id']: c for c in cats}
    roots = [c for c in cats if c['parent_id'] is None]
    print(f"Root categories: {[c['name'] for c in roots]}")

print("\n--- PRODUCT DISTRIBUTION BY CATEGORY ---")
# Get product counts by category_id directly from the database if possible
# Since we don't have GROUP BY in REST easily, we'll fetch products and count manually
# (Fetching only id, category_id, name to save bandwidth)
prods = get_data(f"products?select=id,category_id,organization_id&organization_id=eq.{org_id}")
if "error" in prods:
    print(f"Error fetching products: {prods['error']}")
else:
    print(f"Total products: {len(prods)}")
    dist = {}
    for p in prods:
        cid = p['category_id']
        dist[cid] = dist.get(cid, 0) + 1
    
    for cid, count in sorted(dist.items(), key=lambda x: x[1], reverse=True):
        cat_name = cat_map.get(cid, {}).get('name', 'UNKNOWN')
        print(f"Cat ID {cid} ({cat_name}): {count} products")

print("\n--- CHECKING FOR PRODUCTS WITH NO CATEGORY ---")
no_cat = [p for p in prods if p['category_id'] is None]
print(f"Products with no category: {len(no_cat)}")
