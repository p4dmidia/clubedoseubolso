import urllib.request
import json

def test_columns():
    env_path = r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso\.env.local"
    env_vars = {}
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env_vars[k] = v

    supabase_url = env_vars.get('VITE_SUPABASE_URL')
    key = env_vars.get('VITE_SUPABASE_ANON_KEY')

    def test_col(table, col):
        url = f"{supabase_url}/rest/v1/{table}?select={col}&limit=1"
        req = urllib.request.Request(url)
        req.add_header("apikey", key)
        req.add_header("Authorization", f"Bearer {key}")
        try:
            with urllib.request.urlopen(req) as resp:
                resp.read()
                return "EXISTS"
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8')
            try:
                err_json = json.loads(err_msg)
                return f"ERROR: {err_json.get('message', err_msg)}"
            except:
                return f"ERROR: {e.code} - {err_msg}"
        except Exception as e:
            return f"ERROR: {str(e)}"

    columns_to_test = {
        "user_settings": ["bank_name", "bank_agency", "bank_account", "bank_account_type", "bank_document", "auto_renew_subscription", "pix_key"],
        "withdrawals": ["payment_method", "bank_name", "bank_agency", "bank_account", "bank_account_type", "bank_document", "pix_key"]
    }

    for table, cols in columns_to_test.items():
        print(f"Testing columns in {table}:")
        for col in cols:
            status = test_col(table, col)
            print(f"  {col}: {status}")

if __name__ == '__main__':
    test_columns()
