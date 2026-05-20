import os

schema_path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\supabase_complete_schema.sql"
with open(schema_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if any(term in line.lower() for term in ["commission_configs", "unilever", "geracoes", "geracao", "mmn", "multinivel"]):
        print(f"Line {i+1}: {line.strip()}")
