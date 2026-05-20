import os

search_dir = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso"
terms = ["prd", "mmn", "multinivel", "comissao", "regras", "bonificacao", "plano"]

print("Searching for files containing terms in name:")
for root, dirs, files in os.walk(search_dir):
    if "node_modules" in root or ".git" in root or ".next" in root or "dist" in root:
        continue
    for file in files:
        file_lower = file.lower()
        if any(term in file_lower for term in terms) and file.endswith((".md", ".txt", ".json", ".pdf", ".docx", ".doc")):
            print(os.path.join(root, file))

print("\nSearching for files containing 'MMN' or 'Multinível' or 'PRD' in text:")
for root, dirs, files in os.walk(search_dir):
    if "node_modules" in root or ".git" in root or ".next" in root or "dist" in root:
        continue
    for file in files:
        if file.endswith((".md", ".txt", ".json", ".ts", ".tsx", ".js", ".jsx", ".sql")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                    if "PRD" in content or "MMN" in content or "Multinível" in content or "Multinivel" in content:
                        print(f"Found in content of: {path}")
            except Exception:
                pass
