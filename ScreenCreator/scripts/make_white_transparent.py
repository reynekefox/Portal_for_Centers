#!/usr/bin/env python3
"""
Script to make white/light backgrounds fully transparent.
Removes white pixels from images.
"""

from pathlib import Path
from PIL import Image
import numpy as np

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ANIMALS_DIR = PROJECT_ROOT / "client" / "public" / "animals"

def make_white_transparent(input_path: Path, output_path: Path, threshold: int = 245):
    """Make white/near-white pixels transparent."""
    print(f"Processing {input_path.name}...")
    
    # Open image and convert to RGBA
    img = Image.open(input_path).convert('RGBA')
    data = np.array(img)
    
    # Create mask for white-ish pixels (R, G, B all > threshold)
    white_mask = (data[:, :, 0] > threshold) & (data[:, :, 1] > threshold) & (data[:, :, 2] > threshold)
    
    # Set alpha to 0 for white pixels
    data[white_mask, 3] = 0
    
    # Save result
    result = Image.fromarray(data, 'RGBA')
    result.save(output_path, 'PNG')
    
    print(f"✓ Saved {output_path.name} with white pixels removed")

def main():
    """Process all animal images."""
    if not ANIMALS_DIR.exists():
        print(f"Error: Animals directory not found at {ANIMALS_DIR}")
        return
    
    print(f"Animals directory: {ANIMALS_DIR}")
    print("=" * 50)
    
    # Get all PNG files
    image_files = list(ANIMALS_DIR.glob("*.png"))
    
    if not image_files:
        print("No PNG files found")
        return
    
    print(f"Found {len(image_files)} images\n")
    
    for image_path in sorted(image_files):
        try:
            make_white_transparent(image_path, image_path, threshold=240)
        except Exception as e:
            print(f"✗ Error: {image_path.name}: {e}")
    
    print("\n" + "=" * 50)
    print("Done! White pixels removed.")

if __name__ == "__main__":
    main()
