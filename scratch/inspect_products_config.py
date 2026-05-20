# Inspect products schema and AdminProducts saving logic
import os

schema_path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\supabase_complete_schema.sql"
with open(schema_path, "r", encoding="utf-8") as f:
    schema = f.read()

# Find products table definition
start = schema.find("CREATE TABLE public.products")
if start != -1:
    end = schema.find(");", start)
    print(schema[start:end+2])

# Let's check AdminProducts.tsx to see how commissions are stored
admin_products_path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\pages\\AdminProducts.tsx"
with open(admin_products_path, "r", encoding="utf-8") as f:
    admin_products = f.read()

# Search for commission fields in AdminProducts
lines = admin_products.split("\n")
for i, line in enumerate(lines):
    if "comiss" in line.lower() or "commission" in line.lower():
        print(f"AdminProducts line {i+1}: {line}")
