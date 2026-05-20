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
cats = get(f"product_categories?select=id,name,parent_id&organization_id=eq.{org}")
prods = get(f"products?select=id,category_id&organization_id=eq.{org}")

cat_map = {c['id']: c['name'] for c in cats}
counts = {}
for p in prods:
    cid = p['category_id']
    counts[cid] = counts.get(cid, 0) + 1

print("--- CATS ---")
for c in sorted(cats, key=lambda x: x['name']):
    cnt = counts.get(c['id'], 0)
    print(f"[{c['id']}] {c['name']} (Parent: {c['parent_id']}) -> {cnt} products")
