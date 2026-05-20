import os
import sys

# Ensure UTF-8 printing
sys.stdout.reconfigure(encoding='utf-8')

path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\pages\\CheckoutPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i, line in enumerate(lines):
    if "success" in line.lower() or "navigate(" in line.lower():
        print(f"Line {i+1}: {line.strip()}")
