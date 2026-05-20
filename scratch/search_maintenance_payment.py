import os

for root, dirs, files in os.walk("c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso"):
    for file in files:
        if file.endswith((".sql", ".ts", ".tsx")) and "node_modules" not in root:
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if "maintenance_expires_at" in content:
                print(f"Found in {file} (Path: {os.path.join(root, file)})")
