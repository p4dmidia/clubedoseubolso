import json

def check():
    try:
        with open('openapi_spec.json', 'r', encoding='utf-8') as f:
            swagger = json.load(f)
            definitions = swagger.get('definitions', {})
            
            for table in ['user_settings', 'withdrawals']:
                if table in definitions:
                    print(f"--- Columns in {table} ---")
                    props = definitions[table].get('properties', {})
                    for col, detail in props.items():
                        print(f"  {col}: {detail.get('type')} ({detail.get('description', '')})")
                else:
                    print(f"Table {table} not found in definitions")
    except Exception as e:
        print("Error reading openapi_spec.json:", e)

if __name__ == '__main__':
    check()
