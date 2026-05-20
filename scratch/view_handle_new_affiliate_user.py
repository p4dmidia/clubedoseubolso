import os

schema_path = "c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso\\supabase_complete_schema.sql"
with open(schema_path, "r", encoding="utf-8") as f:
    schema = f.read()

start = schema.find("CREATE OR REPLACE FUNCTION public.handle_new_affiliate_user()")
if start != -1:
    end = schema.find("CREATE TRIGGER on_auth_user_created", start)
    if end != -1:
        print(schema[start:end])
    else:
        print(schema[start:start+2000])
else:
    print("handle_new_affiliate_user not found")
