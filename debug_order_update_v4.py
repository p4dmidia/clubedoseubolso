
import requests
import json
import os

# Load env
SUPABASE_URL = "https://clnuievcdnbwqbyqhwys.supabase.co"
# Using service role key to bypass RLS and get full errors
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def check_order_update():
    # 1. Find a pending order
    print("Finding a pending order...")
    url = f"{SUPABASE_URL}/rest/v1/orders?status=eq.Pendente&limit=1"
    res = requests.get(url, headers=headers)
    
    if res.status_code != 200:
        # Try lowercase pending
        url = f"{SUPABASE_URL}/rest/v1/orders?status=eq.pending&limit=1"
        res = requests.get(url, headers=headers)
        
    orders = res.json()
    if not orders:
        print("No pending orders found to test.")
        return

    order = orders[0]
    order_id = order['id']
    print(f"Found order: {order_id} (Status: {order['status']})")

    # 2. Attempt to update to 'Pago'
    print(f"Attempting to update order {order_id} to 'Pago'...")
    update_url = f"{SUPABASE_URL}/rest/v1/orders?id=eq.{order_id}"
    
    # We include payment_status=paid as the Frontend does
    payload = {
        "status": "Pago",
        "payment_status": "paid",
        "payment_status_detail": "Accreditated Manual (Debug Test)"
    }
    
    # Use Prefer: return=representation to see what happened or catch error
    update_headers = headers.copy()
    update_headers["Prefer"] = "return=representation"
    
    res = requests.patch(update_url, headers=update_headers, data=json.dumps(payload))
    
    print(f"Status Code: {res.status_code}")
    try:
        response_data = res.json()
        print("Response Body:")
        print(json.dumps(response_data, indent=2))
        
        if res.status_code >= 400:
            print("\n!!! ERROR DETECTED !!!")
            if 'message' in response_data:
                print(f"Message: {response_data['message']}")
            if 'details' in response_data:
                print(f"Details: {response_data['details']}")
            if 'hint' in response_data:
                print(f"Hint: {response_data['hint']}")
    except:
        print("Raw Response Content:")
        print(res.text)

if __name__ == "__main__":
    check_order_update()
