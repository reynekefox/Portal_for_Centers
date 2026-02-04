#!/usr/bin/env python3
"""Generate syllable audio files using edge-tts (Microsoft Edge TTS)"""

import asyncio
import edge_tts
import os

# Output directory
OUTPUT_DIR = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\public\syllables"

# Russian voice
VOICE = "ru-RU-DmitryNeural"  # Male voice

# All syllables
SYLLABLES = [
    'БА', 'БО', 'БУ', 'БЫ', 'БЕ', 'БИ',
    'ВА', 'ВО', 'ВУ', 'ВЫ', 'ВЕ', 'ВИ',
    'ГА', 'ГО', 'ГУ', 'ГЫ', 'ГЕ', 'ГИ',
    'ДА', 'ДО', 'ДУ', 'ДЫ', 'ДЕ', 'ДИ',
    'ЖА', 'ЖО', 'ЖУ', 'ЖИ', 'ЖЕ',
    'ЗА', 'ЗО', 'ЗУ', 'ЗЫ', 'ЗЕ', 'ЗИ',
    'КА', 'КО', 'КУ', 'КЫ', 'КЕ', 'КИ',
    'ЛА', 'ЛО', 'ЛУ', 'ЛЫ', 'ЛЕ', 'ЛИ',
    'МА', 'МО', 'МУ', 'МЫ', 'МЕ', 'МИ',
    'НА', 'НО', 'НУ', 'НЫ', 'НЕ', 'НИ',
    'ПА', 'ПО', 'ПУ', 'ПЫ', 'ПЕ', 'ПИ',
    'РА', 'РО', 'РУ', 'РЫ', 'РЕ', 'РИ',
    'СА', 'СО', 'СУ', 'СЫ', 'СЕ', 'СИ',
    'ТА', 'ТО', 'ТУ', 'ТЫ', 'ТЕ', 'ТИ',
    'ФА', 'ФО', 'ФУ', 'ФЫ', 'ФЕ', 'ФИ',
    'ХА', 'ХО', 'ХУ', 'ХЫ', 'ХЕ', 'ХИ',
    'ЦА', 'ЦО', 'ЦУ', 'ЦЫ', 'ЦЕ', 'ЦИ',
    'ЧА', 'ЧО', 'ЧУ', 'ЧЕ', 'ЧИ',
    'ША', 'ШО', 'ШУ', 'ШЕ', 'ШИ',
    'ЩА', 'ЩО', 'ЩУ', 'ЩЕ', 'ЩИ',
]

async def generate_syllable(syllable: str, output_dir: str) -> str:
    """Generate MP3 file for a syllable"""
    filename = f"{syllable.lower()}.mp3"
    filepath = os.path.join(output_dir, filename)
    
    communicate = edge_tts.Communicate(syllable.lower(), VOICE, rate="-20%")
    await communicate.save(filepath)
    
    return filepath

async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"Generating {len(SYLLABLES)} syllables with edge-tts...")
    print(f"Voice: {VOICE}")
    print(f"Output: {OUTPUT_DIR}")
    print()
    
    success = 0
    errors = 0
    
    for i, syllable in enumerate(SYLLABLES, 1):
        try:
            await generate_syllable(syllable, OUTPUT_DIR)
            print(f"[{i}/{len(SYLLABLES)}] OK: {syllable.lower()}.mp3")
            success += 1
        except Exception as e:
            print(f"[{i}/{len(SYLLABLES)}] FAIL: {e}")
            errors += 1
    
    print()
    print(f"Done! Success: {success}, Errors: {errors}")

if __name__ == "__main__":
    asyncio.run(main())
