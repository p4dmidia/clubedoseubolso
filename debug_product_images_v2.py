import urllib.request
import json
import os

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

with open("product_debug_clean.txt", "w", encoding="utf-8") as f:
    f.write("PRODUCT DEBUG INFO\n")
    f.write("==================\n\n")
    
    p1067 = get_data("products?name=ilike.*1067*&select=id,name,image_url,images_gallery,images")
    f.write("Product 1067:\n")
    f.write(json.dumps(p1067, indent=2) + "\n\n")
    
    p1071 = get_data("products?name=ilike.*1071*&select=id,name,image_url,images_gallery,images")
    f.write("Product 1071:\n")
    f.write(json.dumps(p1071, indent=2) + "\n\n")
    
    f.write("Sample Products:\n")
    p_sample = get_data("products?limit=5&select=id,name,image_url,images_gallery,images")
    f.write(json.dumps(p_sample, indent=2) + "\n\n")
