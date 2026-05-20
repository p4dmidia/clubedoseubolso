import urllib.request
import json
import ssl

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_count(cat_id):
    url = f"{supabase_url}/rest/v1/products?category_id=eq.{cat_id}&select=id"
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            data = json.loads(response.read().decode('utf-8'))
            return len(data)
    except Exception as e:
        return f"Error: {e}"

print("--- Product Counts by Category ---")
print(f"COLCHÕES TERAPÊUTICOS (54): {get_count(54)}")
print(f"HAIFLEX (56): {get_count(56)}")
print(f"CLASSE A (55): {get_count(55)}")
