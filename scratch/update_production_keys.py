from supabase import create_client, Client
import sys

def update_production():
    url = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"
    
    supabase: Client = create_client(url, anon_key)
    try:
        print("Realizando login como admin...")
        supabase.auth.sign_in_with_password({
            "email": "admin@seuclube.com",
            "password": "SenhaAdmin123!"
        })
        
        print("Atualizando chaves de producao da organizacao...")
        res = supabase.table("organizations").update({
            "asaas_access_token": "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmIyYmJlNTZkLTA5NjMtNGM1ZS1hMTg4LWVlYTZjZDk1OWVmMjo6JGFhY2hfMzJmNGMzYjgtYTZiNS00MmFhLThmYzktOTdiZTU4ZmRlYjA5",
            "asaas_environment": "production"
        }).eq("id", "5111af72-27a5-41fd-8ed9-8c51b78b4fdd").execute()
        
        print("Resultado da atualizacao:")
        print(res.data)
        
    except Exception as e:
        print(f"Erro: {e}", file=sys.stderr)

if __name__ == "__main__":
    update_production()
