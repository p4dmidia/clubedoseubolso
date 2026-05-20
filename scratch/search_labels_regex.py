import os
import re

root_dir = r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso"
label_pat = re.compile(r"<label[^>]*>(.*?)</label>", re.DOTALL)

results = {}
for dirpath, dirnames, filenames in os.walk(root_dir):
    if "node_modules" in dirpath or ".git" in dirpath or "dist" in dirpath:
        continue
    for filename in filenames:
        if filename.endswith(".tsx"):
            full_path = os.path.join(dirpath, filename)
            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    matches = label_pat.findall(content)
                    if matches:
                        clean_matches = [m.strip() for m in matches if m.strip()]
                        results[filename] = clean_matches
            except Exception:
                pass

for fname, labels in results.items():
    print(f"=== {fname} ===")
    for lbl in labels:
        if any(term in lbl.lower() for term in ["cep", "rua", "bairro", "cidade", "faturamento"]):
            print(f"  MATCH: {lbl}")
