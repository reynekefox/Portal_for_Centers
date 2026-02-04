import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, HelpCircle, X, RotateCcw, Settings, Square, Trophy, Image, Type } from "lucide-react";
import { WordEntry, WordCategory, CATEGORY_LABELS, getWordsByCategory, getCategoriesWithCounts } from "@/lib/word-dictionary";

// 2-letter syllables for syllable mode
const SYLLABLES = [
    'БА', 'БЕ', 'БИ', 'БО', 'БУ', 'БЫ',
    'ВА', 'ВЕ', 'ВИ', 'ВО', 'ВУ', 'ВЫ',
    'ГА', 'ГЕ', 'ГИ', 'ГО', 'ГУ',
    'ДА', 'ДЕ', 'ДИ', 'ДО', 'ДУ', 'ДЫ',
    'ЖА', 'ЖЕ', 'ЖИ', 'ЖО', 'ЖУ',
    'ЗА', 'ЗЕ', 'ЗИ', 'ЗО', 'ЗУ', 'ЗЫ',
    'КА', 'КЕ', 'КИ', 'КО', 'КУ',
    'ЛА', 'ЛЕ', 'ЛИ', 'ЛО', 'ЛУ', 'ЛЫ',
    'МА', 'МЕ', 'МИ', 'МО', 'МУ', 'МЫ',
    'НА', 'НЕ', 'НИ', 'НО', 'НУ', 'НЫ',
    'ПА', 'ПЕ', 'ПИ', 'ПО', 'ПУ',
    'РА', 'РЕ', 'РИ', 'РО', 'РУ', 'РЫ',
    'СА', 'СЕ', 'СИ', 'СО', 'СУ', 'СЫ',
    'ТА', 'ТЕ', 'ТИ', 'ТО', 'ТУ', 'ТЫ',
    'ФА', 'ФЕ', 'ФИ', 'ФО', 'ФУ',
    'ХА', 'ХЕ', 'ХИ', 'ХО', 'ХУ',
    'ЦА', 'ЦЕ', 'ЦИ', 'ЦО', 'ЦУ',
    'ЧА', 'ЧЕ', 'ЧИ', 'ЧО', 'ЧУ',
    'ША', 'ШЕ', 'ШИ', 'ШО', 'ШУ',
    'ЩА', 'ЩЕ', 'ЩИ', 'ЩО', 'ЩУ',
];

interface ImageCard {
    id: number;
    word: WordEntry;
    isFlipped: boolean;
    isMatched: boolean;
}

interface SyllableCard {
    id: number;
    syllable: string;
    isFlipped: boolean;
    isMatched: boolean;
}

type Card = ImageCard | SyllableCard;

function isImageCard(card: Card): card is ImageCard {
    return 'word' in card;
}

type Phase = 'idle' | 'playing' | 'results';
type DisplayMode = 'images' | 'syllables';

interface AttemptRecord {
    moves: number;
    pairs: number;
    timestamp: Date;
    mode: string;
}

export default function MemoryCards() {
    const [phase, setPhase] = useState<Phase>('idle');
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [matchedPairs, setMatchedPairs] = useState(0);
    const [isChecking, setIsChecking] = useState(false);

    // Settings - grid configurations: rows x cols (must be even total)
    const gridConfigs = [
        { rows: 2, cols: 3, label: '2×3' },  // 6 cards = 3 pairs
        { rows: 2, cols: 4, label: '2×4' },  // 8 cards = 4 pairs
        { rows: 3, cols: 4, label: '3×4' },  // 12 cards = 6 pairs
        { rows: 4, cols: 4, label: '4×4' },  // 16 cards = 8 pairs
        { rows: 4, cols: 5, label: '4×5' },  // 20 cards = 10 pairs
    ];
    const [gridConfigIndex, setGridConfigIndex] = useState(2); // default 3x4
    const currentGrid = gridConfigs[gridConfigIndex];

    // Category settings (only for images mode)
    const categories = getCategoriesWithCounts();
    const [selectedCategory, setSelectedCategory] = useState<WordCategory>('animals');

    // Display mode: images or syllables
    const [displayMode, setDisplayMode] = useState<DisplayMode>('images');

    // History
    const [attemptHistory, setAttemptHistory] = useState<AttemptRecord[]>([]);

    // Modal
    const [showHelp, setShowHelp] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const totalPairs = (currentGrid.rows * currentGrid.cols) / 2;

    // Get words for selected category (only used in images mode)
    const categoryWords = getWordsByCategory(selectedCategory);
    const hasEnoughWords = displayMode === 'syllables' || categoryWords.length >= totalPairs;

    // Play card flip sound using Web Audio API
    const playFlipSound = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;

            // Create noise buffer for rustling effect
            const bufferSize = ctx.sampleRate * 0.15; // 150ms
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                // White noise with envelope
                const envelope = Math.sin(Math.PI * i / bufferSize);
                data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
            }

            const source = ctx.createBufferSource();
            source.buffer = buffer;

            // Add filter for softer sound
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 2000;

            const gainNode = ctx.createGain();
            gainNode.gain.value = 0.2;

            source.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);

            source.start();
        } catch (e) {
            // Audio not supported - ignore
        }
    };

    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const startGame = () => {
        if (!hasEnoughWords) return;

        let newCards: Card[] = [];

        if (displayMode === 'images') {
            // Images mode - use words from selected category
            const shuffledWords = shuffleArray(categoryWords);
            const selectedWords = shuffledWords.slice(0, totalPairs);

            selectedWords.forEach((word, index) => {
                newCards.push({
                    id: index * 2,
                    word: word,
                    isFlipped: false,
                    isMatched: false,
                });
                newCards.push({
                    id: index * 2 + 1,
                    word: word,
                    isFlipped: false,
                    isMatched: false,
                });
            });
        } else {
            // Syllables mode - use 2-letter syllables
            const shuffledSyllables = shuffleArray(SYLLABLES);
            const selectedSyllables = shuffledSyllables.slice(0, totalPairs);

            selectedSyllables.forEach((syllable, index) => {
                newCards.push({
                    id: index * 2,
                    syllable: syllable,
                    isFlipped: false,
                    isMatched: false,
                });
                newCards.push({
                    id: index * 2 + 1,
                    syllable: syllable,
                    isFlipped: false,
                    isMatched: false,
                });
            });
        }

        // Shuffle cards
        const shuffledCards = shuffleArray(newCards);

        setCards(shuffledCards);
        setFlippedCards([]);
        setMoves(0);
        setMatchedPairs(0);
        setPhase('playing');
    };

    const stopGame = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setPhase('idle');
        setCards([]);
        setFlippedCards([]);
        setMoves(0);
        setMatchedPairs(0);
        setIsChecking(false);
    };

    const getCardMatchKey = (card: Card): string => {
        if (isImageCard(card)) {
            return card.word.word;
        } else {
            return card.syllable;
        }
    };

    const handleCardClick = (cardIndex: number) => {
        if (isChecking) return;
        if (flippedCards.length >= 2) return;
        if (cards[cardIndex].isFlipped) return;
        if (cards[cardIndex].isMatched) return;

        // Flip the card
        playFlipSound();
        const newCards = [...cards];
        newCards[cardIndex].isFlipped = true;
        setCards(newCards);

        const newFlippedCards = [...flippedCards, cardIndex];
        setFlippedCards(newFlippedCards);

        // If two cards are flipped, check for match
        if (newFlippedCards.length === 2) {
            setMoves(prev => prev + 1);
            setIsChecking(true);

            const [first, second] = newFlippedCards;
            const firstCard = newCards[first];
            const secondCard = newCards[second];

            if (getCardMatchKey(firstCard) === getCardMatchKey(secondCard)) {
                // Match found!
                timerRef.current = setTimeout(() => {
                    const matchedCards = [...newCards];
                    matchedCards[first].isMatched = true;
                    matchedCards[second].isMatched = true;
                    setCards(matchedCards);
                    setFlippedCards([]);
                    setMatchedPairs(prev => {
                        const newMatched = prev + 1;
                        // Check for win
                        if (newMatched === totalPairs) {
                            setTimeout(() => {
                                setAttemptHistory(history => [{
                                    moves: moves + 1,
                                    pairs: totalPairs,
                                    timestamp: new Date(),
                                    mode: displayMode === 'images' ? CATEGORY_LABELS[selectedCategory] : 'Слоги'
                                }, ...history].slice(0, 10));
                                setPhase('results');
                            }, 500);
                        }
                        return newMatched;
                    });
                    setIsChecking(false);
                }, 500);
            } else {
                // No match - flip back
                timerRef.current = setTimeout(() => {
                    const flippedBack = [...newCards];
                    flippedBack[first].isFlipped = false;
                    flippedBack[second].isFlipped = false;
                    setCards(flippedBack);
                    setFlippedCards([]);
                    setIsChecking(false);
                }, 1000);
            }
        }
    };

    const resetGame = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setPhase('idle');
        setCards([]);
        setFlippedCards([]);
        setMoves(0);
        setMatchedPairs(0);
        setIsChecking(false);
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    // Card content renderer
    const renderCardContent = (card: Card) => {
        if (isImageCard(card)) {
            return (
                <img
                    src={`/word-images/${card.word.image}`}
                    alt={card.word.word}
                    className="w-full h-full object-cover rounded-lg"
                />
            );
        } else {
            // Syllable card
            return (
                <div className="flex items-center justify-center h-full">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-700">
                        {card.syllable}
                    </span>
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 py-4 px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <ArrowLeft size={24} />
                            </button>
                        </Link>
                        <h1 className="text-xl font-bold text-gray-800">Парные карточки</h1>
                    </div>
                    <button
                        onClick={() => setShowHelp(true)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                    >
                        <HelpCircle size={24} />
                    </button>
                </div>
            </div>

            {/* Main Content - 3 Column Layout */}
            <div className="flex-1 flex">
                {/* Left Sidebar - Compact */}
                <div className="w-64 bg-white border-r border-gray-200 p-3 flex flex-col gap-2">
                    {/* Start/Stop Button */}
                    <button
                        onClick={phase === 'playing' ? stopGame : startGame}
                        disabled={phase !== 'playing' && !hasEnoughWords}
                        className={`w-full py-2.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all text-sm ${phase === 'playing'
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : hasEnoughWords
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {phase === 'playing' ? <Square size={16} /> : <Play size={16} />}
                        {phase === 'playing' ? 'Остановить' : 'Начать'}
                    </button>

                    {/* Not enough words warning */}
                    {!hasEnoughWords && phase === 'idle' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-700">
                            Недостаточно слов ({categoryWords.length}/{totalPairs})
                        </div>
                    )}

                    {/* Game Stats */}
                    {phase === 'playing' && (
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-blue-600">Ходов</p>
                            <p className="text-2xl font-bold text-blue-700">{moves}</p>
                            <p className="text-xs text-blue-500">
                                Найдено: {matchedPairs}/{totalPairs}
                            </p>
                        </div>
                    )}

                    {/* Settings */}
                    <div className={`bg-gray-50 rounded-lg p-3 flex-1 ${phase === 'playing' ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-1.5 mb-2">
                            <Settings size={14} className="text-gray-500" />
                            <span className="font-medium text-gray-700 text-sm">Настройки</span>
                        </div>

                        {/* Syllables Toggle */}
                        <div
                            onClick={() => setDisplayMode(displayMode === 'syllables' ? 'images' : 'syllables')}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all mb-2 ${displayMode === 'syllables'
                                ? 'bg-indigo-50 border border-indigo-200'
                                : 'bg-white border border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className={`text-xs font-medium flex items-center gap-1.5 ${displayMode === 'syllables' ? 'text-indigo-700' : 'text-gray-700'}`}>
                                <Type size={14} />
                                Слоги
                            </span>
                            <div className={`w-8 h-5 rounded-full p-0.5 transition-all ${displayMode === 'syllables' ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${displayMode === 'syllables' ? 'translate-x-3' : 'translate-x-0'}`} />
                            </div>
                        </div>

                        {/* Category Selection - compact grid */}
                        <div className={`mb-2 transition-all ${displayMode === 'syllables' ? 'opacity-40 pointer-events-none' : ''}`}>
                            <label className="text-xs text-gray-500 block mb-1">Категория</label>
                            <div className="grid grid-cols-2 gap-1">
                                {categories.map(cat => (
                                    <div
                                        key={cat.category}
                                        onClick={() => setSelectedCategory(cat.category)}
                                        className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all text-xs ${selectedCategory === cat.category
                                            ? 'bg-indigo-100 text-indigo-700 font-medium'
                                            : 'bg-white text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="truncate">{cat.label}</span>
                                        <span className={`ml-1 ${selectedCategory === cat.category ? 'text-indigo-500' : 'text-gray-400'}`}>
                                            {cat.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Grid Size */}
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Поле</label>
                            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                <button
                                    onClick={() => setGridConfigIndex(Math.max(0, gridConfigIndex - 1))}
                                    disabled={gridConfigIndex <= 0 || phase !== 'idle'}
                                    className="p-1.5 text-gray-500 disabled:opacity-50 text-sm"
                                >−</button>
                                <span className="font-bold text-gray-800 text-sm">{currentGrid.label}</span>
                                <button
                                    onClick={() => setGridConfigIndex(Math.min(gridConfigs.length - 1, gridConfigIndex + 1))}
                                    disabled={gridConfigIndex >= gridConfigs.length - 1 || phase !== 'idle'}
                                    className="p-1.5 text-gray-500 disabled:opacity-50 text-sm"
                                >+</button>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 text-center">{totalPairs} пар</p>
                        </div>
                    </div>
                </div>

                {/* Center - Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
                    {/* Idle State */}
                    {phase === 'idle' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-64 h-64 rounded-3xl border-4 border-dashed border-gray-300 flex flex-col items-center justify-center bg-white gap-4">
                                <span className="text-6xl">🃏</span>
                                <div className="text-center px-4">
                                    <p className="text-gray-600 font-medium">
                                        {displayMode === 'images' ? CATEGORY_LABELS[selectedCategory] : 'Слоги'}
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        {displayMode === 'images' ? 'Картинки' : 'Двухбуквенные слоги'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={startGame}
                                disabled={!hasEnoughWords}
                                className={`px-10 py-3 font-bold rounded-full shadow-lg transition-all ${hasEnoughWords
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                НАЧАТЬ ИГРУ
                            </button>
                        </div>
                    )}

                    {/* Playing Phase */}
                    {phase === 'playing' && (
                        <div
                            className="grid gap-2"
                            style={{
                                gridTemplateColumns: `repeat(${currentGrid.cols}, 1fr)`,
                                // Calculate max size: take 75vh for height, divide by rows; take 70vw for width, divide by cols
                                // Use the smaller value to ensure cards are square and fit
                                width: `min(calc(75vh * ${currentGrid.cols} / ${currentGrid.rows}), 70vw)`,
                                maxWidth: '800px'
                            }}
                        >
                            {cards.map((card, index) => (
                                <div
                                    key={card.id}
                                    onClick={() => handleCardClick(index)}
                                    className={`aspect-square rounded-xl cursor-pointer transition-all duration-300 overflow-hidden ${card.isFlipped || card.isMatched
                                        ? 'bg-white shadow-lg border-2 border-indigo-300'
                                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-md'
                                        } ${card.isMatched ? 'opacity-60 border-green-400' : ''}`}
                                >
                                    <div className="w-full h-full flex items-center justify-center p-1">
                                        {card.isFlipped || card.isMatched ? (
                                            renderCardContent(card)
                                        ) : (
                                            <span className="text-2xl text-white/50">?</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Results Phase */}
                    {phase === 'results' && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="bg-yellow-100 p-6 rounded-full">
                                    <Trophy className="w-20 h-20 text-yellow-500" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Поздравляем! 🎉
                                </h2>
                                <p className="text-xl text-gray-600">
                                    Вы нашли все пары за <span className="font-bold text-indigo-600">{moves}</span> ходов!
                                </p>
                                <p className="text-gray-500 mt-2">
                                    {moves <= totalPairs ? 'Отлично!' : moves <= totalPairs * 1.5 ? 'Хорошо!' : 'Можно лучше!'}
                                </p>
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all flex items-center gap-2"
                                >
                                    <RotateCcw size={18} />
                                    Ещё раз
                                </button>
                                <Link href="/">
                                    <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all">
                                        На главную
                                    </button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - History */}
                <div className="w-64 bg-white border-l border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-700">История попыток</span>
                    </div>

                    {attemptHistory.length === 0 ? (
                        <p className="text-gray-400 text-sm">Нет попыток</p>
                    ) : (
                        <div className="space-y-2">
                            {attemptHistory.map((attempt, i) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-500">Ходов</span>
                                        <span className="font-bold text-indigo-600">
                                            {attempt.moves}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-500">Пар</span>
                                        <span className="text-gray-700">{attempt.pairs}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {attempt.mode}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
                            <p><strong>Цель:</strong> Найти все парные карточки.</p>
                            <p><strong>Режимы:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li><strong>Слоги</strong> — карточки с двухбуквенными слогами (БА, МА, КО...)</li>
                                <li><strong>Картинки</strong> — карточки с изображениями по категориям</li>
                            </ul>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Нажмите на карточку, чтобы перевернуть</li>
                                <li>Переворачивайте по 2 карточки</li>
                                <li>Если карточки совпали — они остаются открытыми</li>
                                <li>Если не совпали — обе закрываются</li>
                                <li>Найдите все пары за минимум ходов!</li>
                            </ul>
                        </div>
                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all"
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
