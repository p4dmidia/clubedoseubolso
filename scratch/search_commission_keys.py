import os

search_terms = ["commission_configs", "salesSellerValue", "planosType", "geralType"]
root_dir = r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso"

found = {}
for term in search_terms:
    found[term] = []

for dirpath, dirnames, filenames in os.walk(root_dir):
    if "node_modules" in dirpath or ".git" in dirpath or "dist" in dirpath:
        continue
    for filename in filenames:
        full_path = os.path.join(dirpath, filename)
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
                for term in search_terms:
                    if term in content:
                        found[term].append(full_path)
        except Exception:
            pass

print("Search results:")
for term, paths in found.items():
    print(f"\n--- {term} ---")
    for p in paths:
        print(p)
