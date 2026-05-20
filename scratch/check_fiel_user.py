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
print(f"Checking user_profiles for {email}...")
data = query("user_profiles", f"email={email}&select=*")
print(json.dumps(data, indent=2))

print("\nChecking for any user_profiles with that login (if login is different)...")
# Since I don't know the login, I'll just check if there are recent profiles
recent = query("user_profiles", "order=created_at.desc&limit=5")
print("\nRecent profiles:")
print(json.dumps(recent, indent=2))
