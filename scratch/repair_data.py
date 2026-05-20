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

def update_table(table, data, params=""):
    url = f"{supabase_url}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), method='PATCH')
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return str(e)

def insert_table(table, data):
    url = f"{supabase_url}/rest/v1/{table}"
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), method='POST')
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return str(e)

print("--- FINDING ROOT AFFILIATE ---")
affs = query_table("affiliates", f"organization_id=eq.{org_id}&order=created_at.asc&limit=1")
if not affs:
    print("No affiliates found for this org!")
    exit()

root_aff = affs[0]
root_id = root_aff['id']
root_user_id = root_aff['user_id']
print(f"ROOT: {root_aff['email']} (ID: {root_id}, UserID: {root_user_id})")

print("\n--- FINDING ORPHAN USERS ---")
profiles = query_table("user_profiles", f"organization_id=eq.{org_id}")
for p in profiles:
    aff = query_table("affiliates", f"user_id=eq.{p['id']}&organization_id=eq.{org_id}")
    if not aff:
        print(f"CREATING MISSING AFFILIATE FOR: {p['email']} ({p['id']})")
        # Generate a random suffix for referral_code if needed
        import random
        import string
        suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
        login = p.get('login') or p['email'].split('@')[0]
        ref_code = f"{login}_{suffix}".lower()
        
        new_aff = {
            "user_id": p['id'],
            "organization_id": org_id,
            "email": p['email'],
            "full_name": p.get('full_name') or "Afiliado",
            "referral_code": ref_code,
            "sponsor_id": root_id, # Default to root
            "is_active": True,
            "is_verified": False
        }
        res = insert_table("affiliates", new_aff)
        print(f"  Result: {res}")

print("\n--- FIXING NULL SPONSOR IDs ---")
affs_to_fix = query_table("affiliates", f"organization_id=eq.{org_id}&sponsor_id=is.null")
for a in affs_to_fix:
    if a['id'] == root_id:
        print(f"Skipping root: {a['email']}")
        continue
    print(f"FIXING SPONSOR FOR: {a['email']} ({a['id']})")
    res = update_table("affiliates", {"sponsor_id": root_id}, f"id=eq.{a['id']}")
    print(f"  Result: {res}")
