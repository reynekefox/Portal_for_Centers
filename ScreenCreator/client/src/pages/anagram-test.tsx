import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Square, HelpCircle, X, Settings, RotateCcw, CheckCircle, ArrowRight } from "lucide-react";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";

// Russian words for anagrams by letter count (100 words each)
const WORDS_BY_LENGTH: Record<number, string[]> = {
    3: [
        'дом', 'кот', 'сон', 'лес', 'мир', 'сад', 'лук', 'мак', 'рот', 'нос',
        'лёд', 'мёд', 'пёс', 'лев', 'рак', 'бор', 'вал', 'газ', 'дуб', 'ель',
        'жар', 'зал', 'ива', 'код', 'лом', 'мел', 'низ', 'оса', 'пол', 'рай',
        'сок', 'туз', 'уха', 'фон', 'хор', 'час', 'шар', 'щит', 'эра', 'юла',
        'яма', 'бой', 'воз', 'год', 'дым', 'ёрш', 'жук', 'зуб', 'икс', 'куб',
        'луч', 'миг', 'нож', 'обь', 'пир', 'рис', 'суп', 'тон', 'уют', 'ход',
        'цех', 'шум', 'эхо', 'бак', 'вид', 'гол', 'дед', 'ежи', 'жир', 'зов',
        'ком', 'лак', 'мат', 'нрав', 'ось', 'пар', 'рог', 'сыр', 'тир', 'ухо',
        'хит', 'чай', 'шов', 'бас', 'вес', 'гид', 'душ', 'ёж', 'жест', 'зал',
        'кум', 'лоб', 'муж', 'нуль', 'пыл', 'ряд', 'сэр', 'тыл', 'ум', 'фея'
    ],
    4: [
        'слон', 'рука', 'нога', 'река', 'гора', 'луна', 'звук', 'друг', 'стол', 'окно',
        'небо', 'лето', 'зима', 'море', 'поле', 'лист', 'мост', 'снег', 'туча', 'куст',
        'рыба', 'волк', 'заяц', 'лиса', 'гусь', 'утка', 'конь', 'коза', 'овца', 'муха',
        'жаба', 'краб', 'сова', 'аист', 'дело', 'путь', 'угол', 'свет', 'тень', 'мрак',
        'день', 'ночь', 'утро', 'торт', 'каша', 'хлеб', 'соль', 'кофе', 'вода', 'вино',
        'пиво', 'квас', 'сыр', 'мама', 'папа', 'баба', 'дядя', 'тётя', 'сын', 'дочь',
        'брат', 'сестр', 'дом', 'лист', 'куст', 'пень', 'мышь', 'лень', 'тень', 'боль',
        'соль', 'моль', 'ноль', 'роль', 'толь', 'голь', 'цель', 'мель', 'пыль', 'быль',
        'руль', 'куль', 'гуль', 'дуль', 'июль', 'стиль', 'блок', 'брод', 'врач', 'град'
    ],
    5: [
        'школа', 'книга', 'ручка', 'парта', 'доска', 'класс', 'урок', 'мышка', 'кошка', 'собака',
        'птица', 'дерево', 'цветок', 'облако', 'солнце', 'земля', 'вода', 'огонь', 'ветер', 'камень',
        'песок', 'трава', 'лист', 'ветка', 'корень', 'плод', 'семя', 'зерно', 'колос', 'сноп',
        'поле', 'сад', 'лес', 'река', 'озеро', 'море', 'океан', 'остров', 'берег', 'волна',
        'рыба', 'краб', 'медуза', 'кит', 'акула', 'дельфин', 'тюлень', 'морж', 'пингвин', 'чайка',
        'орёл', 'сокол', 'ястреб', 'ворона', 'сорока', 'голубь', 'воробей', 'синица', 'снегирь', 'дятел',
        'белка', 'заяц', 'лиса', 'волк', 'медведь', 'олень', 'лось', 'кабан', 'бобр', 'ёж',
        'крот', 'мышь', 'хомяк', 'крыса', 'кролик', 'козёл', 'баран', 'бык', 'конь', 'осёл',
        'верблюд', 'слон', 'жираф', 'зебра', 'лев', 'тигр', 'леопард', 'пантера', 'гепард', 'рысь',
        'пума', 'ягуар', 'обезьяна', 'горилла', 'шимпанзе', 'бегемот', 'носорог', 'крокодил', 'черепаха', 'змея'
    ],
    6: [
        'корова', 'лошадь', 'кролик', 'ворона', 'голубь', 'курица', 'петух', 'индюк', 'павлин', 'страус',
        'фазан', 'куропатка', 'перепел', 'рябчик', 'тетерев', 'глухарь', 'журавль', 'аист', 'цапля', 'пеликан',
        'фламинго', 'лебедь', 'гусыня', 'селезень', 'нырок', 'гагара', 'буревестник', 'альбатрос', 'баклан', 'кайра',
        'тупик', 'пингвин', 'колибри', 'попугай', 'какаду', 'ара', 'тукан', 'удод', 'зимородок', 'щурка',
        'иволга', 'свиристель', 'дрозд', 'соловей', 'малиновка', 'жаворонок', 'ласточка', 'стриж', 'козодой', 'сипуха',
        'филин', 'неясыть', 'сплюшка', 'сыч', 'кукушка', 'дятел', 'сорока', 'галка', 'грач', 'ворон',
        'сойка', 'кедровка', 'клёст', 'щегол', 'чиж', 'зяблик', 'овсянка', 'пеночка', 'славка', 'камышовка',
        'трясогузка', 'конёк', 'оляпка', 'крапивник', 'королёк', 'синица', 'поползень', 'пищуха', 'московка', 'лазоревка',
        'гаичка', 'ремез', 'длиннохвостая', 'сорокопут', 'жулан', 'скворец', 'майна', 'иволга', 'дрозд', 'рябинник',
        'белобровик', 'певчий', 'деряба', 'каменка', 'чекан', 'горихвостка', 'зарянка', 'варакушка', 'соловей', 'мухоловка'
    ],
    7: [
        'машина', 'самолёт', 'корабль', 'автобус', 'трамвай', 'вертолёт', 'ракета', 'космос', 'планета', 'звезда',
        'галактика', 'комета', 'астероид', 'метеорит', 'спутник', 'орбита', 'гравитация', 'атмосфера', 'стратосфера', 'озон',
        'кислород', 'азот', 'углерод', 'водород', 'гелий', 'неон', 'аргон', 'криптон', 'ксенон', 'радон',
        'литий', 'натрий', 'калий', 'кальций', 'магний', 'алюминий', 'кремний', 'фосфор', 'сера', 'хлор',
        'железо', 'медь', 'цинк', 'серебро', 'золото', 'платина', 'титан', 'хром', 'никель', 'кобальт',
        'молибден', 'вольфрам', 'уран', 'плутоний', 'радий', 'полоний', 'франций', 'цезий', 'барий', 'стронций',
        'скандий', 'иттрий', 'лантан', 'церий', 'неодим', 'самарий', 'европий', 'гадолиний', 'тербий', 'диспрозий',
        'гольмий', 'эрбий', 'тулий', 'иттербий', 'лютеций', 'гафний', 'тантал', 'рений', 'осмий', 'иридий',
        'рубидий', 'таллий', 'свинец', 'висмут', 'полоний', 'астат', 'торий', 'протактиний', 'нептуний', 'америций',
        'кюрий', 'берклий', 'калифорний', 'эйнштейний', 'фермий', 'менделевий', 'нобелий', 'лоуренсий', 'резерфордий', 'дубний'
    ],
};

// Shuffle string characters
const shuffleWord = (word: string): string => {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const shuffled = arr.join('');
    // Make sure it's different from original
    return shuffled === word ? shuffleWord(word) : shuffled;
};

type Phase = 'idle' | 'playing' | 'result';

interface AnagramItem {
    originalWord: string;
    shuffledWord: string;
    userAnswer: string;
    isCorrect: boolean | null;
    timeExpired: boolean;
}

export default function AnagramTest() {
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('anagram-test');

    const [phase, setPhase] = useState<Phase>('idle');
    const [letterCount, setLetterCount] = useState(4);
    const [anagramCount, setAnagramCount] = useState(5);
    const [timeLimit, setTimeLimit] = useState<number | null>(null); // null = infinity

    const [currentIndex, setCurrentIndex] = useState(0);
    const [anagrams, setAnagrams] = useState<AnagramItem[]>([]);
    const [userInput, setUserInput] = useState('');
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const [showHelp, setShowHelp] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Apply locked parameters from lesson settings
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.letterCount) setLetterCount(Number(lockedParameters.letterCount));
            if (lockedParameters.anagramCount) setAnagramCount(Number(lockedParameters.anagramCount));
            if (lockedParameters.timeLimit) setTimeLimit(Number(lockedParameters.timeLimit));
        }
    }, [isLocked, lockedParameters]);

    // Generate anagrams for the game
    const generateAnagrams = () => {
        const words = WORDS_BY_LENGTH[letterCount] || WORDS_BY_LENGTH[4];
        const shuffledWords = [...words].sort(() => Math.random() - 0.5);
        const selected = shuffledWords.slice(0, anagramCount);

        return selected.map(word => ({
            originalWord: word,
            shuffledWord: shuffleWord(word),
            userAnswer: '',
            isCorrect: null,
            timeExpired: false
        }));
    };

    // Timer effect
    useEffect(() => {
        if (phase === 'playing' && timeLimit !== null && timeLeft !== null && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => (prev !== null ? prev - 1 : null));
            }, 1000);
        } else if (phase === 'playing' && timeLimit !== null && timeLeft === 0) {
            // Time expired - mark as wrong and move to next
            handleTimeExpired();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [phase, timeLeft, timeLimit]);

    const handleTimeExpired = () => {
        setAnagrams(prev => prev.map((a, i) =>
            i === currentIndex ? { ...a, timeExpired: true, isCorrect: false } : a
        ));
        moveToNext();
    };

    const startGame = () => {
        const newAnagrams = generateAnagrams();
        setAnagrams(newAnagrams);
        setCurrentIndex(0);
        setUserInput('');
        setTimeLeft(timeLimit);
        setPhase('playing');
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const stopGame = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setPhase('idle');
        setAnagrams([]);
        setCurrentIndex(0);
        setUserInput('');
        setTimeLeft(null);
    };

    const checkAnswer = () => {
        const current = anagrams[currentIndex];
        // Normalize ё to е for comparison (common Russian input issue)
        const normalizeRussian = (s: string) => s.toLowerCase().trim().replace(/ё/g, 'е');
        const isCorrect = normalizeRussian(userInput) === normalizeRussian(current.originalWord);

        setAnagrams(prev => prev.map((a, i) =>
            i === currentIndex ? { ...a, userAnswer: userInput, isCorrect } : a
        ));

        moveToNext();
    };

    const moveToNext = () => {
        if (currentIndex + 1 >= anagramCount) {
            setPhase('result');
        } else {
            setCurrentIndex(prev => prev + 1);
            setUserInput('');
            setTimeLeft(timeLimit);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && userInput.trim()) {
            checkAnswer();
        }
    };

    const formatTime = (seconds: number) => {
        return `00:${String(seconds).padStart(2, '0')}`;
    };

    const correctCount = anagrams.filter(a => a.isCorrect).length;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 py-4 px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={backPath}>
                            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <ArrowLeft size={24} />
                            </button>
                        </Link>
                        <h1 className="text-xl font-bold text-gray-800">Анаграммы</h1>
                    </div>
                    <button
                        onClick={() => setShowHelp(true)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                    >
                        <HelpCircle size={24} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Left Sidebar - Settings */}
                <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
                    {/* Start/Stop Button */}
                    <button
                        onClick={phase === 'playing' ? stopGame : startGame}
                        className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${phase === 'playing'
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {phase === 'playing' ? <Square size={18} /> : <Play size={18} />}
                        {phase === 'playing' ? 'Остановить' : 'Начать'}
                    </button>

                    {/* Progress indicator */}
                    {phase === 'playing' && (
                        <div className="text-center text-gray-600">
                            {currentIndex + 1} из {anagramCount}
                        </div>
                    )}

                    {/* Timer display */}
                    {phase === 'playing' && timeLimit !== null && timeLeft !== null && (
                        <div className="text-center">
                            <div className={`text-4xl font-mono font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : timeLeft <= 10 ? 'text-orange-500' : 'text-blue-600'}`}>
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                    )}

                    {/* Settings - Hidden when locked */}
                    {!isLocked && phase === 'idle' && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings size={16} className="text-gray-500" />
                                <span className="font-medium text-gray-700">Настройки</span>
                            </div>

                            {/* Letter Count */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2 text-center">Число букв</label>
                                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                    <button
                                        onClick={() => setLetterCount(Math.max(3, letterCount - 1))}
                                        disabled={phase !== 'idle' || letterCount <= 3}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >−</button>
                                    <span className="font-bold text-xl text-gray-800 min-w-[3rem] text-center">{letterCount}</span>
                                    <button
                                        onClick={() => setLetterCount(Math.min(7, letterCount + 1))}
                                        disabled={phase !== 'idle' || letterCount >= 7}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >+</button>
                                </div>
                            </div>

                            {/* Anagram Count */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2 text-center">Число анаграмм</label>
                                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                    <button
                                        onClick={() => setAnagramCount(Math.max(1, anagramCount - 1))}
                                        disabled={phase !== 'idle' || anagramCount <= 1}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >−</button>
                                    <span className="font-bold text-xl text-gray-800 min-w-[3rem] text-center">{anagramCount}</span>
                                    <button
                                        onClick={() => setAnagramCount(Math.min(20, anagramCount + 1))}
                                        disabled={phase !== 'idle' || anagramCount >= 20}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >+</button>
                                </div>
                            </div>

                            {/* Time Limit */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2 text-center">Время на ответ</label>
                                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                    <button
                                        onClick={() => setTimeLimit(prev => prev === null ? 20 : Math.max(5, prev - 5))}
                                        disabled={phase !== 'idle'}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >−</button>
                                    <span className="font-bold text-xl text-gray-800 min-w-[3rem] text-center">
                                        {timeLimit === null ? <span className="text-2xl">∞</span> : `${timeLimit}с`}
                                    </span>
                                    <button
                                        onClick={() => setTimeLimit(prev => {
                                            if (prev === null) return 20;
                                            if (prev >= 60) return null;
                                            return prev + 5;
                                        })}
                                        disabled={phase !== 'idle'}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Center - Game Area */}
                <div className="flex-1 flex items-center justify-center bg-white p-8">
                    {/* Idle State */}
                    {phase === 'idle' && (
                        <div className="text-center">
                            <div className="text-6xl mb-4">🔤</div>
                            <div className="text-xl text-gray-500">
                                Нажмите "Начать"
                            </div>
                        </div>
                    )}

                    {/* Playing State */}
                    {phase === 'playing' && anagrams[currentIndex] && (
                        <div className="flex flex-col items-center gap-8 w-full max-w-md">
                            {/* Timer */}
                            {timeLimit !== null && timeLeft !== null && (
                                <div className={`text-3xl font-mono font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-blue-600'}`}>
                                    {formatTime(timeLeft)}
                                </div>
                            )}

                            {/* Shuffled Word */}
                            <div className="text-5xl font-bold tracking-widest text-gray-800 uppercase">
                                {anagrams[currentIndex].shuffledWord}
                            </div>

                            {/* Input */}
                            <input
                                ref={inputRef}
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Введите слово..."
                                className="w-full text-center text-2xl py-4 px-6 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                                autoComplete="off"
                            />

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={checkAnswer}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all"
                                >
                                    Далее
                                </button>
                                <button
                                    onClick={() => {
                                        // Show answer and mark as wrong
                                        setAnagrams(prev => prev.map((a, i) =>
                                            i === currentIndex ? { ...a, userAnswer: '(подсказка)', isCorrect: false } : a
                                        ));
                                        // Show the word briefly then move on
                                        setUserInput(anagrams[currentIndex].originalWord);
                                        setTimeout(() => {
                                            moveToNext();
                                        }, 1500);
                                    }}
                                    className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-full transition-all"
                                >
                                    Помощь
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Result State - simplified in center */}
                    {phase === 'result' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="text-5xl mb-2">
                                {correctCount === anagramCount ? '🎉' : correctCount >= anagramCount / 2 ? '👍' : '💪'}
                            </div>
                            <div className="text-3xl font-bold text-gray-800">
                                {correctCount} из {anagramCount}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={startGame}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all flex items-center gap-2"
                                >
                                    <RotateCcw size={18} />
                                    Ещё раз
                                </button>
                                {/* Next button - only if meets required criteria */}
                                {isLocked && (() => {
                                    const accuracy = anagramCount > 0 ? Math.round((correctCount / anagramCount) * 100) : 0;
                                    const passed = accuracy >= (requiredResult?.minValue || 0);
                                    return passed ? (
                                        <Link href={getNextPath()}>
                                            <button
                                                onClick={() => {
                                                    lockedCompleteExercise({ correctCount, anagramCount, accuracy }, true);
                                                }}
                                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-all flex items-center gap-2"
                                            >
                                                {hasNextExercise ? 'К следующему →' : 'Готово ✓'}
                                                <ArrowRight size={18} />
                                            </button>
                                        </Link>
                                    ) : null;
                                })()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Stats */}
                {(phase === 'playing' || phase === 'result') && (
                    <div className="w-64 bg-white border-l border-gray-200 p-4">
                        <div className="font-medium text-gray-700 mb-4">Статистика</div>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-xl text-center">
                                <div className="text-gray-500 text-sm mb-1">Всего слов</div>
                                <div className="text-3xl font-bold text-gray-800">{anagramCount}</div>
                            </div>

                            <div className="p-4 bg-green-50 rounded-xl text-center">
                                <div className="text-green-600 text-sm mb-1">Правильно</div>
                                <div className="text-3xl font-bold text-green-600">{correctCount}</div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-xl text-center">
                                <div className="text-blue-600 text-sm mb-1">Процент</div>
                                <div className="text-3xl font-bold text-blue-600">
                                    {anagrams.filter(a => a.isCorrect !== null).length > 0
                                        ? Math.round((correctCount / anagrams.filter(a => a.isCorrect !== null).length) * 100)
                                        : 0}%
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl text-center">
                                <div className="text-gray-500 text-sm mb-1">Прогресс</div>
                                <div className="text-xl font-bold text-gray-800">
                                    {phase === 'result' ? anagramCount : currentIndex + 1} / {anagramCount}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">Инструкция</h2>
                            <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 text-gray-600">
                            <p><strong>Цель:</strong> Составить слово из перемешанных букв.</p>
                            <p><strong>Как играть:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Посмотрите на буквы</li>
                                <li>Введите слово, которое из них получается</li>
                                <li>Нажмите Enter или кнопку "Проверить"</li>
                            </ul>
                            <p><strong>Настройки:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Число букв — длина слов</li>
                                <li>Число анаграмм — сколько слов угадать</li>
                                <li>Время — ограничение на каждый ответ</li>
                            </ul>
                        </div>
                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all"
                            >
                                Понятно
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
