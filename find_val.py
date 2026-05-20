import csv

output_file = r'c:\Users\eu\Documents\P4D\Projetos\Classe A\final_import_1_29.csv'
with open(output_file, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader, 2):
        for col, val in row.items():
            if '1.38' in str(val) or '1,38' in str(val):
                print(f"Line {i}, Column '{col}': {val}")
