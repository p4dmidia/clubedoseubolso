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

sponsor_user_id = "e28b269f-4e15-4c58-8b9c-2e0c1dd2e0a5"

print(f"--- SPONSOR USER ({sponsor_user_id}) ---")
sponsor = query_table("user_profiles", f"id=eq.{sponsor_user_id}")
print(json.dumps(sponsor, indent=2))

print(f"\n--- SPONSOR AFFILIATE RECORD ---")
aff = query_table("affiliates", f"user_id=eq.{sponsor_user_id}")
print(json.dumps(aff, indent=2))
