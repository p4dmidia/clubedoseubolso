from supabase import create_client, Client
import sys

def execute_query(query):
    url = "https://clnuievcdnbwqbyqhwys.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"
    
    supabase: Client = create_client(url, key)
    try:
        response = supabase.rpc('execute_sql_query', {'sql_query': query}).execute()
        print(response.data)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        execute_query(sys.argv[1])
    else:
        execute_query("SELECT 1 as test;")
