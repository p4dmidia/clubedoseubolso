with open(r"c:\Users\eu\Documents\P4D\Projetos\Classe A\pages\CheckoutPage.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "faturamento" in line.lower() or "cadastro" in line.lower():
        print(f"Line {idx+1}: {line.strip()}")
