import urllib.request
import json

def check():
    env_path = r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso\.env.local"
    env_vars = {}
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env_vars[k] = v

    supabase_url = env_vars.get('VITE_SUPABASE_URL')
    key = env_vars.get('VITE_SUPABASE_ANON_KEY')

    url = f"{supabase_url}/rest/v1/"
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(req) as resp:
            swagger = json.loads(resp.read().decode('utf-8'))
            definitions = swagger.get('definitions', {})
            
            for table in ['user_settings', 'withdrawals']:
                if table in definitions:
                    print(f"--- Columns in {table} ---")
                    props = definitions[table].get('properties', {})
                    for col, detail in props.items():
                        print(f"  {col}: {detail.get('type')} ({detail.get('description', '')})")
                else:
                    print(f"Table {table} not found in definitions")
    except Exception as e:
        print("Error fetching schema:", e)

if __name__ == '__main__':
    check()
