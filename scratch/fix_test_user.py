from supabase import create_client
import os

url = 'https://clnuievcdnbwqbyqhwys.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk'

supabase = create_client(url, key)

user_id = '36017571-59ab-4eec-8238-070a6ea5886e'
email = 'testederede@gmail.com'
org_id = '5111af72-27a5-41fd-8ed9-8c51b78b4fdd'
login = 'testerede786'
whatsapp = '32988556644'

print(f"Creating affiliate record for {email}...")
res = supabase.table('affiliates').insert({
    'user_id': user_id,
    'email': email,
    'full_name': 'Teste de Rede',
    'referral_code': login,
    'whatsapp': whatsapp,
    'organization_id': org_id,
    'is_active': True
}).execute()
print(res.data)

print("\nUpdating user_profiles full_name...")
res2 = supabase.table('user_profiles').update({
    'full_name': 'Teste de Rede'
}).eq('id', user_id).execute()
print(res2.data)

print("\nDone!")
