import os
import shutil

# Source and Target
source_base = r"c:\_Dev\Portal_for_Centers\temp_animal_sounds"
target_dir = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\public\auditory-test\audio\animals"

# Ensure target exists
os.makedirs(target_dir, exist_ok=True)

# Categories and their source folders
categories = {
    "lion": "Aslan",
    "donkey": "Esek",
    "cow": "Inek",
    "cat": "Kedi-Part1", # Using Part1 for simplicity
    "dog": "Kopek-Part1",
    "sheep": "Koyun",
    "frog": "Kurbaga",
    "bird": "Kus-Part1",
    "monkey": "Maymun",
    "chicken": "Tavuk"
}

print(f"Copying 30 more files to {target_dir}...")

copied_count = 0

for animal_name, folder_name in categories.items():
    source_folder_path = os.path.join(source_base, folder_name)
    
    if os.path.exists(source_folder_path):
        files = os.listdir(source_folder_path)
        # Sort to be deterministic
        files.sort()
        wav_files = [f for f in files if f.endswith('.wav')]
        
        # We already used the "first" file (usually _1.wav) in the previous step (via setup_animal_sounds.py)
        # So we skip the first one and take the next 3
        # Logic: take index 1, 2, 3 (files[1], files[2], files[3])
        
        needed = 3
        taken = 0
        
        # Simple heuristic: skip files that end with _1.wav if possible to avoid dupes from previous run
        # but setup_animal_sounds.py used mapping, mostly _1.wav.
        
        for i in range(len(wav_files)):
            if taken >= needed:
                break
                
            file = wav_files[i]
            
            # Check if this file was likely used before (ends in _1.wav or just "1.wav")
            # Actually, let's just create new names like "lion_2.wav", "lion_3.wav", "lion_4.wav"
            # and verify we don't overwrite "lion.wav" (which we created last time)
            
            # Skip if it looks like the first one we picked (heuristic: ends with 1.wav)
            if file.endswith('_1.wav'):
                continue
                
            taken += 1
            target_filename = f"{animal_name}_{taken + 1}.wav" # e.g. lion_2.wav
            
            source_file = os.path.join(source_folder_path, file)
            target_file = os.path.join(target_dir, target_filename)
            
            shutil.copy2(source_file, target_file)
            print(f"[OK] {target_filename} <- {file}")
            copied_count += 1
            
    else:
        print(f"[FAIL] Folder not found: {folder_name}")

print(f"\nCopied {copied_count} files.")
