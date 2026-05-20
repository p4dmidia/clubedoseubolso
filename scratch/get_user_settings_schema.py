with open('supabase_complete_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

import re
match = re.search(r'CREATE TABLE public\.user_settings.*?\);', sql, re.DOTALL | re.IGNORECASE)
if match:
    print(match.group(0))
else:
    print("Not found")
