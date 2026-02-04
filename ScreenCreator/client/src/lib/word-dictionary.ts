// Word dictionary for syllable-picture and memory card games
// Each word has: word, syllables array, image filename, and category

export type WordCategory =
    | 'animals'   // Животные
    | 'food'      // Еда
    | 'items'     // Предметы
    | 'nature'    // Природа
    | 'transport' // Транспорт
    | 'clothes'   // Одежда
    | 'family';   // Семья

export const CATEGORY_LABELS: Record<WordCategory, string> = {
    animals: 'Животные',
    food: 'Еда',
    items: 'Предметы',
    nature: 'Природа',
    transport: 'Транспорт',
    clothes: 'Одежда',
    family: 'Семья',
};

export interface WordEntry {
    word: string;
    syllables: string[];
    image: string;
    category: WordCategory;
}

export const WORD_DICTIONARY: WordEntry[] = [
    // === 1 СЛОГ ===
    // Животные
    { word: 'ГУСЬ', syllables: ['ГУСЬ'], image: 'gus.png', category: 'animals' },
    { word: 'ЛЕВ', syllables: ['ЛЕВ'], image: 'lev.png', category: 'animals' },
    { word: 'СЛОН', syllables: ['СЛОН'], image: 'slon.png', category: 'animals' },
    { word: 'ТИГР', syllables: ['ТИГР'], image: 'tigr.png', category: 'animals' },
    { word: 'ВОЛК', syllables: ['ВОЛК'], image: 'volk.png', category: 'animals' },
    { word: 'ЖУК', syllables: ['ЖУК'], image: 'zhuk.png', category: 'animals' },
    { word: 'КИТ', syllables: ['КИТ'], image: 'kit.png', category: 'animals' },

    // Предметы (1 слог)
    { word: 'КЛЮЧ', syllables: ['КЛЮЧ'], image: 'klyuch.png', category: 'items' },
    { word: 'ДВЕРЬ', syllables: ['ДВЕРЬ'], image: 'dver.png', category: 'items' },
    { word: 'СТОЛ', syllables: ['СТОЛ'], image: 'stol.png', category: 'items' },
    { word: 'СТУЛ', syllables: ['СТУЛ'], image: 'stul.png', category: 'items' },
    { word: 'МЯЧ', syllables: ['МЯЧ'], image: 'myach.png', category: 'items' },
    { word: 'ЗОНТ', syllables: ['ЗОНТ'], image: 'zont.png', category: 'items' },

    // Еда (1 слог)
    { word: 'ГРИБ', syllables: ['ГРИБ'], image: 'grib.png', category: 'food' },
    { word: 'ТОРТ', syllables: ['ТОРТ'], image: 'tort.png', category: 'food' },

    // === 2 СЛОГА ===
    // Семья
    { word: 'МАМА', syllables: ['МА', 'МА'], image: 'mama.png', category: 'family' },
    { word: 'ПАПА', syllables: ['ПА', 'ПА'], image: 'papa.png', category: 'family' },
    { word: 'БАБА', syllables: ['БА', 'БА'], image: 'baba.png', category: 'family' },
    { word: 'ДЯДЯ', syllables: ['ДЯ', 'ДЯ'], image: 'dyadya.png', category: 'family' },
    { word: 'ТЁТЯ', syllables: ['ТЁ', 'ТЯ'], image: 'tyotya.png', category: 'family' },

    // Природа (2 слога)
    { word: 'ВОДА', syllables: ['ВО', 'ДА'], image: 'voda.png', category: 'nature' },
    { word: 'ГОРА', syllables: ['ГО', 'РА'], image: 'gora.png', category: 'nature' },
    { word: 'НЕБО', syllables: ['НЕ', 'БО'], image: 'nebo.png', category: 'nature' },
    { word: 'МОРЕ', syllables: ['МО', 'РЕ'], image: 'more.png', category: 'nature' },
    { word: 'ЛУНА', syllables: ['ЛУ', 'НА'], image: 'luna.png', category: 'nature' },
    { word: 'РОЗА', syllables: ['РО', 'ЗА'], image: 'roza.png', category: 'nature' },
    { word: 'СОЛНЦЕ', syllables: ['СОЛН', 'ЦЕ'], image: 'solnce.png', category: 'nature' },
    { word: 'ЗВЕЗДА', syllables: ['ЗВЕЗ', 'ДА'], image: 'zvezda.png', category: 'nature' },
    { word: 'ТРАВА', syllables: ['ТРА', 'ВА'], image: 'trava.png', category: 'nature' },
    { word: 'ВЕТКА', syllables: ['ВЕТ', 'КА'], image: 'vetka.png', category: 'nature' },
    { word: 'ШИШКА', syllables: ['ШИШ', 'КА'], image: 'shishka.png', category: 'nature' },
    { word: 'КАМЕНЬ', syllables: ['КА', 'МЕНЬ'], image: 'kamen.png', category: 'nature' },
    { word: 'ПЕСОК', syllables: ['ПЕ', 'СОК'], image: 'pesok.png', category: 'nature' },
    { word: 'ГНЕЗДО', syllables: ['ГНЕЗ', 'ДО'], image: 'gnezdo.png', category: 'nature' },
    { word: 'ЦВЕТОК', syllables: ['ЦВЕ', 'ТОК'], image: 'cvetok.png', category: 'nature' },

    // Животные (2 слога)
    { word: 'РЫБА', syllables: ['РЫ', 'БА'], image: 'ryba.png', category: 'animals' },
    { word: 'КОЗА', syllables: ['КО', 'ЗА'], image: 'koza.png', category: 'animals' },
    { word: 'СОВА', syllables: ['СО', 'ВА'], image: 'sova.png', category: 'animals' },
    { word: 'УТКА', syllables: ['УТ', 'КА'], image: 'utka.png', category: 'animals' },
    { word: 'ОВЦА', syllables: ['ОВ', 'ЦА'], image: 'ovca.png', category: 'animals' },
    { word: 'ПЧЕЛА', syllables: ['ПЧЕ', 'ЛА'], image: 'pchela.png', category: 'animals' },
    { word: 'КОШКА', syllables: ['КОШ', 'КА'], image: 'koshka.png', category: 'animals' },
    { word: 'МЫШКА', syllables: ['МЫШ', 'КА'], image: 'myshka.png', category: 'animals' },
    { word: 'БЕЛКА', syllables: ['БЕЛ', 'КА'], image: 'belka.png', category: 'animals' },
    { word: 'ЛИСА', syllables: ['ЛИ', 'СА'], image: 'lisa.png', category: 'animals' },
    { word: 'ЗЕБРА', syllables: ['ЗЕБ', 'РА'], image: 'zebra.png', category: 'animals' },
    { word: 'ПАНДА', syllables: ['ПАН', 'ДА'], image: 'panda.png', category: 'animals' },
    { word: 'ПТИЦА', syllables: ['ПТИ', 'ЦА'], image: 'ptica.png', category: 'animals' },
    { word: 'ПЕТУХ', syllables: ['ПЕ', 'ТУХ'], image: 'petuh.png', category: 'animals' },
    { word: 'СВИНЬЯ', syllables: ['СВИ', 'НЬЯ'], image: 'svinya.png', category: 'animals' },
    { word: 'ЛОШАДЬ', syllables: ['ЛО', 'ШАДЬ'], image: 'loshad.png', category: 'animals' },
    { word: 'МЕДВЕДЬ', syllables: ['МЕД', 'ВЕДЬ'], image: 'medved.png', category: 'animals' },
    { word: 'ДЕЛЬФИН', syllables: ['ДЕЛЬ', 'ФИН'], image: 'delfin.png', category: 'animals' },
    { word: 'ЖИРАФ', syllables: ['ЖИ', 'РАФ'], image: 'zhiraf.png', category: 'animals' },
    { word: 'ЗАЯЦ', syllables: ['ЗА', 'ЯЦ'], image: 'zayac.png', category: 'animals' },
    { word: 'ЁЖИК', syllables: ['Ё', 'ЖИК'], image: 'yozhik.png', category: 'animals' },
    { word: 'ЩЕНОК', syllables: ['ЩЕ', 'НОК'], image: 'schenok.png', category: 'animals' },
    { word: 'КОТИК', syllables: ['КО', 'ТИК'], image: 'kotik.png', category: 'animals' },
    { word: 'ОСЛИК', syllables: ['ОС', 'ЛИК'], image: 'oslik.png', category: 'animals' },
    { word: 'КОЗЁЛ', syllables: ['КО', 'ЗЁЛ'], image: 'kozyol.png', category: 'animals' },
    { word: 'БАРАН', syllables: ['БА', 'РАН'], image: 'baran.png', category: 'animals' },
    { word: 'ПОНИ', syllables: ['ПО', 'НИ'], image: 'poni.png', category: 'animals' },

    // Предметы (2 слога)
    { word: 'НОГА', syllables: ['НО', 'ГА'], image: 'noga.png', category: 'items' },
    { word: 'РУКА', syllables: ['РУ', 'КА'], image: 'ruka.png', category: 'items' },
    { word: 'ПИЛА', syllables: ['ПИ', 'ЛА'], image: 'pila.png', category: 'items' },
    { word: 'САНИ', syllables: ['СА', 'НИ'], image: 'sani.png', category: 'items' },
    { word: 'ЛАПА', syllables: ['ЛА', 'ПА'], image: 'lapa.png', category: 'items' },
    { word: 'ВАЗА', syllables: ['ВА', 'ЗА'], image: 'vaza.png', category: 'items' },
    { word: 'ДОМА', syllables: ['ДО', 'МА'], image: 'doma.png', category: 'items' },
    { word: 'ОКНО', syllables: ['ОК', 'НО'], image: 'okno.png', category: 'items' },
    { word: 'ЛАМПА', syllables: ['ЛАМ', 'ПА'], image: 'lampa.png', category: 'items' },
    { word: 'ОЧКИ', syllables: ['ОЧ', 'КИ'], image: 'ochki.png', category: 'items' },
    { word: 'КНИГА', syllables: ['КНИ', 'ГА'], image: 'kniga.png', category: 'items' },
    { word: 'ЧАШКА', syllables: ['ЧАШ', 'КА'], image: 'chashka.png', category: 'items' },
    { word: 'ЧАСЫ', syllables: ['ЧА', 'СЫ'], image: 'chasy.png', category: 'items' },
    { word: 'КУКЛА', syllables: ['КУК', 'ЛА'], image: 'kukla.png', category: 'items' },
    { word: 'ШКОЛА', syllables: ['ШКО', 'ЛА'], image: 'shkola.png', category: 'items' },
    { word: 'ЛОЖКА', syllables: ['ЛОЖ', 'КА'], image: 'lozhka.png', category: 'items' },
    { word: 'ВИЛКА', syllables: ['ВИЛ', 'КА'], image: 'vilka.png', category: 'items' },
    { word: 'МИСКА', syllables: ['МИС', 'КА'], image: 'miska.png', category: 'items' },
    { word: 'СВЕЧА', syllables: ['СВЕ', 'ЧА'], image: 'svecha.png', category: 'items' },
    { word: 'ПОЛКА', syllables: ['ПОЛ', 'КА'], image: 'polka.png', category: 'items' },
    { word: 'СУМКА', syllables: ['СУМ', 'КА'], image: 'sumka.png', category: 'items' },
    { word: 'КРОВАТЬ', syllables: ['КРО', 'ВАТЬ'], image: 'krovat.png', category: 'items' },
    { word: 'КОЛЬЦО', syllables: ['КОЛЬ', 'ЦО'], image: 'kolco.png', category: 'items' },
    { word: 'КУБИК', syllables: ['КУ', 'БИК'], image: 'kubik.png', category: 'items' },
    { word: 'ДОМИК', syllables: ['ДО', 'МИК'], image: 'domik.png', category: 'items' },
    { word: 'ЗАМОК', syllables: ['ЗА', 'МОК'], image: 'zamok.png', category: 'items' },
    { word: 'ЛОДКА', syllables: ['ЛОД', 'КА'], image: 'lodka.png', category: 'items' },
    { word: 'ПАРУС', syllables: ['ПА', 'РУС'], image: 'parus.png', category: 'items' },
    { word: 'ЯКОРЬ', syllables: ['Я', 'КОРЬ'], image: 'yakor.png', category: 'items' },
    { word: 'ВЕСЛО', syllables: ['ВЕС', 'ЛО'], image: 'veslo.png', category: 'items' },
    { word: 'ПАЛКА', syllables: ['ПАЛ', 'КА'], image: 'palka.png', category: 'items' },
    { word: 'ВЕДРО', syllables: ['ВЕД', 'РО'], image: 'vedro.png', category: 'items' },
    { word: 'МЕТЛА', syllables: ['МЕТ', 'ЛА'], image: 'metla.png', category: 'items' },
    { word: 'ЛЕЙКА', syllables: ['ЛЕЙ', 'КА'], image: 'leyka.png', category: 'items' },
    { word: 'КАРТИНА', syllables: ['КАР', 'ТИ', 'НА'], image: 'kartina.png', category: 'items' },
    { word: 'КАСТРЮЛЯ', syllables: ['КАС', 'ТРЮ', 'ЛЯ'], image: 'kastryulya.png', category: 'items' },
    { word: 'ТАРЕЛКА', syllables: ['ТА', 'РЕЛ', 'КА'], image: 'tarelka.png', category: 'items' },
    { word: 'БУТЫЛКА', syllables: ['БУ', 'ТЫЛ', 'КА'], image: 'butylka.png', category: 'items' },
    { word: 'КОРОБКА', syllables: ['КО', 'РОБ', 'КА'], image: 'korobka.png', category: 'items' },
    { word: 'СОЛДАТИК', syllables: ['СОЛ', 'ДА', 'ТИК'], image: 'soldatik.png', category: 'items' },
    { word: 'ВЕДЁРКО', syllables: ['ВЕ', 'ДЁР', 'КО'], image: 'vedyorko.png', category: 'items' },

    // Одежда (2 слога)
    { word: 'ШАПКА', syllables: ['ШАП', 'КА'], image: 'shapka.png', category: 'clothes' },
    { word: 'БРЮКИ', syllables: ['БРЮ', 'КИ'], image: 'bryuki.png', category: 'clothes' },
    { word: 'ТАПКИ', syllables: ['ТАП', 'КИ'], image: 'tapki.png', category: 'clothes' },
    { word: 'НОСКИ', syllables: ['НОС', 'КИ'], image: 'noski.png', category: 'clothes' },
    { word: 'ТУФЛИ', syllables: ['ТУФ', 'ЛИ'], image: 'tufli.png', category: 'clothes' },
    { word: 'БОТИНКИ', syllables: ['БО', 'ТИН', 'КИ'], image: 'botinki.png', category: 'clothes' },
    { word: 'ФУТБОЛКА', syllables: ['ФУТ', 'БОЛ', 'КА'], image: 'futbolka.png', category: 'clothes' },
    { word: 'ПИЖАМА', syllables: ['ПИ', 'ЖА', 'МА'], image: 'pizhama.png', category: 'clothes' },
    { word: 'САПОГИ', syllables: ['СА', 'ПО', 'ГИ'], image: 'sapogi.png', category: 'clothes' },
    { word: 'РУБАШКА', syllables: ['РУ', 'БАШ', 'КА'], image: 'rubashka.png', category: 'clothes' },
    { word: 'ПЛАТЬЕ', syllables: ['ПЛАТЬ', 'Е'], image: 'platye.png', category: 'clothes' },

    // Еда (2+ слога)
    { word: 'МУХА', syllables: ['МУ', 'ХА'], image: 'muha.png', category: 'food' },
    { word: 'КАША', syllables: ['КА', 'ША'], image: 'kasha.png', category: 'food' },
    { word: 'МЫЛО', syllables: ['МЫ', 'ЛО'], image: 'mylo.png', category: 'food' },
    { word: 'ПЕРО', syllables: ['ПЕ', 'РО'], image: 'pero.png', category: 'food' },
    { word: 'ЛУЖА', syllables: ['ЛУ', 'ЖА'], image: 'luzha.png', category: 'nature' },
    { word: 'РЕПА', syllables: ['РЕ', 'ПА'], image: 'repa.png', category: 'food' },
    { word: 'ДЫНЯ', syllables: ['ДЫ', 'НЯ'], image: 'dynya.png', category: 'food' },
    { word: 'ГРУША', syllables: ['ГРУ', 'ША'], image: 'grusha.png', category: 'food' },
    { word: 'ЛИМОН', syllables: ['ЛИ', 'МОН'], image: 'limon.png', category: 'food' },
    { word: 'БАНАН', syllables: ['БА', 'НАН'], image: 'banan.png', category: 'food' },
    { word: 'АРБУЗ', syllables: ['АР', 'БУЗ'], image: 'arbuz.png', category: 'food' },
    { word: 'ТЫКВА', syllables: ['ТЫК', 'ВА'], image: 'tykva.png', category: 'food' },
    { word: 'ПЕРЕЦ', syllables: ['ПЕ', 'РЕЦ'], image: 'perec.png', category: 'food' },
    { word: 'СЛИВА', syllables: ['СЛИ', 'ВА'], image: 'sliva.png', category: 'food' },
    { word: 'ВИШНЯ', syllables: ['ВИШ', 'НЯ'], image: 'vishnya.png', category: 'food' },
    { word: 'ЯБЛОКО', syllables: ['ЯБ', 'ЛО', 'КО'], image: 'yabloko.png', category: 'food' },
    { word: 'АПЕЛЬСИН', syllables: ['А', 'ПЕЛЬ', 'СИН'], image: 'apelsin.png', category: 'food' },
    { word: 'ВИНОГРАД', syllables: ['ВИ', 'НО', 'ГРАД'], image: 'vinograd.png', category: 'food' },
    { word: 'КОНФЕТА', syllables: ['КОН', 'ФЕ', 'ТА'], image: 'konfeta.png', category: 'food' },
    { word: 'ПИРОЖОК', syllables: ['ПИ', 'РО', 'ЖОК'], image: 'pirozhok.png', category: 'food' },
    { word: 'ВАТРУШКА', syllables: ['ВАТ', 'РУШ', 'КА'], image: 'vatrushka.png', category: 'food' },
    { word: 'МАЛИНА', syllables: ['МА', 'ЛИ', 'НА'], image: 'malina.png', category: 'food' },
    { word: 'КЛУБНИКА', syllables: ['КЛУБ', 'НИ', 'КА'], image: 'klubnika.png', category: 'food' },
    { word: 'ЧЕРЕШНЯ', syllables: ['ЧЕ', 'РЕШ', 'НЯ'], image: 'chereshnya.png', category: 'food' },
    { word: 'КАПУСТА', syllables: ['КА', 'ПУС', 'ТА'], image: 'kapusta.png', category: 'food' },
    { word: 'МОРКОВКА', syllables: ['МОР', 'КОВ', 'КА'], image: 'morkovka.png', category: 'food' },
    { word: 'КАРТОШКА', syllables: ['КАР', 'ТОШ', 'КА'], image: 'kartoshka.png', category: 'food' },
    { word: 'ПОМИДОР', syllables: ['ПО', 'МИ', 'ДОР'], image: 'pomidor.png', category: 'food' },
    { word: 'ОГУРЕЦ', syllables: ['О', 'ГУ', 'РЕЦ'], image: 'ogurets.png', category: 'food' },

    // Природа (времена года)
    { word: 'ЗИМА', syllables: ['ЗИ', 'МА'], image: 'zima.png', category: 'nature' },
    { word: 'ЛЕТО', syllables: ['ЛЕ', 'ТО'], image: 'leto.png', category: 'nature' },
    { word: 'ВЕСНА', syllables: ['ВЕС', 'НА'], image: 'vesna.png', category: 'nature' },
    { word: 'ОСЕНЬ', syllables: ['О', 'СЕНЬ'], image: 'osen.png', category: 'nature' },

    // === 3 СЛОГА ===
    // Семья (3 слога)
    { word: 'БАБУШКА', syllables: ['БА', 'БУШ', 'КА'], image: 'babushka.png', category: 'family' },
    { word: 'ДЕДУШКА', syllables: ['ДЕ', 'ДУШ', 'КА'], image: 'dedushka.png', category: 'family' },
    { word: 'ДЕВОЧКА', syllables: ['ДЕ', 'ВОЧ', 'КА'], image: 'devochka.png', category: 'family' },
    { word: 'РЕБЁНОК', syllables: ['РЕ', 'БЁ', 'НОК'], image: 'rebyonok.png', category: 'family' },

    // Животные (3 слога)
    { word: 'СОБАКА', syllables: ['СО', 'БА', 'КА'], image: 'sobaka.png', category: 'animals' },
    { word: 'КОРОВА', syllables: ['КО', 'РО', 'ВА'], image: 'korova.png', category: 'animals' },
    { word: 'ВОРОНА', syllables: ['ВО', 'РО', 'НА'], image: 'vorona.png', category: 'animals' },
    { word: 'КУРИЦА', syllables: ['КУ', 'РИ', 'ЦА'], image: 'kurica.png', category: 'animals' },
    { word: 'АКУЛА', syllables: ['А', 'КУ', 'ЛА'], image: 'akula.png', category: 'animals' },
    { word: 'ПОПУГАЙ', syllables: ['ПО', 'ПУ', 'ГАЙ'], image: 'popugay.png', category: 'animals' },
    { word: 'КРОКОДИЛ', syllables: ['КРО', 'КО', 'ДИЛ'], image: 'krokodil.png', category: 'animals' },
    { word: 'КОЛОБОК', syllables: ['КО', 'ЛО', 'БОК'], image: 'kolobok.png', category: 'animals' },
    { word: 'КОТЁНОК', syllables: ['КО', 'ТЁ', 'НОК'], image: 'kotyonok.png', category: 'animals' },
    { word: 'ЦЫПЛЁНОК', syllables: ['ЦЫП', 'ЛЁ', 'НОК'], image: 'cyplyonok.png', category: 'animals' },
    { word: 'ТЕЛЁНОК', syllables: ['ТЕ', 'ЛЁ', 'НОК'], image: 'telyonok.png', category: 'animals' },
    { word: 'КОЗЛЁНОК', syllables: ['КОЗ', 'ЛЁ', 'НОК'], image: 'kozlyonok.png', category: 'animals' },
    { word: 'УТЁНОК', syllables: ['У', 'ТЁ', 'НОК'], image: 'utyonok.png', category: 'animals' },
    { word: 'ЛИСЁНОК', syllables: ['ЛИ', 'СЁ', 'НОК'], image: 'lisyonok.png', category: 'animals' },
    { word: 'СЛОНЁНОК', syllables: ['СЛО', 'НЁ', 'НОК'], image: 'slonyonok.png', category: 'animals' },
    { word: 'ТИГРЁНОК', syllables: ['ТИГ', 'РЁ', 'НОК'], image: 'tigryonok.png', category: 'animals' },
    { word: 'ЛЯГУШКА', syllables: ['ЛЯ', 'ГУШ', 'КА'], image: 'lyagushka.png', category: 'animals' },
    { word: 'СИНИЦА', syllables: ['СИ', 'НИ', 'ЦА'], image: 'sinica.png', category: 'animals' },
    { word: 'ВОРОБЕЙ', syllables: ['ВО', 'РО', 'БЕЙ'], image: 'vorobey.png', category: 'animals' },
    { word: 'СОЛОВЕЙ', syllables: ['СО', 'ЛО', 'ВЕЙ'], image: 'solovey.png', category: 'animals' },
    { word: 'ЛАСТОЧКА', syllables: ['ЛАС', 'ТОЧ', 'КА'], image: 'lastochka.png', category: 'animals' },
    { word: 'БАБОЧКА', syllables: ['БА', 'БОЧ', 'КА'], image: 'babochka.png', category: 'animals' },
    { word: 'КУЗНЕЧИК', syllables: ['КУЗ', 'НЕ', 'ЧИК'], image: 'kuznechik.png', category: 'animals' },
    { word: 'МУРАВЕЙ', syllables: ['МУ', 'РА', 'ВЕЙ'], image: 'muravey.png', category: 'animals' },
    { word: 'УЛИТКА', syllables: ['У', 'ЛИТ', 'КА'], image: 'ulitka.png', category: 'animals' },
    { word: 'СТРЕКОЗА', syllables: ['СТРЕ', 'КО', 'ЗА'], image: 'strekoza.png', category: 'animals' },

    // Транспорт (3 слога)
    { word: 'ПОЕЗД', syllables: ['ПО', 'ЕЗД'], image: 'poezd.png', category: 'transport' },
    { word: 'КОРАБЛЬ', syllables: ['КО', 'РАБЛЬ'], image: 'korabl.png', category: 'transport' },
    { word: 'РАКЕТА', syllables: ['РА', 'КЕ', 'ТА'], image: 'raketa.png', category: 'transport' },
    { word: 'МАШИНА', syllables: ['МА', 'ШИ', 'НА'], image: 'mashina.png', category: 'transport' },
    { word: 'САМОЛЁТ', syllables: ['СА', 'МО', 'ЛЁТ'], image: 'samolet.png', category: 'transport' },
    { word: 'ПАРОВОЗ', syllables: ['ПА', 'РО', 'ВОЗ'], image: 'parovoz.png', category: 'transport' },
    { word: 'АВТОБУС', syllables: ['АВ', 'ТО', 'БУС'], image: 'avtobus.png', category: 'transport' },
    { word: 'МАШИНКА', syllables: ['МА', 'ШИН', 'КА'], image: 'mashinka.png', category: 'transport' },
    { word: 'ГРУЗОВИК', syllables: ['ГРУ', 'ЗО', 'ВИК'], image: 'gruzovik.png', category: 'transport' },
    { word: 'ВЕЛОСИПЕД', syllables: ['ВЕ', 'ЛО', 'СИ', 'ПЕД'], image: 'velosiped.png', category: 'transport' },

    // Предметы (3 слога)
    { word: 'ДЕРЕВО', syllables: ['ДЕ', 'РЕ', 'ВО'], image: 'derevo.png', category: 'nature' },
    { word: 'ТЕЛЕФОН', syllables: ['ТЕ', 'ЛЕ', 'ФОН'], image: 'telefon.png', category: 'items' },
    { word: 'ИГРУШКА', syllables: ['ИГ', 'РУШ', 'КА'], image: 'igrushka.png', category: 'items' },
    { word: 'ПОДСОЛНУХ', syllables: ['ПОД', 'СОЛ', 'НУХ'], image: 'podsolnuh.png', category: 'nature' },
    { word: 'КАРАНДАШ', syllables: ['КА', 'РАН', 'ДАШ'], image: 'karandash.png', category: 'items' },
    { word: 'КАЧЕЛИ', syllables: ['КА', 'ЧЕ', 'ЛИ'], image: 'kacheli.png', category: 'items' },
    { word: 'КАРУСЕЛЬ', syllables: ['КА', 'РУ', 'СЕЛЬ'], image: 'karusel.png', category: 'items' },
    { word: 'МАТРЁШКА', syllables: ['МАТ', 'РЁШ', 'КА'], image: 'matryoshka.png', category: 'items' },
    { word: 'ГАРМОШКА', syllables: ['ГАР', 'МОШ', 'КА'], image: 'garmoshka.png', category: 'items' },
    { word: 'БАРАБАН', syllables: ['БА', 'РА', 'БАН'], image: 'baraban.png', category: 'items' },
    { word: 'ГИТАРА', syllables: ['ГИ', 'ТА', 'РА'], image: 'gitara.png', category: 'items' },
    { word: 'СВЕТОФОР', syllables: ['СВЕ', 'ТО', 'ФОР'], image: 'svetofor.png', category: 'items' },
    { word: 'ТЕРЕМОК', syllables: ['ТЕ', 'РЕ', 'МОК'], image: 'teremok.png', category: 'items' },
    { word: 'ИЗБУШКА', syllables: ['ИЗ', 'БУШ', 'КА'], image: 'izbushka.png', category: 'items' },
    { word: 'ЛОПАТА', syllables: ['ЛО', 'ПА', 'ТА'], image: 'lopata.png', category: 'items' },
    { word: 'ЛОПАТКА', syllables: ['ЛО', 'ПАТ', 'КА'], image: 'lopatka.png', category: 'items' },

    // Природа (3 слога)
    { word: 'РАДУГА', syllables: ['РА', 'ДУ', 'ГА'], image: 'raduga.png', category: 'nature' },
    { word: 'ОБЛАКО', syllables: ['ОБ', 'ЛА', 'КО'], image: 'oblako.png', category: 'nature' },
    { word: 'СНЕЖИНКА', syllables: ['СНЕ', 'ЖИН', 'КА'], image: 'snezhinka.png', category: 'nature' },
    { word: 'РОМАШКА', syllables: ['РО', 'МАШ', 'КА'], image: 'romashka.png', category: 'nature' },

    // Сказочные персонажи
    { word: 'СНЕГУРКА', syllables: ['СНЕ', 'ГУР', 'КА'], image: 'snegurka.png', category: 'family' },

    // === 4 СЛОГА ===
    { word: 'ЧЕРЕПАХА', syllables: ['ЧЕ', 'РЕ', 'ПА', 'ХА'], image: 'cherepaha.png', category: 'animals' },
    { word: 'ОБЕЗЬЯНА', syllables: ['О', 'БЕЗЬ', 'Я', 'НА'], image: 'obezyana.png', category: 'animals' },
    { word: 'ОДУВАНЧИК', syllables: ['О', 'ДУ', 'ВАН', 'ЧИК'], image: 'oduvanchik.png', category: 'nature' },
    { word: 'КУКУРУЗА', syllables: ['КУ', 'КУ', 'РУ', 'ЗА'], image: 'kukuruza.png', category: 'food' },
    { word: 'КИНО', syllables: ['КИ', 'НО'], image: 'kino.png', category: 'items' },
];

// Get random words for distractors (excluding the correct word)
export function getDistractors(correctWord: WordEntry, count: number): WordEntry[] {
    const otherWords = WORD_DICTIONARY.filter(w => w.word !== correctWord.word);
    const shuffled = [...otherWords].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Get a random word from the dictionary
export function getRandomWord(): WordEntry {
    return WORD_DICTIONARY[Math.floor(Math.random() * WORD_DICTIONARY.length)];
}

// Get words by syllable count
export function getWordsBySyllableCount(syllableCount: number): WordEntry[] {
    return WORD_DICTIONARY.filter(w => w.syllables.filter(s => s !== '').length === syllableCount);
}

// Get words by category
export function getWordsByCategory(category: WordCategory): WordEntry[] {
    return WORD_DICTIONARY.filter(w => w.category === category);
}

// Get all categories with word counts
export function getCategoriesWithCounts(): { category: WordCategory; label: string; count: number }[] {
    const categories = Object.keys(CATEGORY_LABELS) as WordCategory[];
    return categories.map(cat => ({
        category: cat,
        label: CATEGORY_LABELS[cat],
        count: WORD_DICTIONARY.filter(w => w.category === cat).length
    })).filter(c => c.count > 0);
}
