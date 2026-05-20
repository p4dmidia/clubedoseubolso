import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.environ.get('VITE_SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = create_client(url, key)

tables_to_check = ['orders', 'commissions', 'affiliates', 'user_settings', 'commission_configs']

for table in tables_to_check:
    try:
        # Check columns via a simple select of one row
        res = supabase.table(table).select('*').limit(1).execute()
        if len(res.data) > 0:
            columns = res.data[0].keys()
            print(f"Table '{table}' columns: {list(columns)}")
            if 'organization_id' in columns:
                print(f"  - organization_id EXISTS in {table}")
            else:
                print(f"  - organization_id MISSING in {table} <!!!")
        else:
            print(f"Table '{table}' is empty, cannot check columns via select *. Trying RPC or direct query...")
            # Fallback to a trick: select a non-existent column to see error message or similar
            try:
                supabase.table(table).select('organization_id').limit(1).execute()
                print(f"  - organization_id EXISTS in {table}")
            except Exception as e:
                if "column" in str(e) and "does not exist" in str(e):
                    print(f"  - organization_id MISSING in {table} <!!!")
                else:
                    print(f"  - Could not determine for {table}: {e}")
    except Exception as e:
        print(f"Error checking table '{table}': {e}")
