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

with open("commission_debug_report_v4.txt", "w", encoding="utf-8") as out:
    out.write("BUYER PROFILE CHECK\n")
    out.write("===================\n\n")

    buyer_id = "7e57d5d8-f44c-46ed-8c14-46e191321620"
    out.write(f"--- Buyer Profile (ID: {buyer_id}) ---\n")
    profile = get_data(f"user_profiles?id=eq.{buyer_id}")
    out.write(json.dumps(profile, indent=2) + "\n\n")

    if profile:
        sponsor_id = profile[0].get('sponsor_id')
        out.write(f"Sponsor ID in profile: {sponsor_id}\n")
        
        out.write(f"--- Affiliate with ID '{sponsor_id}' ---\n")
        aff = get_data(f"affiliates?id=eq.{sponsor_id}")
        out.write(json.dumps(aff, indent=2) + "\n\n")

        # Also check if there's an affiliate record for the buyer themselves
        out.write(f"--- Affiliate record for buyer (user_id: {buyer_id}) ---\n")
        buyer_aff = get_data(f"affiliates?user_id=eq.{buyer_id}")
        out.write(json.dumps(buyer_aff, indent=2) + "\n\n")
