import os

search_term = "Classe A"
root_dir = r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso"

found = []
for dirpath, dirnames, filenames in os.walk(root_dir):
    if "node_modules" in dirpath or ".git" in dirpath or "dist" in dirpath:
        continue
    for filename in filenames:
        full_path = os.path.join(dirpath, filename)
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
                if search_term.lower() in content.lower():
                    found.append(full_path)
        except Exception:
            pass

print("Found references to 'Classe A' in:")
for p in found:
    print(p)
