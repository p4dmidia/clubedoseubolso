import os
import json
import requests

url = "https://clnuievcdnbwqbyqhwys.supabase.co/rest/v1/"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def check_table_columns(table_name):
    query = f"""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = '{table_name}' 
    AND table_schema = 'public';
    """
    rpc_url = f"{url}rpc/execute_sql" # Assuming there's an execute_sql rpc or similar
    # If not, I'll just try to fetch a row to see the columns
    
    # Let's try to fetch one row from orders
    resp = requests.get(f"{url}{table_name}?limit=1", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        if data:
            print(f"Columns for {table_name}: {list(data[0].keys())}")
        else:
            print(f"No data in {table_name}")
    else:
        print(f"Error fetching {table_name}: {resp.status_code} - {resp.text}")

print("Checking orders table...")
check_table_columns("orders")

print("\nChecking commissions table...")
check_table_columns("commissions")

print("\nChecking commission_configs table...")
check_table_columns("commission_configs")
