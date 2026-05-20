import requests
import json

url = "https://clnuievcdnbwqbyqhwys.supabase.co/rest/v1/"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

def get_triggers():
    # We can use information_schema.triggers
    # But we need an execute_sql RPC or similar.
    # Since I don't know if there's one, I'll try to find any existing RPC that might help.
    # Or I can try to use the 'rest' API to query information_schema if enabled (usually not).
    
    # Let's try to query information_schema.triggers via REST (might not work)
    resp = requests.get(f"{url}rpc/execute_sql", headers=headers, json={"query": "SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'orders'"})
    # Wait, 'execute_sql' is likely not a standard Supabase RPC.
    # I'll check if I can find any SQL files that define triggers.
    pass

# Instead of querying, let's just assume the error is in the 'distribute_commissions' function
# and look for ALL occurrences of 'id' being accessed on a config row.

print("Done.")
