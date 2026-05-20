import urllib.request
import json
import ssl
from datetime import datetime, timedelta

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_data(table, select="*", count_only=False):
    url = f"{supabase_url}/rest/v1/{table}?select={select}"
    if count_only:
        req = urllib.request.Request(url, method="HEAD")
        req.add_header("Prefer", "count=exact")
    else:
        req = urllib.request.Request(url)
    
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            if count_only:
                return response.info().get("Content-Range")
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": str(e)}

# 1. Count profiles in last hour
one_hour_ago = (datetime.utcnow() - timedelta(hours=1)).isoformat()
print(f"One hour ago (UTC): {one_hour_ago}")

profiles = get_data("user_profiles", select="id,email,created_at")
if isinstance(profiles, list):
    recent_profiles = [p for p in profiles if p['created_at'] > one_hour_ago]
    print(f"Recent Profiles (last hour): {len(recent_profiles)}")
    for p in recent_profiles:
        print(f" - {p['email']} ({p['created_at']})")
else:
    print(f"Error fetching profiles: {profiles}")

# 2. Count affiliates in last hour
affs = get_data("affiliates", select="user_id,email,created_at")
if isinstance(affs, list):
    recent_affs = [a for a in affs if a['created_at'] > one_hour_ago]
    print(f"Recent Affiliates (last hour): {len(recent_affs)}")
    for a in recent_affs:
        print(f" - {a['email']} ({a['created_at']})")
else:
    print(f"Error fetching affiliates: {affs}")

# 3. Find Orphans
if isinstance(profiles, list) and isinstance(affs, list):
    aff_ids = set(a['user_id'] for a in affs)
    orphans = [p for p in profiles if p['id'] not in aff_ids]
    print(f"\nTotal Orphans (Profile without Affiliate): {len(orphans)}")
    for o in orphans[:5]:
        print(f" Orphan: {o['email']} (Created: {o['created_at']})")
