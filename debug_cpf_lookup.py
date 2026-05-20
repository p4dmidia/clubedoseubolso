import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def debug_consortium():
    print("--- ULTIMOS PARTICIPANTES ---")
    res = supabase.table('consortium_participants').select('*').order('joined_at', desc=True).limit(5).execute()
    for row in res.data:
        print(f"ID: {row.get('id')} | CPF: '{row.get('customer_cpf')}' | Name: {row.get('customer_name')} | Joined: {row.get('joined_at')}")
    
    print("\n--- ULTIMOS PEDIDOS PAGO ---")
    res = supabase.table('orders').select('id, customer_cpf, status, created_at').eq('status', 'Pago').order('created_at', desc=True).limit(5).execute()
    for row in res.data:
        print(f"Order: {row.get('id')} | CPF: '{row.get('customer_cpf')}' | Status: {row.get('status')}")

if __name__ == "__main__":
    debug_consortium()
