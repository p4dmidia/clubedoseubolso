import urllib.request
import json
import urllib.parse

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json"
}

def search_products(term):
    url = f"{supabase_url}/rest/v1/products?name=ilike.*{urllib.parse.quote(term)}*&select=id,name,category_id"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            print(f"Results for '{term}':")
            for p in data:
                print(f"ID:{p['id']} NAME:{p['name']} CAT:{p['category_id']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    search_products("CLASSE A")
    search_products("HAIFLEX")
    search_products("CLASSIC")
    search_products("INTENSE")
