import csv
import collections

# Count source categories
source_counts = collections.Counter()
try:
    with open(r'c:\Users\eu\Downloads\todos os produtos classe A.csv', mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            source_counts[row['Categorias']] += 1
except:
    with open(r'c:\Users\eu\Downloads\todos os produtos classe A.csv', mode='r', encoding='latin-1') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            source_counts[row['Categorias']] += 1

print("TOP 10 SOURCE CATEGORIES:")
for cat, count in source_counts.most_common(10):
    print(f"{cat}: {count}")

# Count final category_ids
final_counts = collections.Counter()
with open(r'c:\Users\eu\Documents\P4D\Projetos\Classe A\final_import_1_29.csv', mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        final_counts[row['category_id']] += 1

print("\nFINAL CATEGORY ID DISTRIBUTION:")
for cat_id, count in final_counts.most_common(20):
    print(f"ID {cat_id}: {count}")
