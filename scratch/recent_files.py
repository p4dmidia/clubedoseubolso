import os
import time

root_dir = r"c:\Users\eu\Documents\P4D\Projetos\clube do seu bolso"
now = time.time()
two_days = 2 * 24 * 3600

recent_files = []
for dirpath, dirnames, filenames in os.walk(root_dir):
    if "node_modules" in dirpath or ".git" in dirpath:
        continue
    for filename in filenames:
        full_path = os.path.join(dirpath, filename)
        try:
            mtime = os.path.getmtime(full_path)
            if now - mtime < two_days:
                recent_files.append((full_path, mtime))
        except Exception:
            pass

recent_files.sort(key=lambda x: x[1], reverse=True)
print("Files modified in last 48 hours:")
for path, mtime in recent_files:
    print(f"{time.ctime(mtime)}: {path}")
