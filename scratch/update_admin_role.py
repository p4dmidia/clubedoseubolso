import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def update(table, params, data):
    url = f"{supabase_url}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), method='PATCH')
    req.add_header("apikey", service_key)
    req.add_header("Authorization", f"Bearer {service_key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return str(e)

# Update user role to admin
user_id = "aebe2000-71d9-46f8-b70f-ff887e034958"
result = update("user_profiles", f"id=eq.{user_id}", {"role": "admin"})

print("Update Result:")
print(json.dumps(result, indent=2))
