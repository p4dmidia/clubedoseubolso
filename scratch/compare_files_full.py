import difflib

file_clube = r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso\pages\CheckoutPage.tsx"
file_classea = r"c:\Users\eu\Documents\P4D\Projetos\Classe A\pages\CheckoutPage.tsx"

with open(file_clube, "r", encoding="utf-8") as f:
    lines_clube = f.readlines()

with open(file_classea, "r", encoding="utf-8") as f:
    lines_classea = f.readlines()

diff = difflib.unified_diff(
    lines_classea, lines_clube,
    fromfile='Classe A/CheckoutPage.tsx',
    tofile='clube do seu bolso/CheckoutPage.tsx',
    n=3
)

# Print all lines of the diff starting after the first 20 lines of output
diff_lines = list(diff)
print(''.join(diff_lines[30:]))
