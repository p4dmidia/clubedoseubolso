from supabase import create_client, Client
import sys

def test_insert():
    url = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"
    
    supabase: Client = create_client(url, key)
    try:
        # We try to insert as anonymous client (unauthenticated)
        # to test the INSERT policy on security_logs
        payload = {
            "user_email": "test_script@test.com",
            "ip_address": "127.0.0.1",
            "location": "Local Test",
            "device_info": "Python Script",
            "event_type": "login_failure",
            "status": "failure"
        }
        print("Attempting to insert log as anonymous...")
        response = supabase.table("security_logs").insert(payload).execute()
        print("Insert Success! Data inserted:")
        print(response.data)
        
    except Exception as e:
        print(f"Insert Failed! Error: {e}", file=sys.stderr)

if __name__ == "__main__":
    test_insert()
