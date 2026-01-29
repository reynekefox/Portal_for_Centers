from gtts import gTTS
import os

# Extended list of words - organized by categories
words = [
    # Animals (already have 20, adding more)
    ("пчела", "bee"),
    ("бабочка", "butterfly"),
    ("курица", "chicken"),
    ("утка", "duck"),
    ("змея", "snake"),
    ("паук", "spider"),
    
    # Fruits & Vegetables
    ("яблоко", "apple"),
    ("банан", "banana"),
    ("морковь", "carrot"),
    ("огурец", "cucumber"),
    ("виноград", "grapes"),
    ("лимон", "lemon"),
    ("апельсин", "orange"),
    ("груша", "pear"),
    ("клубника", "strawberry"),
    ("помидор", "tomato"),
    ("арбуз", "watermelon"),
    ("картошка", "potato"),
    ("гриб", "mushroom"),
    
    # Food
    ("хлеб", "bread"),
    ("торт", "cake"),
    ("сыр", "cheese"),
    ("яйцо", "egg"),
    ("мороженое", "ice_cream"),
    ("молоко", "milk"),
    ("пицца", "pizza"),
    ("бургер", "burger"),
    ("сок", "juice"),
    
    # Transport
    ("самолёт", "airplane"),
    ("автобус", "bus"),
    ("машина", "car"),
    ("велосипед", "bicycle"),
    ("корабль", "ship"),
    ("поезд", "train"),
    
    # Household items
    ("кровать", "bed"),
    ("стул", "chair"),
    ("часы", "clock"),
    ("компьютер", "computer"),
    ("чашка", "cup"),
    ("дверь", "door"),
    ("вилка", "fork"),
    ("лампа", "lamp"),
    ("ключ", "key"),
    ("телефон", "phone"),
    ("подушка", "pillow"),
    ("тарелка", "plate"),
    ("диван", "sofa"),
    ("ложка", "spoon"),
    ("стол", "table"),
    ("телевизор", "television"),
    ("зонтик", "umbrella"),
    ("окно", "window"),
    ("книга", "book"),
    ("карандаш", "pencil"),
    
    # Clothes
    ("сапоги", "boots"),
    ("платье", "dress"),
    ("очки", "glasses"),
    ("перчатки", "gloves"),
    ("шапка", "hat"),
    ("куртка", "jacket"),
    ("брюки", "pants"),
    ("шарф", "scarf"),
    ("рубашка", "shirt"),
    ("шорты", "shorts"),
    ("юбка", "skirt"),
    ("футболка", "tshirt"),
    
    # Nature
    ("облако", "cloud"),
    ("цветок", "flower"),
    ("дом", "house"),
    ("гора", "mountain"),
    ("луна", "moon"),
    ("дождь", "rain"),
    ("снеговик", "snowman"),
    ("звезда", "star"),
    ("солнце", "sun"),
    ("дерево", "tree"),
    
    # Other objects
    ("мяч", "ball"),
    ("рюкзак", "backpack"),
    ("сумка", "bag"),
    ("ведро", "bucket"),
    ("воздушный змей", "kite"),
    ("замок", "lock"),
    ("лопата", "shovel"),
]

output_dir = r"c:\_Dev\Portal_for_Centers\ScreenCreator\client\public\auditory-test\audio"
os.makedirs(output_dir, exist_ok=True)

# Check which files already exist
existing_files = set(os.listdir(output_dir))

generated = 0
skipped = 0

for word, filename in words:
    output_path = os.path.join(output_dir, f"{filename}.mp3")
    if f"{filename}.mp3" in existing_files:
        print(f"Skipping (exists): {word}")
        skipped += 1
        continue
    
    print(f"Generating: {word} -> {filename}.mp3")
    tts = gTTS(text=word, lang='ru')
    tts.save(output_path)
    generated += 1

print(f"\nDone! Generated {generated} new files, skipped {skipped} existing.")
print(f"Total audio files: {len(os.listdir(output_dir))}")
