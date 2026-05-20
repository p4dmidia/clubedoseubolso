import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def query_table(table, params=""):
    url = f"{supabase_url}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return str(e)

bella_id = "512f9aeb-683a-49c0-9731-76a7c8d10e8d"

print(f"--- RECENT USERS FOR BELLA SOUSA ({bella_id}) ---")
users = query_table("user_profiles", f"organization_id=eq.{bella_id}&order=created_at.desc&limit=3")
print(json.dumps(users, indent=2))

print(f"\n--- RECENT AFFILIATES FOR BELLA SOUSA ({bella_id}) ---")
affs = query_table("affiliates", f"organization_id=eq.{bella_id}&order=created_at.desc&limit=3")
print(json.dumps(affs, indent=2))
