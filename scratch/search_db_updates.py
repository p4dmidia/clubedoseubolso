path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\clube_db_updates.sql"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if any(term in line.lower() for term in ["comiss", "regras", "distribute", "mmn"]):
        print(f"Line {i+1}: {line.strip()}")
