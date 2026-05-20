with open('supabase_complete_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

for line in sql.split('\n'):
    if 'withdrawals' in line.lower() and ('policy' in line.lower() or 'enable row level' in line.lower()):
        print(line)
