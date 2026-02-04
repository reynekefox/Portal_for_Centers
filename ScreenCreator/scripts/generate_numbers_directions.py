#!/usr/bin/env python3
"""Generate audio files for numbers and directions using edge-tts"""

import asyncio
import edge_tts
import os

OUTPUT_NUMBERS = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\public\audio\numbers"
OUTPUT_DIRECTIONS = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\public\audio\directions"

VOICE = "ru-RU-DmitryNeural"

NUMBERS = [
    ('1', 'один'),
    ('2', 'два'),
    ('3', 'три'),
    ('4', 'четыре'),
    ('5', 'пять'),
    ('6', 'шесть'),
    ('7', 'семь'),
    ('8', 'восемь'),
    ('9', 'девять'),
]

DIRECTIONS = [
    ('left', 'налево'),
    ('right', 'направо'),
    ('up', 'вверх'),
    ('down', 'вниз'),
]

async def generate_audio(text, filepath):
    communicate = edge_tts.Communicate(text, VOICE, rate="-10%")
    await communicate.save(filepath)

async def main():
    os.makedirs(OUTPUT_NUMBERS, exist_ok=True)
    os.makedirs(OUTPUT_DIRECTIONS, exist_ok=True)
    
    count = 0
    for filename, word in NUMBERS:
        filepath = os.path.join(OUTPUT_NUMBERS, f"{filename}.mp3")
        await generate_audio(word, filepath)
        count += 1
        print(f"[{count}/13] OK")
    
    for filename, word in DIRECTIONS:
        filepath = os.path.join(OUTPUT_DIRECTIONS, f"{filename}.mp3")
        await generate_audio(word, filepath)
        count += 1
        print(f"[{count}/13] OK")
    
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
