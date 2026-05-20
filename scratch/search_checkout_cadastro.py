with open(r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso\pages\CheckoutPage.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "cadastro" in line.lower() or "faturamento" in line.lower():
        print(f"Line {idx+1}: {line.strip()}")
