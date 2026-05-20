import os

updates_path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\clube_db_updates.sql"
with open(updates_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "alter table" in line.lower() and "user_profiles" in line.lower():
        print(f"Line {i+1}: {line}")
        # Print next 5 lines
        for j in range(1, 10):
            if i+j < len(lines):
                print(f"  + {lines[i+j]}")
