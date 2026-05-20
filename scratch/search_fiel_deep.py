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
        return f"Error: {str(e)}"

email = "fiel016@gmail.com"
print(f"Searching for all profiles with email: {email}")
data = query("user_profiles", f"email=eq.{email}&select=*")
print(json.dumps(data, indent=2))

if data:
    for profile in data:
        user_id = profile['id']
        print(f"\nChecking affiliate record for user_id: {user_id}")
        affiliate = query("affiliates", f"user_id=eq.{user_id}&select=*")
        print(json.dumps(affiliate, indent=2))
else:
    print("No profile found with that email exactly.")
    # Try ilike
    print(f"Searching with ilike for email: {email}")
    data = query("user_profiles", f"email=ilike.{email}&select=*")
    print(json.dumps(data, indent=2))
