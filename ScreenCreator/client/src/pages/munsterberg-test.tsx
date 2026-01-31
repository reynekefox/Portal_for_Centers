import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle, Play, Square, ArrowRight } from "lucide-react";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";

// Словарь из 200 слов для теста Мюнстенберга
const WORDS_DICTIONARY = [
    // Природа и погода
    "СОЛНЦЕ", "ЛУНА", "ЗВЕЗДА", "ОБЛАКО", "ДОЖДЬ", "СНЕГ", "ВЕТЕР", "РЕКА", "ОЗЕРО", "МОРЕ",
    "ЛЕС", "ПОЛЕ", "ГОРА", "ТРАВА", "ЦВЕТОК", "ДЕРЕВО", "КАМЕНЬ", "ПЕСОК", "ГРОМ", "МОЛНИЯ",
    "РАДУГА", "ТУМАН", "РОСА", "ИНЕЙ", "МЕТЕЛЬ",
    // Животные
    "КОШКА", "СОБАКА", "ПТИЦА", "РЫБА", "МЕДВЕДЬ", "ВОЛК", "ЛИСА", "ЗАЯЦ", "БЕЛКА", "ЁЖ",
    "МЫШЬ", "КОРОВА", "ЛОШАДЬ", "СВИНЬЯ", "ОВЦА", "КОЗА", "КУРИЦА", "УТКА", "ГУСЬ", "ОЛЕНЬ",
    "СЛОН", "ЛЕВ", "ТИГР", "ОРЁЛ", "СОВА", "ВОРОНА", "БАБОЧКА", "ПЧЕЛА", "МУРАВЕЙ", "ЖУК",
    // Еда и продукты
    "ХЛЕБ", "МОЛОКО", "МАСЛО", "СЫР", "МЯСО", "КАША", "СУП", "СОЛЬ", "САХАР", "ЯБЛОКО",
    "ГРУША", "БАНАН", "ВИНОГРАД", "АПЕЛЬСИН", "ЛИМОН", "МОРКОВЬ", "КАПУСТА", "КАРТОШКА", "ОГУРЕЦ", "ПОМИДОР",
    "ЛУК", "ГРИБ", "ОРЕХ", "МЁД", "ТОРТ",
    // Дом и быт
    "ДОМ", "ОКНО", "ДВЕРЬ", "СТЕНА", "ПОЛ", "КРЫША", "СТОЛ", "СТУЛ", "КРОВАТЬ", "ШКАФ",
    "ЗЕРКАЛО", "ЛАМПА", "КОВЁР", "ДИВАН", "КРЕСЛО", "ПОЛКА", "ЧАШКА", "ТАРЕЛКА", "ЛОЖКА", "ВИЛКА",
    "НОЖ", "ЧАЙНИК", "КАСТРЮЛЯ", "КЛЮЧ", "ЧАСЫ",
    // Школа и учёба
    "ШКОЛА", "КЛАСС", "УРОК", "ПАРТА", "ДОСКА", "КНИГА", "ТЕТРАДЬ", "РУЧКА", "КАРАНДАШ", "ЛИНЕЙКА",
    "ЛАСТИК", "ПОРТФЕЛЬ", "ДНЕВНИК", "УЧИТЕЛЬ", "УЧЕНИК", "ОЦЕНКА", "ЗАДАЧА", "ОТВЕТ", "ВОПРОС", "ЭКЗАМЕН",
    // Человек и тело
    "ГОЛОВА", "ЛИЦО", "ГЛАЗ", "НОС", "РОТ", "УХО", "РУКА", "НОГА", "ПАЛЕЦ", "СЕРДЦЕ",
    "ВОЛОСЫ", "ЗУБ", "ЯЗЫК", "СПИНА", "ПЛЕЧО", "КОЛЕНО", "ГОЛОС", "УЛЫБКА", "СЛЕЗА", "СОН",
    // Одежда
    "ШАПКА", "ШАРФ", "КУРТКА", "ПАЛЬТО", "ПЛАТЬЕ", "РУБАШКА", "БРЮКИ", "ЮБКА", "НОСКИ", "БОТИНКИ",
    "САПОГИ", "ПЕРЧАТКИ", "ВАРЕЖКИ", "КАРМАН", "ПОЯС",
    // Транспорт
    "МАШИНА", "АВТОБУС", "ПОЕЗД", "САМОЛЁТ", "КОРАБЛЬ", "ЛОДКА", "ВЕЛОСИПЕД", "ТРАМВАЙ", "МЕТРО", "ТАКСИ",
    "ГРУЗОВИК", "МОТОЦИКЛ", "ВЕРТОЛЁТ", "РАКЕТА", "КОЛЕСО",
    // Действия и понятия
    "ИГРА", "РАБОТА", "ОТДЫХ", "СКАЗКА", "ПЕСНЯ", "ТАНЕЦ", "РИСУНОК", "ЗАГАДКА", "ПОДАРОК", "ПРАЗДНИК",
    "ПОБЕДА", "УДАЧА", "ПРАВДА", "ДРУЖБА", "ЛЮБОВЬ", "РАДОСТЬ", "СМЕХ", "ТИШИНА", "СЕКРЕТ", "МЕЧТА",
    "НОВОСТЬ", "НАРОД", "РАЙОН", "ФАКТ", "ВРЕМЯ"
];

const WORDS_PER_GAME = 8; // Количество слов для поиска в каждой игре

// Функция для случайного выбора слов
function getRandomWords(count: number): string[] {
    const shuffled = [...WORDS_DICTIONARY].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

const GRID_SIZE = 16; // 16x16 grid

interface Attempt {
    attemptNumber: number;
    time: string;
}

export default function MunsterbergTest() {
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('munsterberg-test');

    const [grid, setGrid] = useState<string[][]>([]);
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
    const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
    const [currentWords, setCurrentWords] = useState<string[]>([]);

    // Game State
    const [isRunning, setIsRunning] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [exerciseDuration, setExerciseDuration] = useState(0); // 0 = infinite (count up)
    const [showResults, setShowResults] = useState(false);

    // Logic State
    const [correctCells, setCorrectCells] = useState<Set<string>>(new Set());
    const [wordDefinitions, setWordDefinitions] = useState<{ word: string, cells: string[] }[]>([]);
    const [animatingCells, setAnimatingCells] = useState<Set<string>>(new Set());

    const [showHints, setShowHints] = useState(true);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Determine if we're using countdown mode
    const isCountdownMode = isLocked || exerciseDuration > 0;

    // Apply locked parameters
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.duration !== undefined) setExerciseDuration(Number(lockedParameters.duration));
            if (lockedParameters.showHints !== undefined) setShowHints(Boolean(lockedParameters.showHints));
        }
    }, [isLocked, lockedParameters]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const handleStart = () => {
        const words = getRandomWords(WORDS_PER_GAME);
        setCurrentWords(words);
        generateGrid(words);
        setIsRunning(true);
        setFoundWords(new Set());
        setSelectedCells(new Set());
        setErrorCells(new Set());
        setAnimatingCells(new Set());
        setShowResults(false);

        // Clear any existing timer
        if (timerRef.current) clearInterval(timerRef.current);

        if (isCountdownMode) {
            // Countdown mode: start from duration and count down
            setTimeElapsed(exerciseDuration);
            timerRef.current = setInterval(() => {
                setTimeElapsed(prev => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        setIsRunning(false);
                        setShowResults(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            // Count-up mode: start from 0 and count up infinitely
            setTimeElapsed(0);
            timerRef.current = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        }
    };

    const handleStop = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRunning(false);
        setGrid([]);
        setCurrentWords([]);
    };

    const generateGrid = (words: string[]) => {
        const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
        const letters = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
        const newCorrectCells = new Set<string>();
        const newWordDefinitions: { word: string, cells: string[] }[] = [];

        words.forEach(word => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * GRID_SIZE);
                const col = Math.floor(Math.random() * (GRID_SIZE - word.length));

                let canPlace = true;
                for (let i = 0; i < word.length; i++) {
                    if (newGrid[row][col + i] !== '') {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    const wordCells: string[] = [];
                    for (let i = 0; i < word.length; i++) {
                        newGrid[row][col + i] = word[i];
                        const key = `${row}-${col + i}`;
                        newCorrectCells.add(key);
                        wordCells.push(key);
                    }
                    newWordDefinitions.push({ word, cells: wordCells });
                    placed = true;
                }
                attempts++;
            }
        });

        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (newGrid[i][j] === '') {
                    newGrid[i][j] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }

        setGrid(newGrid);
        setCorrectCells(newCorrectCells);
        setWordDefinitions(newWordDefinitions);
    };

    const handleCellClick = (row: number, col: number) => {
        if (!isRunning) return;

        const key = `${row}-${col}`;

        if (selectedCells.has(key)) return;

        if (correctCells.has(key)) {
            const newSelected = new Set(selectedCells);
            newSelected.add(key);
            setSelectedCells(newSelected);

            const newFoundWords = new Set(foundWords);
            let newlyFoundWordCells: string[] = [];

            wordDefinitions.forEach(def => {
                if (!foundWords.has(def.word) && def.cells.every(cellKey => newSelected.has(cellKey))) {
                    newFoundWords.add(def.word);
                    newlyFoundWordCells = [...newlyFoundWordCells, ...def.cells];
                }
            });

            if (newFoundWords.size > foundWords.size) {
                setFoundWords(newFoundWords);

                if (newlyFoundWordCells.length > 0) {
                    const newAnimating = new Set(animatingCells);
                    newlyFoundWordCells.forEach(cell => newAnimating.add(cell));
                    setAnimatingCells(newAnimating);

                    setTimeout(() => {
                        setAnimatingCells(prev => {
                            const next = new Set(prev);
                            newlyFoundWordCells.forEach(cell => next.delete(cell));
                            return next;
                        });
                    }, 1500);
                }

                if (newFoundWords.size === currentWords.length) {
                    // Stop the countdown timer
                    if (timerRef.current) clearInterval(timerRef.current);
                    setIsRunning(false);
                    setAttempts(prev => [...prev, {
                        attemptNumber: prev.length + 1,
                        time: formatTime(timeElapsed)
                    }]);
                    setShowResults(true);

                    // Auto-submit for locked exercises
                    if (isLocked) {
                        lockedCompleteExercise({ completed: true, wordsFound: newFoundWords.size, totalWords: currentWords.length }, true);
                    }
                }
            }
        } else {
            const newErrors = new Set(errorCells);
            newErrors.add(key);
            setErrorCells(newErrors);

            setTimeout(() => {
                setErrorCells(prev => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            }, 500);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white p-6 relative">
            {/* Back Button */}
            <div className="absolute top-6 left-6">
                <Link href={backPath}>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                </Link>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800">Тест Мюнстенберга</h1>
            </div>

            {/* Main Content */}
            <div className="flex gap-8 justify-center flex-1 items-start">
                {/* Left Side - Controls */}
                <div className="w-48 flex flex-col items-center gap-6">
                    <div className="text-4xl font-bold text-blue-600 font-mono text-center">
                        {formatTime(timeElapsed)}
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={isRunning ? handleStop : handleStart}
                            className={`flex items-center justify-center gap-2 px-6 py-2 text-sm text-white rounded-full font-bold transition-all shadow-md hover:shadow-lg ${isRunning
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-blue-600 hover:bg-blue-700"
                                }`}
                        >
                            {isRunning ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                            {isRunning ? "Стоп" : "Начать тест"}
                        </button>
                    </div>

                    {/* Duration Setting - Only in free mode */}
                    {!isLocked && !isRunning && (
                        <div className="w-full">
                            <label className="text-xs font-bold text-gray-500 block text-center mb-1">Время (мин)</label>
                            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
                                <button
                                    onClick={() => setExerciseDuration(Math.max(0, exerciseDuration - 60))}
                                    className="p-2 hover:bg-gray-100 rounded text-gray-600"
                                    disabled={exerciseDuration === 0}
                                >
                                    −
                                </button>
                                <span className="flex-1 text-center font-bold text-gray-800">
                                    {exerciseDuration === 0 ? '∞' : Math.floor(exerciseDuration / 60)}
                                </span>
                                <button
                                    onClick={() => setExerciseDuration(exerciseDuration + 60)}
                                    className="p-2 hover:bg-gray-100 rounded text-gray-600"
                                >
                                    +
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 text-center mt-1">
                                {exerciseDuration === 0 ? 'Без ограничения' : 'Обратный отсчёт'}
                            </p>
                        </div>
                    )}

                    {/* Words List */}
                    <div className="w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700">Слова</h3>
                            {!isLocked && (
                                <button
                                    onClick={() => setShowHints(!showHints)}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    {showHints ? 'Скрыть' : 'Показать'}
                                </button>
                            )}
                        </div>

                        {showHints && (
                            <div className="space-y-2 overflow-y-auto pr-2 max-h-60">
                                {currentWords.map(word => (
                                    <div
                                        key={word}
                                        className={`flex items-center gap-2 text-sm ${foundWords.has(word) ? 'text-green-600 font-medium' : 'text-gray-500'}`}
                                    >
                                        {foundWords.has(word) ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />}
                                        <span className={foundWords.has(word) ? 'line-through opacity-70' : ''}>{word}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Center - Grid Area */}
                <div className="flex flex-col items-center gap-6">
                    {/* Table Field - Always show full size grid */}
                    <div
                        className="border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 relative overflow-hidden transition-all duration-300 p-6"
                    >
                        {/* Background Logo */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
                            <img src="/logo.png" alt="Logo" className="w-1/2 object-contain" />
                        </div>

                        <div
                            className="grid gap-1 select-none"
                            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(24px, 1fr))` }}
                        >
                            {grid.length > 0 ? (
                                grid.map((row, r) => (
                                    row.map((char, c) => {
                                        const key = `${r}-${c}`;
                                        const isSelected = selectedCells.has(key);
                                        const isError = errorCells.has(key);
                                        const isAnimating = animatingCells.has(key);

                                        return (
                                            <div
                                                key={key}
                                                onMouseDown={() => handleCellClick(r, c)}
                                                className={`
                                                    w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-lg font-bold cursor-pointer rounded transition-all duration-200
                                                    ${isError
                                                        ? 'bg-red-500 text-white scale-95'
                                                        : isAnimating
                                                            ? 'bg-green-500 text-white scale-110 animate-pulse shadow-lg ring-2 ring-green-300'
                                                            : isSelected
                                                                ? 'bg-blue-500 text-white scale-105 shadow-md'
                                                                : 'hover:bg-blue-100 text-gray-700'
                                                    }
                                                `}
                                            >
                                                {char}
                                            </div>
                                        );
                                    })
                                ))
                            ) : isLocked && requiredResult && !showResults ? (
                                /* Centered Goal Banner for locked mode */
                                <div className="col-span-full row-span-full flex items-center justify-center" style={{ gridColumn: `span ${GRID_SIZE}` }}>
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">🎯</div>
                                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl shadow-lg inline-block">
                                            <p className="text-sm opacity-90">Цель упражнения:</p>
                                            <p className="text-xl font-bold">{formatRequiredResult(requiredResult, lockedParameters || undefined)}</p>
                                            <p className="text-sm opacity-90 mt-2">Время: {formatTime(exerciseDuration)}</p>
                                        </div>
                                        <div className="mt-4 text-gray-500">Нажмите "Начать тест"</div>
                                    </div>
                                </div>
                            ) : (
                                // Empty placeholder grid - same size as active grid
                                Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-8 h-8 md:w-10 md:h-10 rounded border-2 border-gray-100 bg-white"
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side - History */}
                <div className="w-48 flex flex-col gap-2">
                    <h3 className="text-lg font-bold text-gray-800 text-center">История</h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {attempts.map((attempt) => (
                            <div
                                key={attempt.attemptNumber}
                                className="bg-blue-50 p-2 rounded text-sm border border-blue-200 flex flex-col px-3"
                            >
                                <div className="flex justify-between items-center w-full">
                                    <span className="font-semibold text-gray-700">
                                        #{attempt.attemptNumber}
                                    </span>
                                    <span className="text-blue-600 font-bold font-mono">
                                        {attempt.time}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {attempts.length === 0 && (
                            <p className="text-gray-400 text-center text-xs">Нет результатов</p>
                        )}
                    </div>
                </div>
            </div>


            {/* Results Modal */}
            {showResults && (() => {
                const isPassed = foundWords.size >= currentWords.length;

                return (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                            <div className="p-6 text-center">
                                <div className="text-6xl mb-4">{isPassed ? '✅' : '⏱️'}</div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    {isPassed ? 'Упражнение завершено!' : 'Время вышло!'}
                                </h2>
                                <p className={`${isPassed ? 'text-green-600' : 'text-orange-600'} font-medium`}>
                                    Найдено слов: {foundWords.size} из {currentWords.length}
                                </p>
                                {!isPassed && (
                                    <p className="text-gray-500 text-sm mt-2">
                                        Найдите все слова чтобы пройти упражнение
                                    </p>
                                )}
                            </div>
                            <div className="border-t border-gray-200 p-6 space-y-3">
                                <button
                                    onClick={() => { setShowResults(false); handleStart(); }}
                                    className={`w-full px-6 py-3 ${isPassed ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-orange-500 hover:bg-orange-600 text-white'} rounded-full font-bold transition-all`}
                                >
                                    {isPassed ? 'Пройти ещё раз' : 'Попробовать ещё раз'}
                                </button>
                                {isLocked && isPassed && (
                                    <Link href={getNextPath()}>
                                        <button
                                            onClick={() => lockedCompleteExercise({ completed: true, wordsFound: foundWords.size, totalWords: currentWords.length }, true)}
                                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            {hasNextExercise ? 'К следующему упражнению' : 'Вернуться в меню'}
                                            <ArrowRight size={18} />
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
