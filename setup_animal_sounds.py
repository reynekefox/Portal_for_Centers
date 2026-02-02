import os
import shutil

# Source and Target
source_base = r"c:\_Dev\Portal_for_Centers\temp_animal_sounds"
target_dir = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\public\auditory-test\audio\animals"

# Ensure target exists
os.makedirs(target_dir, exist_ok=True)

# Mapping: Target Filename -> Source Path (relative to repo root)
files_to_copy = {
    "lion.wav": "Aslan/lion_1.wav",
    "donkey.wav": "Esek/donkey_1.wav",
    "cow.wav": "Inek/cow_1.wav",
    "cat.wav": "Kedi-Part1/cat_1.wav",
    "dog.wav": "Kopek-Part1/dog_1.wav",
    "sheep.wav": "Koyun/sheep_1.wav",
    "frog.wav": "Kurbaga/frog_1.wav",
    "bird.wav": "Kus-Part1/bird_1.wav",
    "monkey.wav": "Maymun/monkey_1.wav",
    "chicken.wav": "Tavuk/chicken_1.wav"
}

print(f"Copying files to {target_dir}...")

copied_count = 0
for target_name, source_rel_path in files_to_copy.items():
    source_path = os.path.join(source_base, source_rel_path)
    target_path = os.path.join(target_dir, target_name)
    
    # Handle potential naming differences in source if needed
    # (Based on folder listing, filenames seem to be english e.g. cat_1.wav inside Kedi-Part1)
    # Let's verify specific paths if this fails, but based on "cat_1.wav" in "Kedi-Part1", assume pattern holds.
    
    if os.path.exists(source_path):
        shutil.copy2(source_path, target_path)
        print(f"[OK] {target_name}")
        copied_count += 1
    else:
        # Fallback: try different naming convention or find first file in dir
        dir_name = os.path.dirname(source_rel_path)
        full_dir_path = os.path.join(source_base, dir_name)
        if os.path.exists(full_dir_path):
            files = os.listdir(full_dir_path)
            if files:
                first_wav = next((f for f in files if f.endswith('.wav')), None)
                if first_wav:
                    source_path = os.path.join(full_dir_path, first_wav)
                    shutil.copy2(source_path, target_path)
                    print(f"[OK] {target_name} (using fallback {first_wav})")
                    copied_count += 1
                else:
                    print(f"[FAIL] No wav files in {dir_name}")
            else:
                print(f"[FAIL] Empty directory {dir_name}")
        else:
            print(f"[FAIL] Source not found: {source_path}")

print(f"\nCopied {copied_count} files.")
