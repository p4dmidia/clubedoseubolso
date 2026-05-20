import os

search_dir = '.'
queries = ['manutenção', 'mensalidade', 'vencimento', 'expire', 'renovação', 'subscription']

for root, dirs, files in os.walk(search_dir):
    if 'node_modules' in root or '.git' in root or 'dist' in root or 'scratch' in root:
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()
                for query in queries:
                    if query in content:
                        print(f"Found '{query}' in: {path}")
                        break
            except Exception as e:
                pass
