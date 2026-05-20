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
cats = get(f"product_categories?organization_id=eq.{org}")

print("--- CALCADOS CATEGORIES ---")
calcados_ids = []
for c in cats:
    if "CALÇADO" in c['name'].upper() or "CALCADO" in c['name'].upper():
        print(f"ID: {c['id']}, Name: {c['name']}, Parent: {c['parent_id']}")
        calcados_ids.append(c['id'])

print("\n--- PRODUCTS IN THESE CATEGORIES ---")
prods = get(f"products?select=id,name,category_id&organization_id=eq.{org}")
for pid in calcados_ids:
    p_count = len([p for p in prods if p['category_id'] == pid])
    print(f"Category {pid} has {p_count} products directly.")

print("\n--- SUB-CATEGORIES OF CALCADOS ---")
for pid in calcados_ids:
    subs = [c for c in cats if c['parent_id'] == pid]
    for s in subs:
        s_count = len([p for p in prods if p['category_id'] == s['id']])
        print(f"  Sub-Cat {s['id']}: {s['name']} -> {s_count} products")
