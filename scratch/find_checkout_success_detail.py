import os
import sys
sys.stdout.reconfigure(encoding='utf-8')

path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\pages\\CheckoutPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "/checkout/success" in line or "CheckoutSuccess" in line:
        print(f"Line {i+1}: {line.strip()}")
        for j in range(-5, 5):
            if 0 <= i+j < len(lines):
                print(f"  [{i+j+1}]: {lines[i+j]}")
