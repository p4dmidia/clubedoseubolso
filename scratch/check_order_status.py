from supabase import create_client, Client
import sys

def check_status():
    url = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"
    
    supabase: Client = create_client(url, anon_key)
    try:
        supabase.auth.sign_in_with_password({
            "email": "admin@seuclube.com",
            "password": "SenhaAdmin123!"
        })
        res = supabase.table("orders").select("id, status, payment_status, payment_id").order("created_at", desc=True).limit(1).execute()
        if res.data:
            order = res.data[0]
            print(f"Pedido: {order['id']}")
            print(f"Status no Banco: {order['status']}")
            print(f"Status do Pagamento: {order['payment_status']}")
            print(f"ID do Pagamento: {order['payment_id']}")
        else:
            print("Nenhum pedido encontrado.")
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    check_status()
