import urllib.request
import json
import ssl

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def check_function():
    # We can try to query information_schema.routines
    url = f"{supabase_url}/rest/v1/rpc/proxy_sql" # Using proxy_sql if exists, else just standard query
    # Since I don't know if proxy_sql exists, I'll try to query information_schema directly
    url = f"{supabase_url}/rest/v1/"
    # Wait, PostgREST doesn't expose information_schema by default.
    # But I can try to call the function with dummy data and see the error.
    
    url = f"{supabase_url}/rest/v1/rpc/handle_new_affiliate_user"
    req = urllib.request.Request(url, method="POST")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            return "Function exists (returned success or 400 with bad data)"
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return "Function DOES NOT exist (404)"
        return f"Function exists? (returned {e.code}: {e.reason})"
    except Exception as e:
        return f"Error: {e}"

print(f"Check handle_new_affiliate_user: {check_function()}")
