from supabase import create_client, Client
import sys

def check_rpc():
    url = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"
    
    supabase: Client = create_client(url, key)
    try:
        # Log in first
        print("Logging in...")
        supabase.auth.sign_in_with_password({
            "email": "admin@seuclube.com",
            "password": "SenhaAdmin123!"
        })
        print("Calling admin_create_user via RPC...")
        # Call function with invalid args or check
        res = supabase.rpc("admin_create_user", {
            "p_email": "test_rpc@test.com",
            "p_password": "Password123!",
            "p_role": "affiliate",
            "p_full_name": "Test RPC",
            "p_whatsapp": "11999999999",
            "p_cpf": "111.111.111-11",
            "p_cnpj": "",
            "p_login": "testrpc",
            "p_sponsor_code": ""
        }).execute()
        print("RPC Result:")
        print(res.data)
    except Exception as e:
        print(f"Error calling RPC: {e}", file=sys.stderr)

if __name__ == "__main__":
    check_rpc()
