import csv
import os

# Mapping definitions based on screenshots
CAT_MAP = {
    'CAMA': 49,
    'ACESSÓRIOS': 1,
    'VESTUÁRIO MASCULINO': 5,
    'CALÇADO MASCULINO': 19,
    'FEMININO': 24,
    'PROMOÇÕES': 15
}

# Mapping for the new 3-level hierarchy
# We use a tuple (CategoryID, SubcategoryID)
# If it matches a sub-sub, we assign the parent/child accordingly.
HIERARCHY_MAP = {
    # VESTUÁRIO MASCULINO
    'BERMUDA': (5, 6),
    'CAMISETA': (5, 7),
    'CALÇA': (5, 8),
    'POLO': (5, 9),
    'SOCIAL MANGA CURTA': (5, 10),
    'SOCIAL MANGA LONGA': (5, 11),
    'TERNO': (5, 12),
    'BLAZER': (5, 16),
    
    # CALÇADO MASCULINO
    'SAPATÊNIS': (19, 20),
    'TÊNIS': (19, 21),
    'SAPATO SOCIAL': (19, 22),
    'CHINELO': (19, 23),
    
    # FEMININO
    'BOLSA': (24, 26),
    'BOTA': (24, 30),
    'RASTEIRA': (24, 35),
    'SAPATILHA': (24, 36),
    'SANDÁLIA': (24, 37),
    'TAMANCO': (24, 39),
    'VESTIDO': (24, 47),
    
    # CAMA
    'BASE BOX': (49, 50),
    'TRAVESSEIRO': (49, 51),
    'CABECEIRA': (49, 52),
    'COLCHÃO ESTÁTICO': (49, 53),
    'COLCHÃO TERAPÊUTICO': (49, 54),
    'COLCHÕES ESTÁTICOS': (49, 53),
    'COLCHÕES TERAPÊUTICOS': (49, 54),
}

# SUB_MAP is now integrated into HIERARCHY_MAP for deep mapping

downloads_dir = r'c:\Users\eu\Downloads'
# Exact filenames from list_dir handles variations
# PRIMARY SOURCE only to avoid duplication
files = [
    "todos os produtos classe A.csv"
]

import re
def normalize_name(name):
    if not name: return ""
    # Standardize spaces including non-breaking spaces
    name = name.replace('\xa0', ' ').strip().upper()
    name = re.sub(r'\s+', ' ', name)
    return name

products = {}

for filename in files:
    filepath = os.path.join(downloads_dir, filename)
    if not os.path.exists(filepath):
        print(f"File not found: {filename}")
        continue
    
    print(f"Processing {filename}...")
    
    # Try different encodings
    success = False
    for enc in ['utf-8-sig', 'latin-1', 'cp1252']:
        try:
            with open(filepath, mode='r', encoding=enc) as f:
                first_line = f.readline()
                if not first_line: continue
                delimiter = ';' if ';' in first_line else ','
                f.seek(0)
                
                reader = csv.DictReader(f, delimiter=delimiter)
                count = 0
                for row in reader:
                    name = row.get('Nome')
                    if not name: 
                        # Try case insensitive
                        name = row.get('nome') or row.get('NOME')
                    
                    if not name: continue
                    name_key = normalize_name(name)
                    
                    if name_key not in products:
                        products[name_key] = {
                            'name': name.strip(),
                            'description': row.get('Descrição curta') or row.get('descrição curta') or '',
                            'stock_quantity': row.get('Estoque') or '0',
                            'weight': row.get('Peso (kg)') or '0.5',
                            'length': row.get('Comprimento (cm)') or '16',
                            'width': '11',
                            'height': row.get('Altura (cm)') or '2',
                            'price': row.get('Preço') or '0',
                            'categories': row.get('Categorias') or '',
                            'image_url': row.get('Imagens') or '',
                            'origin_zip': '82820-160'
                        }
                    else:
                        # Update with better data if available
                        if row.get('Preço'): products[name_key]['price'] = row['Preço']
                        if row.get('Estoque'): products[name_key]['stock_quantity'] = row['Estoque']
                        if row.get('Categorias'): products[name_key]['categories'] = row['Categorias']
                        if row.get('Imagens'): products[name_key]['image_url'] = row['Imagens']
                        if row.get('Descrição curta'): products[name_key]['description'] = row['Descrição curta']
                    count += 1
                print(f"  Read {count} rows from {filename}")
            success = True
            break
        except Exception as e:
            print(f"  Error with {enc} on {filename}: {e}")
            continue

# Clean and Map
final_list = []

def clean_to_float(val, default='0'):
    if not val: return default
    # Handle R$ and whitespace
    s = str(val).replace('R$', '').replace('\xa0', '').replace(' ', '').strip()
    # Handle Brazilian format (1.234,56 -> 1234.56)
    if ',' in s and '.' in s:
        s = s.replace('.', '').replace(',', '.')
    elif ',' in s:
        s = s.replace(',', '.')
    
    try:
        return str(float(s))
    except:
        return default

def clean_to_int(val, default='0'):
    if not val: return default
    # Extract first sequence of digits if it's a complex string like "1,38 x 1,88"
    s = str(val).replace('\xa0', '').replace(' ', '').strip()
    # Replace comma with dot first in case it's a float like "1,38"
    s = s.replace(',', '.')
    
    try:
        # Try direct float to int (e.g. "1.0" -> 1)
        return str(int(float(s.split(' ')[0].split('x')[0])))
    except:
        # Try to find any digit
        import re
        match = re.search(r'\d+', s)
        if match:
            return match.group()
        return default

for p in products.values():
    clean_price = clean_to_float(p['price'], '0')
    clean_weight = clean_to_float(p['weight'], '0.5')
    clean_stock = clean_to_int(p['stock_quantity'], '0')
    clean_length = clean_to_int(p['length'], '16')
    clean_width = clean_to_int(p['width'], '11')
    clean_height = clean_to_int(p['height'], '2')
        
    # Map Category/Subcategory using the new hierarchy
    final_cat_id = ''
    cat_str = p['categories'].upper()
    
    # Sort hierarchy by specificity (length of keyword)
    sorted_hierarchy = sorted(HIERARCHY_MAP.items(), key=lambda x: len(x[0]), reverse=True)
    
    match_found = False
    import re
    
    # Use word boundary matching for keywords to avoid partial matches (e.g., "SAPATO" matching "SAPATO SOCIAL")
    for keyword, (cid, sid) in sorted_hierarchy:
        # Check in name and category string with improved regex
        pattern = r'\b' + re.escape(keyword) + r'\b'
        name_search = p['name'].upper().replace('\xa0', ' ')
        if re.search(pattern, cat_str) or re.search(pattern, name_search):
            final_cat_id = sid
            match_found = True
            break
            
    if not match_found:
        # Fallback to main categories
        sorted_cats = sorted(CAT_MAP.items(), key=lambda x: len(x[0]), reverse=True)
        for cat_name, cid in sorted_cats:
            if cat_name in cat_str or cat_name in p['name'].upper().replace('\xa0', ' '):
                final_cat_id = cid
                break
            
    # Clean the description: replace literal \n with <br/> and handle encoding if necessary
    description_cleaned = p['description'] if p['description'] else 'Produtos Classe A'
    # Replace literal \n (backslash + n) with <br/>
    description_cleaned = description_cleaned.replace('\\n', '<br/>').replace('\n', '<br/>')
    
    # Clean the image URL: replace spaces with %20
    image_url_cleaned = p['image_url'].strip().replace(' ', '%20')
    
    final_list.append({
        'name': p['name'],
        'description': description_cleaned,
        'price': clean_price,
        'stock_quantity': clean_stock,
        'image_url': image_url_cleaned,
        'weight': clean_weight,
        'length': clean_length,
        'width': clean_width,
        'height': clean_height,
        'origin_zip': '82820-160',
        'category_id': final_cat_id
    })

output_file = r'c:\Users\eu\Documents\P4D\Projetos\Classe A\final_import_1_29.csv'
with open(output_file, mode='w', encoding='utf-8', newline='') as f:
    fieldnames = ['name', 'description', 'price', 'stock_quantity', 'image_url', 'weight', 'length', 'width', 'height', 'origin_zip', 'category_id']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(final_list)

print(f"Total unique products consolidated: {len(final_list)}")
print(f"File saved to: {output_file}")
