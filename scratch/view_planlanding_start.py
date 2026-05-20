import os
import sys
sys.stdout.reconfigure(encoding='utf-8')

path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\pages\\PlanLandingPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
for i in range(149, 200):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}")
