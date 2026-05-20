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

email = "paulagoncalves@gmail.com"

print(f"--- INVESTIGATING USER {email} ---")
profile = query_table("user_profiles", f"email=eq.{email}")
print(f"PROFILE: {json.dumps(profile, indent=2)}")

if isinstance(profile, list) and len(profile) > 0:
    user_id = profile[0]['id']
    print(f"\n--- AFFILIATE RECORD FOR {user_id} ---")
    aff = query_table("affiliates", f"user_id=eq.{user_id}")
    print(json.dumps(aff, indent=2))
    
    # Try to find the auth user metadata
    print(f"\n--- AUTH USER METADATA ---")
    url = f"{supabase_url}/auth/v1/admin/users/{user_id}"
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(req) as response:
            print(json.dumps(json.loads(response.read().decode('utf-8')), indent=2))
    except Exception as e:
        print(f"Auth error: {e}")
else:
    print("User profile not found.")
