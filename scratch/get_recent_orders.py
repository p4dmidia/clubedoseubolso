from supabase import create_client, Client
import sys

def get_orders():
    url = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"
    
    supabase: Client = create_client(url, anon_key)
    try:
        supabase.auth.sign_in_with_password({
            "email": "admin@seuclube.com",
            "password": "SenhaAdmin123!"
        })
        
        res = supabase.table("orders").select("id, status, payment_method, total_amount, payment_id, referral_code, customer_email, customer_cpf").order("created_at", desc=True).limit(5).execute()
        print("--- RECENT ORDERS ---")
        for order in res.data:
            print(f"ID: {order['id']}")
            print(f"   Status: {order['status']}")
            print(f"   Total: R$ {order['total_amount']}")
            print(f"   Payment ID: {order['payment_id']}")
            print(f"   Referral Code: {order['referral_code']}")
            print(f"   Customer Email: {order['customer_email']}")
            print(f"   Customer CPF: {order['customer_cpf']}")
            print("-" * 30)
            
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    get_orders()
