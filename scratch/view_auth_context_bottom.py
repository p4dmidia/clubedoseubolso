import os

path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\components\\AuthContext.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i in range(40, len(lines)):
    print(f"{i+1}: {lines[i]}")
