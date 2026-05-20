import urllib.request
import json

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def run_insert(data):
    url = f"{supabase_url}/rest/v1/affiliates"
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), method='POST')
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    try:
        with urllib.request.urlopen(req) as response:
            return "SUCCESS"
    except urllib.error.HTTPError as e:
        return e.read().decode('utf-8')
    except Exception as e:
        return str(e)

# Attempt to recreate Flavio's record to see the error
flavio_id = "b041c82b-3ad0-4840-b601-2649706e795b"
bella_id = "512f9aeb-683a-49c0-9731-76a7c8d10e8d"

print("--- ATTEMPTING TO INSERT AFFILIATE FOR FLAVIO ---")
data = {
    "user_id": flavio_id,
    "email": "flaviodomingues@gmail.com",
    "full_name": "Flávio domingues",
    "referral_code": "flaviodomingues_73ye",
    "organization_id": bella_id,
    "is_active": True
}
print(run_insert(data))
