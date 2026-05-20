with open(r"c:\Users\eu\Documents\P4D\Projetos\Classe A\pages\CheckoutPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

terms = [
    "ENDEREÇO DE CADASTRO/FATURAMENTO",
    "ENDEREÇO DE CADASTRO",
    "RUA / LOGRADOURO",
    "TELEFONE / WHATSAPP"
]

for t in terms:
    if t.lower() in content.lower():
        print(f"Found '{t}' in Classe A CheckoutPage.tsx")
        # find line
        for idx, line in enumerate(content.splitlines()):
            if t.lower() in line.lower():
                print(f"  Line {idx+1}: {line.strip()}")
