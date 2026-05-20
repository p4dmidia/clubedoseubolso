import os

path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\pages\\HomePage.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "contratar" in line.lower() or "checkout" in line.lower():
        print(f"Line {i+1}: {line.strip()}")
        # print surrounding lines
        for j in range(-5, 5):
            if 0 <= i+j < len(lines):
                print(f"  [{i+j+1}]: {lines[i+j]}")
