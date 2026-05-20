with open('supabase_complete_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

import re
# Look for withdrawals in trigger definitions
triggers = re.findall(r'CREATE TRIGGER\s+\w+\s+[^;]+?withdrawals[^;]*?;', sql, re.DOTALL | re.IGNORECASE)
for t in triggers:
    print("Trigger:")
    print(t)
    print("="*40)

# Look for functions that contain "withdrawals"
functions = re.findall(r'CREATE OR REPLACE FUNCTION\s+(\w+)\(.*?\).*?RETURNS.*?AS.*?(\$\$.*?\$\$;)', sql, re.DOTALL | re.IGNORECASE)
for name, body in functions:
    if 'withdrawals' in name.lower() or 'withdrawals' in body.lower():
        print(f"Function: {name}")
        print(body[:300] + "...")
        print("="*40)
