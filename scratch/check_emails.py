import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def query_table(table, params=""):
    url = f"{supabase_url}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return str(e)

emails = ["sandrakarla123@gmail.com", "jairlima22@gmail.com", "ailtonc87@gmail.com"]

for email in emails:
    print(f"\n--- CHECKING EMAIL: {email} ---")
    affs = query_table("affiliates", f"email=eq.{email}")
    print(f"Found in affiliates: {len(affs)}")
    for a in affs:
        print(f"  Org: {a['organization_id']}, Referral Code: {a['referral_code']}")
