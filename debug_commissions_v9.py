import urllib.request
import json
import sys
import urllib.parse

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

with open("commission_debug_report_v9.txt", "w", encoding="utf-8") as out:
    out.write("FINAL COMMISSION CHECK\n")
    out.write("======================\n\n")

    order_id = "#ORD-8233"
    safe_order_id = urllib.parse.quote(order_id)
    
    out.write(f"--- All commissions for Order {order_id} ---\n")
    all_comm = get_data(f"commissions?order_id=eq.{safe_order_id}&select=level,amount,user_id,created_at")
    out.write(json.dumps(all_comm, indent=2) + "\n\n")

    if isinstance(all_comm, list) and len(all_comm) > 0:
        out.write(f"Found {len(all_comm)} commission records.\n")
        for c in all_comm:
            uid = c.get('user_id')
            out.write(f"  Level {c.get('level')}: {c.get('amount')} to User {uid}\n")
    else:
        out.write("No commissions found.\n")
