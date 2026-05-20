import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def query(table, params=""):
    url = f"{supabase_url}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url)
    req.add_header("apikey", service_key)
    req.add_header("Authorization", f"Bearer {service_key}")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return str(e)

# Find user by email
data = query("user_profiles", "email=eq.classea@admin.com&select=id,full_name,email,role,organization_id")
print("User Profile Information:")
print(json.dumps(data, indent=2))

# Also check other admins in that organization
if isinstance(data, list) and len(data) > 0:
    org_id = data[0].get('organization_id')
    print(f"\nSearching for other admins in organization: {org_id}")
    admins = query("user_profiles", f"organization_id=eq.{org_id}&role=eq.admin&select=id,full_name,email,role")
    print(json.dumps(admins, indent=2))
else:
    print("\nUser not found in user_profiles by email.")
    # Try searching for ANY user with 'classea' in email
    print("\nSearching for any user with 'classea' in email:")
    any_user = query("user_profiles", "email=ilike.*classea*&select=id,full_name,email,role,organization_id")
    print(json.dumps(any_user, indent=2))
