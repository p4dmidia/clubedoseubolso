import urllib.request
import json
import ssl
from datetime import datetime

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def list_auth_users():
    # Supabase Admin API for listing users
    url = f"{supabase_url}/auth/v1/admin/users?per_page=5"
    req = urllib.request.Request(url)
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": str(e)}

print("--- Recent Auth Users (Admin API) ---")
users_data = list_auth_users()
if "users" in users_data:
    for u in users_data["users"]:
        print(f"User: {u['email']} | Created: {u['created_at']} | ID: {u['id']}")
else:
    print(json.dumps(users_data, indent=2))
