import csv

csv_path = r'c:\Users\eu\Documents\P4D\Projetos\Classe A\final_import_1_29.csv'
target_category_id = '2' # Assuming '2' is Calçado Masculino based on previous logic

print(f"{'Line':<6} | {'Name':<50} | {'Price':<10} | {'Images':<20}")
print("-" * 100)

with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader, 2):
        if row['category_id'] == target_category_id:
            name = row['name'][:50] + ("..." if len(row['name']) > 50 else "")
            price = row['price']
            images = row['image_url'] if 'image_url' in row else row.get('image', 'N/A')
            print(f"{i:<6} | {name:<50} | {price:<10} | {images[:20]}...")
