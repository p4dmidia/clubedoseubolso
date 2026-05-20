with open('supabase_complete_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

import re
matches = re.findall(r'CREATE TRIGGER\s+[^\s]+\s+.*?\s+ON\s+public\.withdrawals.*?;', sql, re.DOTALL | re.IGNORECASE)
for m in matches:
    print(m)
    print("="*40)
    
# Let's also look for functions that mention withdrawals
matches_func = re.findall(r'CREATE OR REPLACE FUNCTION\s+[^\s]+\(.*?\).*?RETURNS.*?AS.*?BEGIN.*?END;', sql, re.DOTALL | re.IGNORECASE)
for func in matches_func:
    if 'withdrawals' in func.lower():
        print("Function:")
        print(func[:200] + "...")
        print("="*40)
