import os

search_terms = ["faturamento", "logradouro", "cep"]
root_dir = r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso\pages"

for dirpath, dirnames, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.endswith(".tsx") or filename.endswith(".ts"):
            full_path = os.path.join(dirpath, filename)
            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    for term in search_terms:
                        if term.lower() in content.lower():
                            print(f"Found '{term}' in {filename}")
            except Exception as e:
                print(f"Error reading {filename}: {e}")
