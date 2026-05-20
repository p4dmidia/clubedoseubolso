import os

mcp_dir = "C:\\Users\\eu\\.gemini\\antigravity\\mcp\\supabase-mcp-server"
if os.path.exists(mcp_dir):
    for file in os.listdir(mcp_dir):
        print(file)
else:
    print("mcp directory not found")
