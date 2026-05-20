import requests
import json

url = "https://clnuievcdnbwqbyqhwys.supabase.co/rest/v1/"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

def get_columns():
    # We can't query information_schema directly via REST easily unless we have an RPC
    # So I'll try to find an RPC that might exist, or I'll just fetch 1 row from each table
    # and infer columns from the keys. This is usually sufficient to check names and existence.
    
    tables = ['orders', 'order_items', 'affiliates', 'commission_configs', 'user_profiles', 'user_settings', 'commissions']
    schema = {}
    
    for table in tables:
        resp = requests.get(f"{url}{table}?limit=1", headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            if data:
                schema[table] = list(data[0].keys())
            else:
                schema[table] = "No data to infer columns"
        else:
            schema[table] = f"Error: {resp.status_code} - {resp.text}"
            
    return schema

print(json.dumps(get_columns(), indent=2))
