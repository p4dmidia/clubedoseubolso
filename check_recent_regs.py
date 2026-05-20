import urllib.request
import json
import ssl

supabase_url = "https://clnuievcdnbwqbyqhwys.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

def get_data(table, select="*", order="created_at.desc", limit=5):
    url = f"{supabase_url}/rest/v1/{table}?select={select}&order={order}&limit={limit}"
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    try:
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(req, context=context) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {"error": str(e)}

print("--- Recent Affiliates (public.affiliates) ---")
affs = get_data("affiliates", select="id,user_id,email,full_name,referral_code,sponsor_id,created_at")
print(json.dumps(affs, indent=2))

# Note: auth.users is protected, but we can try to access it if the service role key allows it through standard REST or if there is a view.
# Usually, we check user_profiles as a proxy for auth.users if auth.users is not accessible.
print("\n--- Recent Profiles (public.user_profiles) ---")
profiles = get_data("user_profiles", select="id,email,created_at")
print(json.dumps(profiles, indent=2))
