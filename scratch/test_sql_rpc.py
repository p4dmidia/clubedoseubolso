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

print("--- TRYING exec_sql ---")
print(run_rpc("exec_sql", {"query": "SELECT 1"}))

print("\n--- TRYING execute_sql ---")
print(run_rpc("execute_sql", {"query": "SELECT 1"}))
