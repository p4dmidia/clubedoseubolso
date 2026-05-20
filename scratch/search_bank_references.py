import os

found = False
for root, dirs, files in os.walk('.'):
    # Exclude node_modules, dist, etc.
    if any(x in root for x in ['node_modules', 'dist', '.git', '.gemini']):
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx', '.sql', '.js', '.jsx')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'conta banc' in content.lower() or 'dados banc' in content.lower() or 'bank_account' in content.lower():
                        print(f"Found in {filepath}")
                        found = True
            except:
                pass

if not found:
    print("No bank account references found.")
