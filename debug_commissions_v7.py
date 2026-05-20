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

with open("commission_debug_report_v7.txt", "w", encoding="utf-8") as out:
    out.write("MYSTERY USER CHECK\n")
    out.write("==================\n\n")

    user_id = "5d15d1ed-0965-4442-af2f-10f1d50cf3e4"
    out.write(f"--- Searching for user_profile or affiliate with ID '{user_id}' ---\n")
    
    profile = get_data(f"user_profiles?id=eq.{user_id}")
    out.write("Profile:\n" + json.dumps(profile, indent=2) + "\n\n")

    aff = get_data(f"affiliates?id=eq.{user_id}")
    out.write("Affiliate (by ID):\n" + json.dumps(aff, indent=2) + "\n\n")

    aff_uid = get_data(f"affiliates?user_id=eq.{user_id}")
    out.write("Affiliate (by user_id):\n" + json.dumps(aff_uid, indent=2) + "\n\n")

    # Check if this user is 'gilgalmissoes'
    out.write("--- Checking if this user has referral_code 'gilgalmissoes' ---\n")
    aff_gilgal = get_data(f"affiliates?referral_code=eq.gilgalmissoes")
    out.write(json.dumps(aff_gilgal, indent=2) + "\n\n")
