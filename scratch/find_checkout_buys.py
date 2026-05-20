import os

for root, dirs, files in os.walk("c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso"):
    for file in files:
        if file.endswith((".tsx", ".ts")) and "node_modules" not in root:
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if "checkout?buy=" in content:
                print(f"{file} in {root}")
