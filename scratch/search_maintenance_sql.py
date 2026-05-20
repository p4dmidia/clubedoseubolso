with open('clube_db_updates.sql', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'maintenance_expires_at' in line:
        print(f"Line {idx+1}: {line.strip()}")
        # print 5 lines around
        start = max(0, idx - 4)
        end = min(len(lines), idx + 5)
        for i in range(start, end):
            if i != idx:
                print(f"  {i+1}: {lines[i].strip()}")
        print("="*40)
