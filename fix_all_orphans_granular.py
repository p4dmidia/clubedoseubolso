import urllib.request
import json
import ssl
from datetime import datetime, timedelta

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_recent_users():
    url = f"{supabase_url}/auth/v1/admin/users?per_page=20"
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            return json.loads(response.read().decode())["users"]
    except Exception as e:
        print(f"Error fetching users: {e}")
    return []

def force_insert(table, data):
    url = f"{supabase_url}/rest/v1/{table}"
    req = urllib.request.Request(url, data=json.dumps(data).encode(), method="POST")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=merge-duplicates") 
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            return "Success"
    except Exception as e:
        return f"Error: {e}"

def exists(table, filter_col, value):
    url = f"{supabase_url}/rest/v1/{table}?{filter_col}=eq.{value}&select=*"
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            data = json.loads(response.read().decode())
            return data[0] if data else None
    except: return None

# check everything since today
today_utc = datetime.utcnow().strftime('%Y-%m-%d')
users = get_recent_users()

print(f"Analyzing all recent registrations since {today_utc}...")

for u in users:
    email = u['email']
    uid = u['id']
    meta = u.get('user_metadata') or u.get('raw_user_meta_data') or {}
    org_id = meta.get("organization_id") or "5111af72-27a5-41fd-8ed9-8c51b78b4fdd"
    full_name = f"{meta.get('nome', '')} {meta.get('sobrenome', '')}".strip() or "Novo Afiliado"
    
    print(f"\nUser: {email} ({uid})")
    
    # 1. Profile
    if not exists('user_profiles', 'id', uid):
        print(f" - Creating Profile: {force_insert('user_profiles', {'id': uid, 'email': email, 'organization_id': org_id})}")
    else:
        print(" - Profile already exists.")

    # 2. Affiliate
    if not exists('affiliates', 'user_id', uid):
        sponsor_id = None
        sponsor_code = meta.get("sponsor_code")
        if sponsor_code:
            s_data = exists('affiliates', 'referral_code', sponsor_code)
            if s_data: sponsor_id = s_data['id']
            
        print(f" - Creating Affiliate: {force_insert('affiliates', {
            'user_id': uid,
            'email': email,
            'full_name': full_name,
            'referral_code': meta.get('login') or email.split('@')[0],
            'sponsor_id': sponsor_id,
            'organization_id': org_id
        })}")
    else:
        print(" - Affiliate already exists.")

    # 3. Settings
    if not exists('user_settings', 'user_id', uid):
        print(f" - Creating Settings: {force_insert('user_settings', {'user_id': uid, 'organization_id': org_id})}")
    else:
        print(" - Settings already exist.")
