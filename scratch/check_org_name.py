from supabase import create_client, Client

def check_orgs():
    url = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"
    
    supabase: Client = create_client(url, key)
    try:
        response = supabase.table("organizations").select("id, name").execute()
        print("Organizations:")
        for org in response.data:
            print(f"ID: {org['id']} | Name: {org['name']}")
    except Exception as e:
        print(f"Error checking organizations: {e}")

if __name__ == "__main__":
    check_orgs()
