import os

migrations_dir = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso"
keywords = ["ativo", "congel", "mensalid", "consumo", "bloque", "status"]

for file in os.listdir(migrations_dir):
    if file.endswith(".sql"):
        path = os.path.join(migrations_dir, file)
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                found = [kw for kw in keywords if kw in content.lower()]
                if found:
                    print(f"{file} contains: {found}")
        except Exception:
            pass

migrations_subdir = os.path.join(migrations_dir, "supabase", "migrations")
for file in os.listdir(migrations_subdir):
    if file.endswith(".sql"):
        path = os.path.join(migrations_subdir, file)
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                found = [kw for kw in keywords if kw in content.lower()]
                if found:
                    print(f"supabase/migrations/{file} contains: {found}")
        except Exception:
            pass
