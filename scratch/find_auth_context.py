import os

for root, dirs, files in os.walk("c:\\Users\\eu\\Documents\\P4D\\Projetos\\clube do seu bolso"):
    for file in files:
        if "authcontext" in file.lower():
            print(f"Found AuthContext file: {file} at {os.path.join(root, file)}")
