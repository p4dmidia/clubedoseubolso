import os

search_dir = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso"
for root, dirs, files in os.walk(search_dir):
    if "node_modules" in root or ".git" in root or ".next" in root or "dist" in root:
        continue
    for file in files:
        if file.endswith((".md", ".txt", ".pdf", ".docx", ".doc", ".sql")):
            print(os.path.join(root, file))
