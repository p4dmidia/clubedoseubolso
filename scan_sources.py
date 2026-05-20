import csv
import io

def scan():
    try:
        f = open(r'c:\Users\eu\Downloads\todos os produtos classe A.csv', mode='r', encoding='utf-8-sig')
        reader = csv.DictReader(f)
        if not reader.fieldnames or len(reader.fieldnames) < 2:
            f.close()
            raise Exception("Retry with semicolon")
    except:
        f = open(r'c:\Users\eu\Downloads\todos os produtos classe A.csv', mode='r', encoding='latin-1')
        reader = csv.DictReader(f, delimiter=',')
        if not reader.fieldnames or len(reader.fieldnames) < 2:
            f.close()
            f = open(r'c:\Users\eu\Downloads\todos os produtos classe A.csv', mode='r', encoding='latin-1')
            reader = csv.DictReader(f, delimiter=';')

    print("SCANNING FIRST 50 PRODUCTS:")
    count = 0
    for row in reader:
        name = row.get('Nome', 'N/A')
        cats = row.get('Categorias', 'N/A')
        print(f"{count+1}. {name} | CATS: {cats}")
        count += 1
        if count >= 50: break
    f.close()

if __name__ == "__main__":
    scan()
