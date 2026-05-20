import os

path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\pages\\HomePage.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i in [130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441]:
    if i < len(lines):
        print(f"{i+1}: {lines[i]}")
