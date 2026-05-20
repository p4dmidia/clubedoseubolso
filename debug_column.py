import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.environ.get('VITE_SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = create_client(url, key)

try:
    # Try to select first row to see if organization_id exists
    res = supabase.table('orders').select('organization_id').limit(1).execute()
    print("Column organization_id exists in orders table.")
except Exception as e:
    print(f"Error: {e}")

try:
    # Check table structure via information_schema
    res = supabase.rpc('get_table_columns', {'table_name': 'orders'}).execute()
    print(f"Columns: {res.data}")
except Exception as e:
    print(f"RPC get_table_columns failed: {e}")
    
    # Try direct SQL if possible (though unlikely via client unless enabled)
    try:
        res = supabase.from_('information_schema.columns').select('column_name').eq('table_name', 'orders').execute()
        print(f"Columns from info_schema: {[r['column_name'] for r in res.data]}")
    except Exception as e2:
        print(f"Info schema query failed: {e2}")
