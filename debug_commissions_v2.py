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

def trace_network(start_aff_id):
    path = []
    curr_id = start_aff_id
    while curr_id:
        data = get_data(f"affiliates?id=eq.{curr_id}&select=id,name,referral_code,sponsor_id,user_id")
        if data and isinstance(data, list) and len(data) > 0:
            aff = data[0]
            path.append(aff)
            curr_id = aff.get('sponsor_id')
            if len(path) > 10: break # Safety
        else:
            break
    return path

with open("commission_debug_report.txt", "w", encoding="utf-8") as out:
    out.write("COMMISSION DEBUG REPORT\n")
    out.write("========================\n\n")

    out.write("--- Commission Configs ---\n")
    configs = get_data("commission_configs")
    out.write(json.dumps(configs, indent=2) + "\n\n")

    out.write("--- Recent Orders (0.50) ---\n")
    orders = get_data("orders?total_amount=eq.0.5&select=id,status,referral_code,user_id,customer_email,customer_name")
    out.write(json.dumps(orders, indent=2) + "\n\n")

    if orders and isinstance(orders, list):
        for ord in orders:
            oid = ord['id']
            out.write(f"--- Order Details: {oid} ---\n")
            
            ref_code = ord.get('referral_code')
            out.write(f"Referral Code: {ref_code}\n")
            
            # Find the direct affiliate
            affs = get_data(f"affiliates?referral_code=eq.{ref_code}&select=id,name,sponsor_id")
            if affs and isinstance(affs, list) and len(affs) > 0:
                direct_aff = affs[0]
                out.write(f"Direct Affiliate: {direct_aff['name']} (ID: {direct_aff['id']})\n")
                
                # Trace Uplines
                out.write("Upline Trace:\n")
                network = trace_network(direct_aff['id'])
                for i, level in enumerate(network):
                    out.write(f"  Level {i+1}: {level['name']} (ID: {level['id']}, SponsorID: {level['sponsor_id']})\n")
            else:
                out.write("Direct Affiliate NOT FOUND by referral_code\n")

            # Check existing commissions
            commissions = get_data(f"commissions?order_id=eq.{oid}")
            out.write(f"Commissions generated: {len(commissions) if isinstance(commissions, list) else 'Error'}\n")
            out.write(json.dumps(commissions, indent=2) + "\n\n")

    out.write("--- Total Affiliates Count ---\n")
    all_affs = get_data("affiliates?select=id")
    out.write(f"Count: {len(all_affs) if isinstance(all_affs, list) else 'Error'}\n")
