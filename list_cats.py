import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json"
}

def list_categories():
    url = f"{supabase_url}/rest/v1/product_categories?select=id,name,parent_id"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            for cat in data:
                print(f"{cat['id']}: {cat['name']} (Parent: {cat['parent_id']})")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_categories()
