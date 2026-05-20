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

with open("commission_debug_report_v8.txt", "w", encoding="utf-8") as out:
    out.write("UPLINE TRACE FOR GILGAL\n")
    out.write("========================\n\n")

    # This is the affiliate record for Gilgal
    gilgal_aff_id = "481274fd-8f4e-4e48-8a15-c9a669ac2999"
    
    out.write(f"--- Gilgal's Sponsor (ID: 25c7ed99-773d-423c-b2b0-2d1816caee27) ---\n")
    sponsor1 = get_data("affiliates?id=eq.25c7ed99-773d-423c-b2b0-2d1816caee27")
    out.write(json.dumps(sponsor1, indent=2) + "\n\n")

    if sponsor1:
        s1_next = sponsor1[0].get('sponsor_id')
        out.write(f"Next Sponsor ID: {s1_next}\n")
        sponsor2 = get_data(f"affiliates?id=eq.{s1_next}")
        out.write(json.dumps(sponsor2, indent=2) + "\n\n")
