import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def run_rpc(name, params={}):
    url = f"{supabase_url}/rest/v1/rpc/{name}"
    req = urllib.request.Request(url, data=json.dumps(params).encode('utf-8'), method='POST')
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        return str(e)

# Try to find table info
print("--- TABLE INFO affiliates ---")
# I'll try to insert a dummy record and see the error to infer columns if needed, but I already know them.
# I want to know the CONSTRAINTS.

# Let's check if there's a debug log.
# I saw a debug_logs table in previous viewed files.
print("--- RECENT DEBUG LOGS ---")
def query_table(table, params=""):
    url = f"{supabase_url}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return str(e)

logs = query_table("debug_logs", "order=created_at.desc&limit=5")
print(json.dumps(logs, indent=2))
