import requests
import json

url = "https://clnuievcdnbwqbyqhwys.supabase.co/rest/v1/"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

# The SQL I want to test
sql = """
CREATE OR REPLACE FUNCTION public.distribute_commissions_test()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _aff_row public.affiliates%ROWTYPE;
    _curr_sponsor_id uuid;
    _conf_row public.commission_configs%ROWTYPE;
    _comm_amt numeric;
    _gen_idx integer := 0;
    _max_gens integer;
    _dest_user_id uuid;
    _c_classe_a_id uuid := '5111af72-27a5-41fd-8ed9-8c51b78b4fdd';
    _is_mattress boolean := false;
    _cfg_key text;
BEGIN
    SELECT * FROM public.commission_configs WHERE key = 'geral' LIMIT 1 INTO _conf_row;
    IF _conf_row.key IS NULL THEN
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$;
"""

# Since I don't have exec_sql, I can't run this easily.
# But I can try to create a DIFFERENT function and see if it fails.
# Actually, I'll try to find an alternative way to provide the SQL.

print("Test script created.")
