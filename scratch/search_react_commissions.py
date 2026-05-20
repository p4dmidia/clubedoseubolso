import os

search_dir = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso"
for root, dirs, files in os.walk(search_dir):
    if "node_modules" in root or ".git" in root or ".next" in root or "dist" in root:
        continue
    for file in files:
        if file.endswith((".ts", ".tsx", ".js", ".jsx")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                    if "comiss" in content.lower() or "commission" in content.lower():
                        print(f"{file} contains commission references")
            except Exception:
                pass
