import os

search_terms = [
    "ENDEREÇO DE CADASTRO/FATURAMENTO",
    "ENDEREÇO DE CADASTRO",
    "RUA / LOGRADOURO",
    "TELEFONE / WHATSAPP"
]

root_dir = r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso"

found = {}
for dirpath, dirnames, filenames in os.walk(root_dir):
    if "node_modules" in dirpath or ".git" in dirpath or "dist" in dirpath:
        continue
    for filename in filenames:
        if filename.endswith((".tsx", ".ts", ".jsx", ".js", ".html")):
            full_path = os.path.join(dirpath, filename)
            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    for term in search_terms:
                        if term.lower() in content.lower():
                            if full_path not in found:
                                found[full_path] = []
                            found[full_path].append(term)
            except Exception as e:
                pass

print("Found results:")
for path, terms in found.items():
    print(f"{path}: {terms}")
