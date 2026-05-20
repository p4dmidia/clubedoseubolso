import urllib.request
import json

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

with open("hierarchy_output_v2.txt", "w", encoding="utf-8") as f:
    fiel = get_data("affiliates?email=eq.fiel01@gmail.com&select=id,full_name,email,referral_code,sponsor_id,user_id")
    gilgal = get_data("affiliates?email=eq.gilgalmissoes@gmail.com&select=id,full_name,email,referral_code,sponsor_id,user_id")

    f.write(f"Affiliate (Fiel): {json.dumps(fiel, indent=2)}\n")
    f.write(f"Affiliate (Gilgal): {json.dumps(gilgal, indent=2)}\n")

    if isinstance(fiel, list) and len(fiel) > 0:
        profile_fiel = get_data(f"user_profiles?id=eq.{fiel[0]['user_id']}")
        f.write(f"Profile (Fiel): {json.dumps(profile_fiel, indent=2)}\n")

    if isinstance(gilgal, list) and len(gilgal) > 0:
        profile_gilgal = get_data(f"user_profiles?id=eq.{gilgal[0]['user_id']}")
        f.write(f"Profile (Gilgal): {json.dumps(profile_gilgal, indent=2)}\n")
