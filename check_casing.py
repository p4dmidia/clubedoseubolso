import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.environ.get('VITE_SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
supabase: Client = create_client(url, key)

def check_affiliates_casing():
    print(f"Connecting to {url}...")
    try:
        response = supabase.table('affiliates').select('id, full_name, email, referral_code').limit(10).execute()
        if response.data:
            print("Sample Affiliates Data:")
            for row in response.data:
                print(f"ID: {row['id']} | Name: {row['full_name']} | Code: {row['referral_code']}")
        else:
            print("No affiliates found or error.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_affiliates_casing()
