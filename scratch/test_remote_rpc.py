from supabase import create_client, Client
import sys

def test_rpc():
    url = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"
    
    supabase: Client = create_client(url, anon_key)
    try:
        print("Logging in as admin...")
        auth_res = supabase.auth.sign_in_with_password({
            "email": "admin@seuclube.com",
            "password": "SenhaAdmin123!"
        })
        print("Login successful! Token:")
        print(auth_res.session.access_token[:30] + "...")
        
        # Try calling execute_sql_query or similar RPC
        print("Calling execute_sql_query RPC...")
        res = supabase.rpc("execute_sql_query", {"sql_query": "SELECT current_database();"}).execute()
        print("Result:")
        print(res.data)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

if __name__ == "__main__":
    test_rpc()
