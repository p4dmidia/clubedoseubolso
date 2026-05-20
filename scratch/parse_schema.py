import json
import os

def try_load(path):
    encodings = ['utf-16', 'utf-8', 'utf-16-le', 'utf-16-be', 'latin-1']
    for enc in encodings:
        try:
            with open(path, "r", encoding=enc) as f:
                data = json.load(f)
            return data
        except Exception as e:
            continue
    return None

schema_path = "actual_schema.json"
data = try_load(schema_path)

if data and "definitions" in data:
    definitions = data["definitions"]
    
    with open("scratch/schema_summary.txt", "w", encoding="utf-8") as out:
        out.write(f"Total tables/views found in definitions: {len(definitions)}\n")
        for table_name, table_info in sorted(definitions.items()):
            properties = table_info.get("properties", {})
            required = table_info.get("required", [])
            desc = table_info.get("description", "")
            out.write(f"\nTable: {table_name}\n")
            if desc:
                out.write(f"  Description: {desc}\n")
            out.write("  Columns:\n")
            for col_name, col_info in properties.items():
                col_type = col_info.get("type")
                format_str = col_info.get("format")
                is_req = "REQUIRED" if col_name in required else "OPTIONAL"
                foreign_key_desc = col_info.get("description", "")
                fk_note = ""
                if "Note:" in foreign_key_desc:
                    fk_note = " -> " + foreign_key_desc.split("Note:")[1].strip()
                
                out.write(f"    - {col_name}: {col_type} ({format_str or 'no format'}) - {is_req}{fk_note}\n")
    print("Schema written to scratch/schema_summary.txt successfully")
else:
    print("Failed to read definitions")
