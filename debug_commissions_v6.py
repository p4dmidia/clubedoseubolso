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

with open("commission_debug_report_v6.txt", "w", encoding="utf-8") as out:
    out.write("COMMISSION 0.05 CHECK\n")
    out.write("=====================\n\n")

    out.write("--- Commissions with amount 0.05 ---\n")
    commissions = get_data("commissions?amount=eq.0.05")
    out.write(json.dumps(commissions, indent=2) + "\n\n")

    if commissions:
        for comm in commissions:
            oid = comm.get('order_id')
            out.write(f"--- Order Details for Order {oid} ---\n")
            order = get_data(f"orders?id=eq.{oid}")
            out.write(json.dumps(order, indent=2) + "\n\n")
            
            # Check if there are other commissions for this order (level 2+)
            out.write(f"--- All commissions for Order {oid} ---\n")
            all_comm = get_data(f"commissions?order_id=eq.{oid}")
            out.write(json.dumps(all_comm, indent=2) + "\n\n")
