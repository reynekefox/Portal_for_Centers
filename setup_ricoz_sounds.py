import os
import shutil

# Source and Target
source_base = r"c:\_Dev\Portal_for_Centers\temp_ricoz\audio\sounds"
target_dir = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\public\auditory-test\audio\animals"

# Ensure target exists
os.makedirs(target_dir, exist_ok=True)

# List of all available files in source
if not os.path.exists(source_base):
    print(f"Error: Source directory {source_base} does not exist.")
    exit(1)

files = [f for f in os.listdir(source_base) if f.endswith('.mp3')]

print(f"Found {len(files)} files in source.")

copied_count = 0

for file in files:
    source_file = os.path.join(source_base, file)
    
    # Check if we already have this animal (by name prefix like 'lion', 'dog')
    # But since these are new variations or new species, we generally want them.
    # The existing files are .wav, these are .mp3. This is fine, we can support both.
    
    # We want to rename them to match our flat structure or keep names if unique.
    # Existing structure: lion.wav, lion_2.wav... 
    # New file: lion.mp3 -> lion_ricoz.mp3 or just lion_5.mp3 (converted? no, just use mp3)
    
    # To keep it simple and distinguishable, let's keep the filename but ensure no collision
    # If target has 'lion.wav', adding 'lion.mp3' is fine as file extension differs.
    # But for cleaner organization, maybe 'lion_r.mp3' (r for ricoz)? Or just 'lion.mp3'.
    
    target_file = os.path.join(target_dir, file)
    
    # If file exists, we might overwrite, which is fine if it's better, 
    # but likely we don't have .mp3 in that folder yet (only .wavs from previous steps).
    
    shutil.copy2(source_file, target_file)
    print(f"[OK] {file}")
    copied_count += 1

print(f"\nSuccessfully copied {copied_count} new files.")
