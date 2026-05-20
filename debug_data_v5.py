import urllib.request
import json
import sys

# Ensure UTF-8 output
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_data(endpoint):
    url = f"{supabase_url}/rest/v1/{endpoint}"
    req = urllib.request.Request(url)
    req.add_header("apikey", service_role_key)
    req.add_header("Authorization", f"Bearer {service_role_key}")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": str(e)}

with open("commission_debug_report_v5.txt", "w", encoding="utf-8") as out:
    out.write("12AGUIAS DATA CHECK\n")
    out.write("===================\n\n")

    email = "12aguias@gmail.com"
    out.write(f"--- Searching for affiliate with email '{email}' ---\n")
    affs = get_data(f"affiliates?email=eq.{email}")
    out.write(json.dumps(affs, indent=2) + "\n\n")

    out.write(f"--- Searching for affiliate with referral_code '12aguias' ---\n")
    affs_ref = get_data(f"affiliates?referral_code=eq.12aguias")
    out.write(json.dumps(affs_ref, indent=2) + "\n\n")

    out.write(f"--- Searching for affiliate with user_id 'b95451a8-7ed5-431a-8514-741fc95562f6' ---\n")
    affs_uid = get_data(f"affiliates?user_id=eq.b95451a8-7ed5-431a-8514-741fc95562f6")
    out.write(json.dumps(affs_uid, indent=2) + "\n\n")
