import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get(path):
    req = urllib.request.Request(f"{supabase_url}/rest/v1/{path}")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    return json.loads(urllib.request.urlopen(req).read().decode('utf-8'))

org = "5111af72-27a5-41fd-8ed9-8c51b78b4fdd"

def fetch_child_ids(parent_id):
    # This simulates the logic in ShopPage.tsx
    children = get(f"product_categories?select=id&parent_id=eq.{parent_id}&organization_id=eq.{org}")
    ids = [parent_id]
    if children:
        for child in children:
            ids.extend(fetch_child_ids(child['id']))
    return ids

print("--- Testing ID 19 (CALÇADO MASCULINO) ---")
ids_19 = fetch_child_ids(19)
print(f"IDs for 19: {ids_19}")

print("\n--- Testing ID 29 (CALÇADOS - FEMININO?) ---")
ids_29 = fetch_child_ids(29)
print(f"IDs for 29: {ids_29}")

print("\n--- PRODUCTS FOR THESE IDS ---")
prods = get(f"products?select=id,category_id&organization_id=eq.{org}")
prods_19 = [p for p in prods if p['category_id'] in ids_19]
print(f"Products for ID 19 branch: {len(prods_19)}")

prods_29 = [p for p in prods if p['category_id'] in ids_29]
print(f"Products for ID 29 branch: {len(prods_29)}")
