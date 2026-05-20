import urllib.request
import json

SUPABASE_URL = "https://clnuievcdnbwqbyqhwys.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def query_rest(path):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode())
    except Exception as e:
        return {"error": str(e)}

results = {}

# 1. Check all columns of user_profiles
results["profiles_cols"] = query_rest("user_profiles?select=*&limit=1")

# 2. Check all columns of affiliates
results["affiliates_cols"] = query_rest("affiliates?select=*&limit=1")

# 3. Check for specific sponsor
results["sponsor_check"] = query_rest("affiliates?referral_code=ieq.leonardo456&select=id,user_id,referral_code,organization_id")

# 4. Check for latest debug logs (more than 10)
results["latest_logs"] = query_rest("debug_logs?order=created_at.desc&limit=20")

print(json.dumps(results, indent=2))
