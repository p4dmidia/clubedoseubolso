with open(r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso\pages\CheckoutPage.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    l_lower = line.lower()
    if any(k in l_lower for k in ["cep", "street", "neighborhood", "city", "faturamento"]):
        print(f"Line {idx+1}: {line.strip()}")
