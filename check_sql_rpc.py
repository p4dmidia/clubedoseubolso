import urllib.request
import json
import ssl

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def check_rpc(name):
    url = f"{supabase_url}/rest/v1/rpc/{name}"
    req = urllib.request.Request(url, method="POST")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            return f"RPC {name} exists"
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return f"RPC {name} DOES NOT exist"
        return f"RPC {name} presence: {e.code}"
    except Exception as e:
        return str(e)

print(check_rpc("proxy_sql"))
print(check_rpc("exec_sql"))
