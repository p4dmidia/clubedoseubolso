import os

replacements = {
    "#FBC02D": "#2980B9",
    "#fbc02d": "#2980B9",
    "Classe A": "Clube do Seu Bolso",
    "CLASSE A": "CLUBE DO SEU BOLSO",
    "classe-a": "clube-do-seu-bolso"
}

directories = ["pages", "components", "lib"]
files_to_process = ["App.tsx", "index.html", "index.tsx", "package.json"]

# Collect all files in the target directories
for directory in directories:
    if os.path.exists(directory):
        for root, _, filenames in os.walk(directory):
            for filename in filenames:
                if filename.endswith((".ts", ".tsx", ".html", ".css", ".js")):
                    files_to_process.append(os.path.join(root, filename))

print(f"Found {len(files_to_process)} files to process.")

replaced_count = 0
for filepath in files_to_process:
    if not os.path.exists(filepath):
        continue
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        original_content = content
        for search_str, replace_str in replacements.items():
            content = content.replace(search_str, replace_str)
        
        if content != original_content:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Updated: {filepath}")
            replaced_count += 1
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

print(f"Completed. Updated {replaced_count} files.")
