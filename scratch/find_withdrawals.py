with open('supabase_complete_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

import re
matches = re.findall(r'CREATE TABLE(?:\s+IF NOT EXISTS)?\s+([^\s\()]+)\s*\((.*?)\);', sql, re.DOTALL | re.IGNORECASE)
for table, definition in matches:
    if 'withdrawals' in table.lower():
        print(f"Table: {table}")
        print(definition.strip())
        print("="*40)
