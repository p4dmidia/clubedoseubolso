from supabase import create_client
import os

url = 'https://clnuievcdnbwqbyqhwys.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk'

supabase = create_client(url, key)

# Edivaldo's user_id: ad8210ca-3a77-49dc-9136-75147bc747a1
# 12aguias's user_id: b95451a8-7ed5-431a-8514-741fc95562f6
# 12aguias's affiliate_id: ffab0c91-8110-4a87-8d79-50d71b631af2

org_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'

print("Updating affiliates table...")
res1 = supabase.table('affiliates').update({
    'sponsor_id': 'ffab0c91-8110-4a87-8d79-50d71b631af2'
}).eq('user_id', 'ad8210ca-3a77-49dc-9136-75147bc747a1').eq('organization_id', org_id).execute()
print(res1.data)

print("\nUpdating user_profiles table...")
res2 = supabase.table('user_profiles').update({
    'sponsor_id': 'b95451a8-7ed5-431a-8514-741fc95562f6',
    'referrer_id': 'b95451a8-7ed5-431a-8514-741fc95562f6'
}).eq('id', 'ad8210ca-3a77-49dc-9136-75147bc747a1').eq('organization_id', org_id).execute()
print(res2.data)

print("\nDone!")
