from supabase import create_client, Client
import sys

def check_org():
    url = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"
    
    supabase: Client = create_client(url, key)
    try:
        # Query organizations
        res = supabase.table("organizations").select("*").execute()
        print("Organizations:")
        print(res.data)
    except Exception as e:
        print(f"Error querying organizations: {e}", file=sys.stderr)

if __name__ == "__main__":
    check_org()
