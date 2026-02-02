import csv
import os
import shutil

# Path setup
esc50_path = r"c:\_Dev\Portal_for_Centers\temp_esc50"
audio_dir = os.path.join(esc50_path, "audio")
meta_file = os.path.join(esc50_path, "meta", "esc50.csv")
target_dir = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\public\auditory-test\audio\animals"

# Ensure target exists
os.makedirs(target_dir, exist_ok=True)

# Desired categories from ESC-50 to add
desired_categories = {
    "pig": "pig",
    "rooster": "rooster",
    "hen": "hen",
    "insects": "insects",
    "crow": "crow",
    # Optional: add more variations for existing ones if different quality
    # "dog": "dog", 
    # "cat": "cat",
    # "cow": "cow",
    # "sheep": "sheep",
    # "frog": "frog"
}

print(f"Reading metadata from {meta_file}...")

files_to_copy = []

with open(meta_file, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        category = row['category']
        filename = row['filename']
        
        if category in desired_categories:
            files_to_copy.append({
                "filename": filename,
                "category": desired_categories[category]
            })

print(f"Found {len(files_to_copy)} potential files.")

# Copy files
copied_count = {}

for item in files_to_copy:
    src = os.path.join(audio_dir, item['filename'])
    
    # Generate new filename: category_1.wav, category_2.wav, etc.
    # We need to check existing files in target to avoid overwriting or collision
    # But since we want to add *new* species (pig, rooster, etc.) we can start from 1
    # For existing species, we should check what's there.
    
    cat = item['category']
    if cat not in copied_count:
        copied_count[cat] = 0
    
    copied_count[cat] += 1
    
    # Naming convention: pig_1.wav, pig_2.wav... 
    # Validating if we need to offset index based on existing files?
    # For new species (pig, rooster, hen, insects, crow) it doesn't matter.
    
    new_filename = f"{cat}_{copied_count[cat]}.wav"
    dst = os.path.join(target_dir, new_filename)
    
    shutil.copy2(src, dst)
    print(f"[OK] {new_filename} <- {item['filename']}")

print("\nSummary:")
for cat, count in copied_count.items():
    print(f"{cat}: {count} files")
