import os
from supabase import create_client, Client

url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"
supabase: Client = create_client(url, key)

def check_referral():
    emails = ['joaquimpai@gmail.com', 'joaquimfilho@gmail.com']
    
    print("--- Affiliates Check ---")
    response = supabase.table("affiliates").select("id, email, full_name, sponsor_id, organization_id, referral_code").in_("email", emails).execute()
    
    if response.data:
        for aff in response.data:
            print(f"ID: {aff['id']}")
            print(f"Email: {aff['email']}")
            print(f"Name: {aff['full_name']}")
            print(f"Code: {aff['referral_code']}")
            print(f"Sponsor ID: {aff['sponsor_id']}")
            print(f"Org ID: {aff['organization_id']}")
            print("-" * 20)
    else:
        print("No affiliates found for these emails.")

    print("\n--- Organization Reference ---")
    org_response = supabase.table("organizations").select("id, name").eq("name", "Classe A").execute()
    print(org_response.data)

if __name__ == "__main__":
    check_referral()
