with open(r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso\pages\CheckoutPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()
for idx, line in enumerate(lines):
    if any(w in line.lower() for w in ["shipping", "frete", "calcul", "entrega"]):
        print(f"Line {idx+1}: {line.strip()}")
