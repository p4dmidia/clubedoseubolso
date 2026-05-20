from supabase import create_client
import os

url = 'https://clnuievcdnbwqbyqhwys.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk'

supabase = create_client(url, key)

org_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'
sponsor_affiliate_id = 'ffab0c91-8110-4a87-8d79-50d71b631af2'
sponsor_user_id = 'b95451a8-7ed5-431a-8514-741fc95562f6'

users_to_fix = [
    {'name': 'Andre', 'user_id': '0cfc072e-3d23-4b23-8dc9-2371653f74b4'},
    {'name': 'Gilson', 'user_id': '8792b4a1-fbdb-4fe0-9d36-d8be852146a7'},
    {'name': 'Ailton', 'user_id': 'b86ee8c6-1e27-49a0-bbde-ce4ec120a00b'},
    {'name': 'Paulo Cesar', 'user_id': '27be767c-b02a-4a9e-a0ea-83f707225b52'}
]

for user in users_to_fix:
    print(f"Fixing {user['name']}...")
    
    # Update affiliates
    res_aff = supabase.table('affiliates').update({
        'sponsor_id': sponsor_affiliate_id
    }).eq('user_id', user['user_id']).eq('organization_id', org_id).execute()
    
    # Update user_profiles
    res_prof = supabase.table('user_profiles').update({
        'sponsor_id': sponsor_user_id,
        'referrer_id': sponsor_user_id
    }).eq('id', user['user_id']).eq('organization_id', org_id).execute()
    
    print(f"  Affiliate update: {len(res_aff.data)} row(s)")
    print(f"  Profile update: {len(res_prof.data)} row(s)")

print("\nAll users linked to 12aguias successfully!")
