// Word dictionary for the syllable-picture game
// Each word has: word, syllables array, and image filename

export interface WordEntry {
    word: string;
    syllables: string[];
    image: string;
    category: '4-letters' | '6-letters' | '8-letters';
}

export const WORD_DICTIONARY: WordEntry[] = [
    // 4-letter words (простые)
    { word: 'МАМА', syllables: ['МА', 'МА'], image: 'mama.png', category: '4-letters' },
    { word: 'ПАПА', syllables: ['ПА', 'ПА'], image: 'papa.png', category: '4-letters' },
    { word: 'РЫБА', syllables: ['РЫ', 'БА'], image: 'ryba.png', category: '4-letters' },
    { word: 'ЛУНА', syllables: ['ЛУ', 'НА'], image: 'luna.png', category: '4-letters' },
    { word: 'РОЗА', syllables: ['РО', 'ЗА'], image: 'roza.png', category: '4-letters' },
    { word: 'КОЗА', syllables: ['КО', 'ЗА'], image: 'koza.png', category: '4-letters' },
    { word: 'ВАЗА', syllables: ['ВА', 'ЗА'], image: 'vaza.png', category: '4-letters' },
    { word: 'ДОМА', syllables: ['ДО', 'МА'], image: 'doma.png', category: '4-letters' },
    { word: 'КОШКА', syllables: ['КОШ', 'КА'], image: 'koshka.png', category: '4-letters' },
    { word: 'МЫШКА', syllables: ['МЫШ', 'КА'], image: 'myshka.png', category: '4-letters' },

    // 6-letter words (средние)
    { word: 'СОБАКА', syllables: ['СО', 'БА', 'КА'], image: 'sobaka.png', category: '6-letters' },
    { word: 'КОРОВА', syllables: ['КО', 'РО', 'ВА'], image: 'korova.png', category: '6-letters' },
    { word: 'ВОРОНА', syllables: ['ВО', 'РО', 'НА'], image: 'vorona.png', category: '6-letters' },
    { word: 'ЛОПАТА', syllables: ['ЛО', 'ПА', 'ТА'], image: 'lopata.png', category: '6-letters' },
    { word: 'РАКЕТА', syllables: ['РА', 'КЕ', 'ТА'], image: 'raketa.png', category: '6-letters' },
    { word: 'МАШИНА', syllables: ['МА', 'ШИ', 'НА'], image: 'mashina.png', category: '6-letters' },
    { word: 'БАНАН', syllables: ['БА', 'НАН'], image: 'banan.png', category: '6-letters' },
    { word: 'ЯБЛОКО', syllables: ['ЯБ', 'ЛО', 'КО'], image: 'yabloko.png', category: '6-letters' },
    { word: 'ДЕРЕВО', syllables: ['ДЕ', 'РЕ', 'ВО'], image: 'derevo.png', category: '6-letters' },
    { word: 'СОЛНЦЕ', syllables: ['СОЛН', 'ЦЕ'], image: 'solnce.png', category: '6-letters' },

    // 8-letter words (сложные)
    { word: 'БАБОЧКА', syllables: ['БА', 'БОЧ', 'КА'], image: 'babochka.png', category: '8-letters' },
    { word: 'САМОЛЁТ', syllables: ['СА', 'МО', 'ЛЁТ'], image: 'samolet.png', category: '8-letters' },
    { word: 'КРОКОДИЛ', syllables: ['КРО', 'КО', 'ДИЛ'], image: 'krokodil.png', category: '8-letters' },
    { word: 'ПОДСОЛНУХ', syllables: ['ПОД', 'СОЛ', 'НУХ'], image: 'podsolnuh.png', category: '8-letters' },
    { word: 'ВЕЛОСИПЕД', syllables: ['ВЕ', 'ЛО', 'СИ', 'ПЕД'], image: 'velosiped.png', category: '8-letters' },
    { word: 'ЧЕРЕПАХА', syllables: ['ЧЕ', 'РЕ', 'ПА', 'ХА'], image: 'cherepaha.png', category: '8-letters' },
    { word: 'КАРАНДАШ', syllables: ['КА', 'РАН', 'ДАШ'], image: 'karandash.png', category: '8-letters' },
    { word: 'АРБУЗ', syllables: ['АР', 'БУЗ'], image: 'arbuz.png', category: '8-letters' },
];

// Get random words for distractors (excluding the correct word)
export function getDistractors(correctWord: WordEntry, count: number): WordEntry[] {
    const otherWords = WORD_DICTIONARY.filter(w => w.word !== correctWord.word);
    const shuffled = [...otherWords].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Get a random word from the dictionary
export function getRandomWord(category?: WordEntry['category']): WordEntry {
    const filtered = category
        ? WORD_DICTIONARY.filter(w => w.category === category)
        : WORD_DICTIONARY;
    return filtered[Math.floor(Math.random() * filtered.length)];
}
