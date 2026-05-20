import os

root_dir = r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso"
found = []
for dirpath, dirnames, filenames in os.walk(root_dir):
    if "node_modules" in dirpath or ".git" in dirpath:
        continue
    for filename in filenames:
        if "checkout" in filename.lower():
            found.append(os.path.join(dirpath, filename))

print("Found checkout files:")
for f in found:
    print(f)
