import os
from supabase import create_client, Client
import json

def verify_self_commission():
    url = "https://clnuievcdnbwqbyqhwys.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk" # service role key from .env.local
    
    supabase: Client = create_client(url, key)
    
    # Query commissions where beneficiary is the buyer of the order
    # orders table has user_id
    # commissions table has user_id (beneficiary) and order_id
    
    query = """
    SELECT 
        c.id as commission_id,
        c.user_id as beneficiary_id,
        o.user_id as buyer_id,
        o.id as order_id,
        c.amount,
        c.level,
        c.description
    FROM public.commissions c
    JOIN public.orders o ON c.order_id = o.id
    WHERE c.user_id = o.user_id
    """
    
    try:
        response = supabase.rpc('execute_sql_query', {'sql_query': query}).execute()
        results = response.data
        
        if not results:
            # Maybe the RPC doesn't exist or returns empty. Let's try direct query if possible via another way or just check commissions table
            print("No self-commissions found via direct join query.")
            
            # Let's check commissions where description mentions the same user? No, let's just query some commissions and orders manually.
            commissions = supabase.table('commissions').select('user_id, order_id, level').limit(100).execute().data
            if commissions:
                order_ids = list(set([c['order_id'] for c in commissions]))
                orders = supabase.table('orders').select('id, user_id').in_('id', order_ids).execute().data
                order_map = {o['id']: o['user_id'] for o in orders}
                
                self_commissions = []
                for c in commissions:
                    if order_map.get(c['order_id']) == c['user_id']:
                        self_commissions.append(c)
                
                if self_commissions:
                    print(f"Found {len(self_commissions)} self-commissions!")
                    print(json.dumps(self_commissions, indent=2))
                else:
                    print("Checked 100 commissions, no self-commissions found.")
            else:
                print("No commissions found in table.")
                
        else:
            print(f"Found {len(results)} self-commissions!")
            print(json.dumps(results, indent=2))
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_self_commission()
