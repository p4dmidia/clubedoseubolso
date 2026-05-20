import os

search_dir = '.'
query = 'maintenance_expires_at'

for root, dirs, files in os.walk(search_dir):
    if 'node_modules' in root or '.git' in root or 'dist' in root:
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx', '.json', '.sql', '.py')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                if query in content:
                    print(f"Found in: {path}")
            except Exception as e:
                pass
