from supabase import create_client, Client
import sys

def check_logs():
    url = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"
    
    supabase: Client = create_client(url, anon_key)
    try:
        supabase.auth.sign_in_with_password({
            "email": "admin@seuclube.com",
            "password": "SenhaAdmin123!"
        })
        
        # Query debug_logs
        print("--- DEBUG LOGS (Últimos 10) ---")
        res = supabase.table("debug_logs").select("*").order("created_at", desc=True).limit(10).execute()
        for log in res.data:
            print(f"[{log['created_at']}] {log['operation']} | {log['message']}")
            if log['metadata']:
                print(f"   Metadata: {log['metadata']}")

        print("\n--- SECURITY LOGS (Últimos 5) ---")
        res_sec = supabase.table("security_logs").select("*").order("created_at", desc=True).limit(5).execute()
        for log in res_sec.data:
            print(f"[{log['created_at']}] {log['event_type']} | {log['status']} | {log['user_email']}")

    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    check_logs()
