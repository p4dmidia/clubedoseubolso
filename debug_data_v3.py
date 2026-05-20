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

with open("commission_debug_report_v3.txt", "w", encoding="utf-8") as out:
    out.write("DETAILED DATA CHECK\n")
    out.write("===================\n\n")

    out.write("--- Paid Order Check (#ORD-8233) ---\n")
    order = get_data("orders?id=eq.%23ORD-8233")
    out.write(json.dumps(order, indent=2) + "\n\n")

    if order:
        org_id = order[0].get('organization_id')
        ref_code = order[0].get('referral_code')
        out.write(f"Org ID: {org_id}, Ref Code: {ref_code}\n")
        
        out.write(f"--- Affiliate with ref_code '{ref_code}' ---\n")
        affs = get_data(f"affiliates?referral_code=eq.{ref_code}")
        out.write(json.dumps(affs, indent=2) + "\n\n")

    out.write("--- User Profiles for 12aguias@gmail.com ---\n")
    profiles = get_data("user_profiles?email=eq.12aguias@gmail.com")
    out.write(json.dumps(profiles, indent=2) + "\n\n")

    out.write("--- Affiliates list (first 20) ---\n")
    affs_list = get_data("affiliates?select=id,name,referral_code,organization_id,sponsor_id&limit=20")
    out.write(json.dumps(affs_list, indent=2) + "\n\n")
