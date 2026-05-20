import os
import sys
sys.stdout.reconfigure(encoding='utf-8')

path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\pages\\HomePageTest.tsx"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    lines = content.split("\n")
    for i, line in enumerate(lines):
        if "checkout" in line or "buy=" in line or "register" in line or "afiliado" in line.lower():
            print(f"{i+1}: {line}")
else:
    print("HomePageTest.tsx does not exist")
