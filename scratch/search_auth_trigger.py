import os

schema_path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\supabase_complete_schema.sql"
with open(schema_path, "r", encoding="utf-8") as f:
    schema = f.read()

# Find occurrences of trigger or function related to auth
lines = schema.split("\n")
for i, line in enumerate(lines):
    if "trigger" in line.lower() and "auth" in line.lower():
        print(f"Line {i+1}: {line}")
    if "on auth.users" in line.lower():
        print(f"Line {i+1} on auth.users: {line}")
        # Print surrounding lines
        for j in range(-5, 10):
            if 0 <= i+j < len(lines):
                print(f"  [{i+j+1}]: {lines[i+j]}")
