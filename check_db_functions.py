import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def execute_sql(query):
    # PostgREST doesn't support raw SQL easily unless we have an RPC
    # But we can try to find functions via information_schema
    url = f"{supabase_url}/rest/v1/rpc/get_functions" # If it exists
    # Actually, let's just query information_schema via the REST API if permitted
    # PostgREST allows querying views
    url = f"{supabase_url}/rest/v1/rpc/query" # Some projects have a 'query' rpc for convenience (admin only)
    # If not, we can query information_schema.routines
    url = f"{supabase_url}/rest/v1/routines?select=routine_name,routine_definition&routine_schema=public"
    
    req = urllib.request.Request(url)
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": str(e)}

funcs = execute_sql("") # This might fail if 'routines' is not exposed
print(f"Functions: {json.dumps(funcs, indent=2)}")
