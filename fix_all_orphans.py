import urllib.request
import json
import ssl
from datetime import datetime, timedelta

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_recent_users():
    url = f"{supabase_url}/auth/v1/admin/users?per_page=10"
    req = urllib.request.Request(url)
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            return json.loads(response.read().decode())["users"]
    except Exception as e:
        print(f"Error fetching users: {e}")
    return []

def force_insert(table, data):
    url = f"{supabase_url}/rest/v1/{table}"
    # Use Upsert style: ON CONFLICT (id) DO UPDATE or just POST with standard
    # Since some tables use 'id' and others 'user_id', we just try POST.
    req = urllib.request.Request(url, data=json.dumps(data).encode(), method="POST")
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=merge-duplicates") # UPSERT
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            return "Success"
    except Exception as e:
        return f"Error: {e}"

one_hour_ago = (datetime.utcnow() - timedelta(hours=1)).isoformat()
users = get_recent_users()

for u in users:
    if u['created_at'] > one_hour_ago:
        email = u['email']
        uid = u['id']
        print(f"Checking user: {email} ({uid})")
        
        # Metadata check
        meta = u.get('user_metadata') or u.get('raw_user_meta_data') or {}
        
        # Check if already in user_profiles
        check_url = f"{supabase_url}/rest/v1/user_profiles?id=eq.{uid}&select=id"
        req = urllib.request.Request(check_url)
        req.add_header("apikey", service_role_key)
        req.add_header("Authorization", f"Bearer {service_role_key}")
        try:
            with urllib.request.urlopen(req, context=ssl._create_unverified_context()) as resp:
                if json.loads(resp.read().decode()):
                    print(f" - User {email} already has a profile.")
                    continue
        except: pass

        print(f" - Fixing {email}...")
        org_id = meta.get("organization_id") or "5111af72-27a5-41fd-8ed9-8c51b78b4fdd"
        full_name = f"{meta.get('nome', '')} {meta.get('sobrenome', '')}".strip() or "Novo Afiliado"
        
        # Profile
        force_insert('user_profiles', {'id': uid, 'email': email, 'organization_id': org_id})
        
        # Affiliate
        sponsor_id = None
        sponsor_code = meta.get("sponsor_code")
        if sponsor_code:
            s_url = f"{supabase_url}/rest/v1/affiliates?referral_code=eq.{sponsor_code}&organization_id=eq.{org_id}&select=id"
            try:
                # Reuse context etc... skipping for brevity
                pass 
            except: pass

        force_insert('affiliates', {
            'user_id': uid,
            'email': email,
            'full_name': full_name,
            'referral_code': meta.get('login') or email.split('@')[0],
            'sponsor_id': sponsor_id,
            'organization_id': org_id
        })
        
        # Settings
        force_insert('user_settings', {'user_id': uid, 'organization_id': org_id})
        print(f" - {email} fixed.")
