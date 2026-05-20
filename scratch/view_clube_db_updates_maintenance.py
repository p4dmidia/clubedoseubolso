import os

path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\clube_db_updates.sql"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "maintenance_expires_at" in line:
        print(f"Line {i+1}: {line}")
        for j in range(-5, 10):
            if 0 <= i+j < len(lines):
                print(f"  [{i+j+1}]: {lines[i+j]}")
