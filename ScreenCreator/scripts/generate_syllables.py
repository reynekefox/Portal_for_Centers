#!/usr/bin/env python3
"""Generate syllable audio files using gTTS (Google Text-to-Speech)"""

from gtts import gTTS
import os

# Output directory
OUTPUT_DIR = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\public\syllables"

# All syllables used in the game (2-letter syllables for syllable-picture-game)
SYLLABLES = [
    # Vowel combinations
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

# Phonetic corrections for better pronunciation
PHONETIC_MAP = {
    'ГУ': 'гуу',
    'РЫ': 'рыы',
    'БО': 'боо',
    'ВО': 'воо',
    'ГО': 'гоо',
    'ДО': 'доо',
    'ЗО': 'зоо',
    'КО': 'коо',
    'ЛО': 'лоо',
    'МО': 'моо',
    'НО': 'ноо',
    'ПО': 'поо',
    'РО': 'роо',
    'СО': 'соо',
    'ТО': 'тоо',
}

def generate_syllable_audio(syllable: str, output_dir: str) -> str:
    """Generate MP3 file for a syllable"""
    # Use phonetic correction if available
    text = PHONETIC_MAP.get(syllable, syllable.lower())
    
    # Generate audio
    tts = gTTS(text=text, lang='ru', slow=True)
    
    # Save to file
    filename = f"{syllable.lower()}.mp3"
    filepath = os.path.join(output_dir, filename)
    tts.save(filepath)
    
    return filepath

def main():
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"Generating {len(SYLLABLES)} syllable audio files...")
    print(f"Output directory: {OUTPUT_DIR}")
    print()
    
    for i, syllable in enumerate(SYLLABLES, 1):
        try:
            filepath = generate_syllable_audio(syllable, OUTPUT_DIR)
            print(f"[{i}/{len(SYLLABLES)}] Generated: {os.path.basename(filepath)}")
        except Exception as e:
            print(f"[{i}/{len(SYLLABLES)}] ERROR: {e}")
    
    print()
    print("Done!")

if __name__ == "__main__":
    main()
