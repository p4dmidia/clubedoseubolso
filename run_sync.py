import urllib.request
import json
import ssl

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def patch_products(query, payload):
    url = f"{supabase_url}/rest/v1/products?{query}"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='PATCH')
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    
    try:
        # Create unverified context if needed (not recommended but sometimes necessary in local environments)
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            print(f"Updated {len(res_data)} products for {query}")
            return res_data
    except Exception as e:
        print(f"Error updating {query}: {e}")
        return None

# Mappings from all_categories.json
# 56: HAIFLEX (Parent 54: COLCHÕES TERAPÊUTICOS)
# 55: CLASSE A (Parent 54: COLCHÕES TERAPÊUTICOS)

print("--- Starting Product Sync ---")

# 1. Update HAIFLEX
# Filter: name contains HAIFLEX AND (category_id is 54 OR category_id is NULL)
patch_products("name=ilike.*HAIFLEX*&or=(category_id.eq.54,category_id.is.null)", {"category_id": 56})

# 2. Update CLASSE A
# Filter: name contains CLASSE A AND (category_id is 54 OR category_id is NULL)
patch_products("name=ilike.*CLASSE A*&or=(category_id.eq.54,category_id.is.null)", {"category_id": 55})

# 3. Update CLASSIC (if exists)
# Find CLASSIC ID first
# Based on all_categories.json it's not there, but it was in the SQL script. 
# I'll check if there's any other.

print("--- Sync Finished ---")
