import urllib.request
import json

def get_products():
    env_path = r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso\.env.local"
    env_vars = {}
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env_vars[k] = v

    supabase_url = env_vars.get('VITE_SUPABASE_URL')
    key = env_vars.get('VITE_SUPABASE_ANON_KEY')

    url = f"{supabase_url}/rest/v1/products?select=id,name,price&limit=50"
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("=== Products ===")
            for p in data:
                print(f"ID: {p['id']} | Name: {p['name']} | Price: {p['price']}")
    except urllib.error.HTTPError as e:
        print("Error fetching products:", e.code, e.read().decode('utf-8'))
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    get_products()
