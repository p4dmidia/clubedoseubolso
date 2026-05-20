import urllib.request
import json
import ssl
import sys

# Get config from .env.local via some simple parsing or hardcode since I know it
supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def run_query(sql):
    url = f"{supabase_url}/rest/v1/rpc/execute_sql" # Hope this RPC exists, if not we use REST tables
    # If execute_sql RPC doesn't exist, we'll just check tables directly
    pass

def get_table_data(table, select="*", order="created_at.desc", limit=5):
    url = f"{supabase_url}/rest/v1/{table}?select={select}&order={order}&limit={limit}"
    req = urllib.request.Request(url)
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": f"Table {table}: {str(e)}"}

with open('diag_output.json', 'w', encoding='utf-8') as f:
    results = {}
    
    results["orgs"] = get_table_data("organizations", select="id,name")
    results["profiles"] = get_table_data("user_profiles", limit=20)
    results["affiliates"] = get_table_data("affiliates", limit=20)
    results["debug_logs"] = get_table_data("debug_logs", limit=20)
    
    json.dump(results, f, indent=2)

print("Diagnostics written to diag_output.json")
