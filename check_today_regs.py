import urllib.request
import json
import ssl
from datetime import datetime

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_all_today(table):
    today = datetime.utcnow().strftime('%Y-%m-%d')
    url = f"{supabase_url}/rest/v1/{table}?created_at=gte.{today}&select=id,email,created_at&order=created_at.desc"
    
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": str(e)}

print("--- Profiles Created Today ---")
profiles = get_all_today("user_profiles")
print(json.dumps(profiles, indent=2))

print("\n--- Affiliates Created Today ---")
affs = get_all_today("affiliates")
print(json.dumps(affs, indent=2))
