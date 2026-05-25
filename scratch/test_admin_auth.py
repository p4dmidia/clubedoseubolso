from supabase import create_client, Client
import sys

def test_admin():
    url = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"
    
    supabase: Client = create_client(url, key)
    try:
        # 1. Sign in as admin
        print("Logging in as admin@seuclube.com...")
        session_data = supabase.auth.sign_in_with_password({
            "email": "admin@seuclube.com",
            "password": "SenhaAdmin123!"
        })
        user = session_data.user
        print(f"Logged in successfully!")
        
        # Try to insert directly as authenticated user
        payload = {
            "user_email": "admin@seuclube.com",
            "ip_address": "127.0.0.1",
            "location": "Local Auth Test",
            "device_info": "Python Admin Test Script",
            "event_type": "login_success",
            "status": "success"
        }
        print("\nAttempting to insert log as authenticated admin...")
        response = supabase.table("security_logs").insert(payload).execute()
        print("Insert Success! Data inserted:")
        print(response.data)
        
        # 4. Query security_logs again
        print("\nQuerying security_logs...")
        logs = supabase.table("security_logs").select("*").order("created_at", desc=True).limit(5).execute()
        print(f"Logs returned ({len(logs.data)} rows):")
        for log in logs.data:
            print(log)
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

if __name__ == "__main__":
    test_admin()
