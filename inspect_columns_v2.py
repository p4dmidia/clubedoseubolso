import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_columns(table):
    url = f"{supabase_url}/rest/v1/{table}?limit=1"
    req = urllib.request.Request(url)
    req.add_header("apikey", service_key)
    req.add_header("Authorization", f"Bearer {service_key}")
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data:
                return list(data[0].keys())
            return "No data"
    except Exception as e:
        return str(e)

print("ORDERS:", get_columns("orders"))
print("CONSORTIUM_GROUPS:", get_columns("consortium_groups"))
print("CONSORTIUM_PARTICIPANTS:", get_columns("consortium_participants"))
