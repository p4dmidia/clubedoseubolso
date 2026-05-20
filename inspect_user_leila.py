import urllib.request
import json
import ssl

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_user_by_email(email):
    url = f"{supabase_url}/auth/v1/admin/users?per_page=10"
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

email_to_fix = "leila@gmail.com"
user = get_user_by_email(email_to_fix)
if user:
    print(json.dumps(user, indent=2))
else:
    print("User not found")
