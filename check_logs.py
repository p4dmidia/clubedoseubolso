import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.environ.get('VITE_SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
supabase: Client = create_client(url, key)

def check_debug_logs():
    print(f"Checking logs in {url}...")
    try:
        response = supabase.table('debug_logs').select('*').order('created_at', desc=True).limit(10).execute()
        if response.data:
            print("Recent Debug Logs:")
            for row in response.data:
                print(f"[{row['created_at']}] {row['operation']}: {row['message']}")
                if row['metadata']:
                    print(f"  Metadata: {row['metadata']}")
        else:
            print("No debug logs found.")
        
        # Also check the last few affiliates
        print("\nRecent Affiliates:")
        aff_response = supabase.table('affiliates').select('id, full_name, email, referral_code, sponsor_id, created_at').order('created_at', desc=True).limit(5).execute()
        if aff_response.data:
            for aff in aff_response.data:
                print(f"ID: {aff['id']} | Email: {aff['email']} | Sponsor: {aff['sponsor_id']} | Code: {aff['referral_code']}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_debug_logs()
