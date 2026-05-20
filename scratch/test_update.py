import requests
import json

url = "https://clnuievcdnbwqbyqhwys.supabase.co/rest/v1/"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def find_pendente_order():
    resp = requests.get(f"{url}orders?status=eq.Pendente&limit=1", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        if data:
            return data[0]
    # Try lowercase pending
    resp = requests.get(f"{url}orders?status=eq.pending&limit=1", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        if data:
            return data[0]
    return None

def test_update_order(order_id):
    update_data = {
        "status": "Pago",
        "payment_status": "paid",
        "payment_status_detail": "Accreditated Manual"
    }
    print(f"Updating order {order_id} to Pago...")
    resp = requests.patch(f"{url}orders?id=eq.{order_id}", headers=headers, data=json.dumps(update_data))
    print(f"Status Code: {resp.status_code}")
    print(f"Response: {resp.text}")

order = find_pendente_order()
if order:
    print(f"Found order: {order['id']}")
    test_update_order(order['id'])
else:
    print("No Pendente order found.")
