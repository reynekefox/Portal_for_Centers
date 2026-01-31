#!/usr/bin/env python3
"""
Script to remove backgrounds from animal images using rembg library.
Forces TRUE transparency by converting to RGBA and removing white background.
"""

import os
from pathlib import Path
from rembg import remove
from PIL import Image
import numpy as np

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ANIMALS_DIR = PROJECT_ROOT / "client" / "public" / "animals"

def remove_background_with_transparency(input_path: Path, output_path: Path):
    """Remove background and ensure TRUE transparency."""
    print(f"Processing {input_path.name}...")
    
    # Open image
    input_img = Image.open(input_path)
    
    # Remove background using rembg
    output_img = remove(input_img)
    
    # Convert to RGBA if not already
    if output_img.mode != 'RGBA':
        output_img = output_img.convert('RGBA')
    
    # Get pixel data
    data = output_img.getdata()
    
    # Create new image data with truly transparent pixels
    new_data = []
    for item in data:
        # If pixel is white or near-white (background), make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240 and item[3] < 10:
            # Fully transparent
            new_data.append((255, 255, 255, 0))
        else:
            # Keep original
            new_data.append(item)
    
    # Update image data
    output_img.putdata(new_data)
    
    # Save with transparency
    output_img.save(output_path, 'PNG')
    
    print(f"✓ Saved to {output_path.name} with TRUE transparency")

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
        print("No PNG files found in animals directory")
        return
    
    print(f"Found {len(image_files)} images to process\n")
    
    # Process each image
    for image_path in sorted(image_files):
        try:
            remove_background_with_transparency(image_path, image_path)
        except Exception as e:
            print(f"✗ Error processing {image_path.name}: {e}")
    
    print("\n" + "=" * 50)
    print("Done! All images processed with TRUE transparency.")

if __name__ == "__main__":
    main()
