#!/usr/bin/env python3
"""Generate audio files for Russian letters using edge-tts"""

import asyncio
import edge_tts
import os

OUTPUT_DIR = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\public\audio\letters"

VOICE = "ru-RU-DmitryNeural"

# Letters for N-back game - each tuple: (filename, spoken text)
LETTERS = [
    ('a', 'А'),
    ('b', 'Б'),
    ('v', 'В'),
    ('g', 'Г'),
    ('d', 'Д'),
    ('e', 'Е'),
    ('zh', 'Ж'),
    ('z', 'З'),
    ('i', 'И'),
    ('k', 'К'),
    ('l', 'Л'),
    ('m', 'М'),
    ('n', 'Н'),
    ('o', 'О'),
    ('p', 'П'),
    ('r', 'Р'),
    ('s', 'С'),
    ('t', 'Т'),
    ('u', 'У'),
    ('f', 'Ф'),
    ('h', 'Х'),
    ('ts', 'Ц'),
]

async def generate_audio(text, filepath):
    communicate = edge_tts.Communicate(text, VOICE, rate="-10%")
    await communicate.save(filepath)

async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    total = len(LETTERS)
    for i, (filename, letter) in enumerate(LETTERS, 1):
        filepath = os.path.join(OUTPUT_DIR, f"{filename}.mp3")
        await generate_audio(letter, filepath)
        print(f"[{i}/{total}] {filename}.mp3 OK")
    
    print("\nDone! Generated", total, "audio files")

if __name__ == "__main__":
    asyncio.run(main())
