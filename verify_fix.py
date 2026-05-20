import urllib.request
import urllib.parse
import json
import uuid

# Configuration
SUPABASE_URL = "https://clnuievcdnbwqbyqhwys.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

test_id = str(uuid.uuid4())[:8]
email = f"test_v5_{test_id}@example.com"
password = "Password123!"
login = f"testv5_{test_id}"

print(f"Testing registration (Admin API) for {email}...")

# 1. Create User via Admin API
url = f"{SUPABASE_URL}/auth/v1/admin/users"
headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

payload = {
    "email": email,
    "password": password,
    "email_confirm": True,
    "user_metadata": {
        "nome": "Teste",
        "sobrenome": f"V5 {test_id}",
        "login": login,
        "whatsapp": "11999999999",
        "registration_type": "personal",
        "organization_id": "5111af72-27a5-41fd-8ed9-8c51b78b4fdd"
    }
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        signup_data = json.loads(response.read().decode())
        user_id = signup_data.get('id')
        print(f"Admin Create SUCCESS. User ID: {user_id}")
except urllib.error.HTTPError as e:
    print(f"Admin Create FAILED: {e.code}")
    print(f"Body: {e.read().decode()}")
    exit(1)

# 2. Verify Tables
def check_table(table, select="*", filters=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{select}&{filters}"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}"
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

print("\nVerifying database records...")

profile = check_table("user_profiles", filters=f"id=eq.{user_id}")
print(f"User Profile: {json.dumps(profile, indent=2)}")

affiliate = check_table("affiliates", filters=f"user_id=eq.{user_id}")
print(f"Affiliate: {json.dumps(affiliate, indent=2)}")

logs = check_table("debug_logs", select="*", filters="order=created_at.desc&limit=5")
print(f"Latest Debug Logs: {json.dumps(logs, indent=2)}")

if profile and affiliate:
    print("\nVERIFICATION SUCCESSFUL! Both tables populated.")
else:
    print("\nVERIFICATION FAILED! Missing data.")
