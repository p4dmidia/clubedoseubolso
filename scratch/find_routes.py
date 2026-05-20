import os

path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\src\\App.tsx"
if not os.path.exists(path):
    # Try finding it in main directories
    for root, dirs, files in os.walk("c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso"):
        if "app.tsx" in [f.lower() for f in files]:
            path = os.path.join(root, "App.tsx")
            break

print("App.tsx path:", path)
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines[:100]):
    print(f"{i+1}: {line}")
