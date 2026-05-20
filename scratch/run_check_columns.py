import os

schema_path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\supabase_complete_schema.sql"
with open(schema_path, "r", encoding="utf-8") as f:
    schema = f.read()

# Find user_profiles table definition
start = schema.find("CREATE TABLE public.user_profiles")
if start != -1:
    end = schema.find(");", start)
    print(schema[start:end+2])
else:
    print("user_profiles not found")
