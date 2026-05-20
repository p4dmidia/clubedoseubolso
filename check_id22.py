import csv

print("PRODUCTS MAPPED TO ID 22 (SAPATO SOCIAL):")
count = 0
with open(r'c:\Users\eu\Documents\P4D\Projetos\Classe A\final_import_1_29.csv', mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['category_id'] == '22':
            print(f"- {row['name']}")
            count += 1
        if count >= 30: break

print(f"\n... and {403-count} more.")
