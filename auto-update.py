import os
import json

# Path to your /games/ folder (adjust if running from project root)
GAMES_DIR = "games"
OUTPUT_FILE = os.path.join(GAMES_DIR, "games.json")

games_list = []

# Iterate through each item in the /games/ folder
for folder_name in os.listdir(GAMES_DIR):
    folder_path = os.path.join(GAMES_DIR, folder_name)
    code_path = os.path.join(folder_path, "code")

    # Only include directories that have a 'code' folder with index.html
    if os.path.isdir(folder_path) and os.path.isdir(code_path):
        index_file = os.path.join(code_path, "index.html")
        if os.path.exists(index_file):
            games_list.append({
                "name": folder_name,
                "folder": f"{folder_name}/code"
            })

# Sort alphabetically
games_list.sort(key=lambda x: x["name"])

# Write to games.json
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(games_list, f, indent=2)

print(f"games.json updated with {len(games_list)} games.")
