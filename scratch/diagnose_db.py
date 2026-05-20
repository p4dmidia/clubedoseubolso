import urllib.request
import json
import os

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

print("--- RECENT AFFILIATES (Last 5) ---")
# Get last 5 affiliates for this org
affs = query_table("affiliates", f"organization_id=eq.{org_id}&order=created_at.desc&limit=5")
print(json.dumps(affs, indent=2))

print("\n--- CHECKING IF ANY AFFILIATE HAS NULL SPONSOR_ID ---")
null_sponsors = query_table("affiliates", f"organization_id=eq.{org_id}&sponsor_id=is.null&order=created_at.desc&limit=5")
print(json.dumps(null_sponsors, indent=2))

print("\n--- CHECKING RECENT USER PROFILES ---")
# User profiles might not have org_id directly if it's shared, but let's check
profiles = query_table("user_profiles", "order=created_at.desc&limit=5")
print(json.dumps(profiles, indent=2))
