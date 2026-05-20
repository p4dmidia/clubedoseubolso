import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"
org_id = "5111af72-27a5-41fd-8ed9-8c51b78b4fdd"

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

print("--- USERS IN USER_PROFILES FOR THIS ORG ---")
profiles = query_table("user_profiles", f"organization_id=eq.{org_id}&select=id,email,full_name&order=created_at.desc&limit=10")
profile_ids = [p['id'] for p in profiles]

print("\n--- CHECKING IF THEY HAVE AFFILIATES ENTRY ---")
for pid in profile_ids:
    aff = query_table("affiliates", f"user_id=eq.{pid}&organization_id=eq.{org_id}")
    email = next(p['email'] for p in profiles if p['id'] == pid)
    if not aff:
        print(f"MISSING AFFILIATE: {email} ({pid})")
    else:
        print(f"FOUND AFFILIATE: {email} ({pid}) -> Sponsor: {aff[0].get('sponsor_id')}")

print("\n--- CHECKING AFFILIATES FOR THIS ORG ---")
affs = query_table("affiliates", f"organization_id=eq.{org_id}&order=created_at.desc&limit=10")
for a in affs:
    print(f"AFFILIATE: {a['email']} ({a['user_id']}) -> Sponsor: {a.get('sponsor_id')}")
