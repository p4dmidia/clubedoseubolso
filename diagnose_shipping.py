import os
import requests
from dotenv import load_dotenv

load_dotenv('.env.local')

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("ERRO: Variáveis de ambiente do Supabase não encontradas.")
    exit(1)

def check_products():
    print("--- Verificando Produtos no Banco de Dados ---")
    headers = {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Pegar os primeiros 10 produtos para verificar dimensões
    url = f"{SUPABASE_URL}/rest/v1/products?select=id,name,weight,length,width,height,origin_zip,price&limit=10"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        products = response.json()
        for p in products:
            print(f"ID: {p['id']} | Nome: {p['name']} | Frete: {p.get('weight')}kg, {p.get('length')}x{p.get('width')}x{p.get('height')} cm | Origem: {p.get('origin_zip')}")
            if not p.get('weight') or not p.get('length') or not p.get('width') or not p.get('height'):
                print(f"  [AVISO] Produto {p['id']} está com dimensões incompletas!")
        return products
    else:
        print(f"ERRO ao buscar produtos: {response.text}")
        return []

def test_shipping_function(zip_code, items):
    print(f"\n--- Testando Função calculate-shipping para CEP {zip_code} ---")
    url = f"{SUPABASE_URL}/functions/v1/calculate-shipping"
    headers = {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json'
    }
    body = {
        "zip": zip_code,
        "items": items
    }
    
    response = requests.post(url, headers=headers, json=body)
    print(f"Satus: {response.status_code}")
    print(f"Resposta: {response.text}")

if __name__ == "__main__":
    products = check_products()
    if products:
        # Testar com o primeiro produto encontrado
        test_items = [{"id": products[0]['id'], "quantity": 1}]
        # Testar com um CEP válido (exemplo: Curitiba)
        test_shipping_function("80010-010", test_items)
    else:
        print("Nenhum produto encontrado para testar.")
