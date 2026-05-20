with open(r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso\pages\CheckoutPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

for term in ["calculateShipping", "shippingOptions", "selectedShipping"]:
    count = content.count(term)
    print(f"'{term}' appears {count} times")
    if count > 0:
        for idx, line in enumerate(content.splitlines()):
            if term in line:
                print(f"  Line {idx+1}: {line.strip()}")
