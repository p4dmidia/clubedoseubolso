import urllib.request
import json
import ssl

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_user_by_email(email):
    url = f"{supabase_url}/auth/v1/admin/users?per_page=5"
    req = urllib.request.Request(url)
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            users = json.loads(response.read().decode())["users"]
            for u in users:
                if u["email"] == email:
                    return u
    except Exception as e:
        print(f"Error fetching user: {e}")
    return None

def force_insert(table, data):
    url = f"{supabase_url}/rest/v1/{table}"
    req = urllib.request.Request(url, data=json.dumps(data).encode(), method="POST")
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    req.add_header("Content-Type", "application/json")
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            return "Success"
    except Exception as e:
        return f"Error inserting into {table}: {e}"

email_to_fix = "leila@gmail.com"
user = get_user_by_email(email_to_fix)

if user:
    uid = user["id"]
    meta = user["raw_user_meta_data"]
    org_id = meta.get("organization_id")
    
    # Defaults
    if not org_id:
        org_id = "5111af72-27a5-41fd-8ed9-8c51b78b4fdd" # Classe A ID
    
    full_name = f"{meta.get('nome', '')} {meta.get('sobrenome', '')}".strip() or "Novo Afiliado"
    
    # 1. Profile
    print(f"Fixing Profile: {force_insert('user_profiles', {'id': uid, 'email': email_to_fix, 'organization_id': org_id})}")
    
    # 2. Affiliate
    # First resolve sponsor_id if sponsor_code exists
    sponsor_id = None
    sponsor_code = meta.get("sponsor_code")
    if sponsor_code:
        # Simple lookup via REST
        url = f"{supabase_url}/rest/v1/affiliates?referral_code=eq.{sponsor_code}&organization_id=eq.{org_id}&select=id"
        req = urllib.request.Request(url)
        req.add_header("apikey", service_role_key)
        req.add_header("Authorization", f"Bearer {service_role_key}")
        try:
            with urllib.request.urlopen(req, context=ssl._create_unverified_context()) as resp:
                data = json.loads(resp.read().decode())
                if data:
                    sponsor_id = data[0]["id"]
        except: pass

    print(f"Fixing Affiliate: {force_insert('affiliates', {
        'user_id': uid,
        'email': email_to_fix,
        'full_name': full_name,
        'referral_code': meta.get('login'),
        'sponsor_id': sponsor_id,
        'organization_id': org_id
    })}")
    
    # 3. Settings
    print(f"Fixing Settings: {force_insert('user_settings', {'user_id': uid, 'organization_id': org_id})}")
else:
    print(f"User {email_to_fix} not found in Auth.")
