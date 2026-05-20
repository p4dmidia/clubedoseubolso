import os
from supabase import create_client, Client

def list_orgs():
    url = "https://clnuievcdnbwqbyqhwys.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"
    
    supabase: Client = create_client(url, key)
    
    try:
        response = supabase.table('organizations').select('id, name').execute()
        print(response.data)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_orgs()
