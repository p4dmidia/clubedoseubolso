import os

path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\components\\AffiliateLayout.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "checkout?buy=" in line:
        print(f"Line {i+1}: {line}")
