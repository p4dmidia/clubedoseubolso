import os

for root, dirs, files in os.walk("c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso"):
    for file in files:
        if file.endswith((".tsx", ".ts")):
            if "register" in file.lower() or "login" in file.lower() or "signup" in file.lower():
                print(os.path.join(root, file))
