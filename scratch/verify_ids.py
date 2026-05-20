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

print("--- SEARCHING FOR SPONSOR AFFILIATE ffab0c91-8110-4a87-8d79-50d71b631af2 ---")
aff = query_table("affiliates", "id=eq.ffab0c91-8110-4a87-8d79-50d71b631af2")
print(json.dumps(aff, indent=2))

print("\n--- SEARCHING FOR SPONSOR USER b95451a8-7ed5-431a-8514-741fc95562f6 ---")
profile = query_table("user_profiles", "id=eq.b95451a8-7ed5-431a-8514-741fc95562f6")
print(json.dumps(profile, indent=2))
