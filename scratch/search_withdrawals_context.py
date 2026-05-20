with open('supabase_complete_schema.sql', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'withdrawals' in line.lower():
        print(f"Line {idx+1}: {line.strip()}")
        # print 5 lines before and after
        start = max(0, idx - 3)
        end = min(len(lines), idx + 4)
        for i in range(start, end):
            if i != idx:
                print(f"  {i+1}: {lines[i].strip()}")
        print("-" * 50)
