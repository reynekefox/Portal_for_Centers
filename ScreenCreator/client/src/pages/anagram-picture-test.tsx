import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Square, HelpCircle, X, Settings, RotateCcw, ArrowRight } from "lucide-react";
import { useLockedParams } from "@/hooks/useLockedParams";
import { WORD_DICTIONARY, getDistractors, WordEntry } from "@/lib/word-dictionary";

type Phase = 'idle' | 'playing' | 'correct' | 'wrong' | 'result';

// Shuffle string characters
function shuffleWord(word: string): string {
    const chars = word.split('');
    for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const shuffled = chars.join('');
    if (shuffled === word && word.length > 1) {
        return shuffleWord(word);
    }
    return shuffled;
}

export default function AnagramPictureTest() {
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('anagram-picture-test');

    // Settings
    const [anagramCount, setAnagramCount] = useState(10);
    const [maxWordLength, setMaxWordLength] = useState(5);

    // Game state
    const [phase, setPhase] = useState<Phase>('idle');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentWord, setCurrentWord] = useState<WordEntry | null>(null);
    const [shuffledWord, setShuffledWord] = useState('');
    const [options, setOptions] = useState<WordEntry[]>([]);
    const [selectedOption, setSelectedOption] = useState<WordEntry | null>(null);

    // Results tracking
    const [correctCount, setCorrectCount] = useState(0);
    const [answers, setAnswers] = useState<Array<{ word: string; correct: boolean }>>([]);

    // Refs
    const nextRoundTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Modals
    const [showHelp, setShowHelp] = useState(false);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (nextRoundTimeoutRef.current) {
                clearTimeout(nextRoundTimeoutRef.current);
            }
        };
    }, []);

    // Apply locked parameters
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.anagramCount !== undefined) setAnagramCount(Number(lockedParameters.anagramCount));
            if (lockedParameters.maxWordLength !== undefined) setMaxWordLength(Number(lockedParameters.maxWordLength));
        }
    }, [isLocked, lockedParameters]);

    // Get filtered words
    const getFilteredWords = (): WordEntry[] => {
        return WORD_DICTIONARY.filter(w => w.word.length <= maxWordLength);
    };

    // Generate a new round
    const generateRound = () => {
        const availableWords = getFilteredWords();
        if (availableWords.length < 6) return;

        const correctWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        const distractors = getDistractors(correctWord, 5);
        const allOptions = [correctWord, ...distractors].sort(() => Math.random() - 0.5);
        const shuffled = shuffleWord(correctWord.word);

        setCurrentWord(correctWord);
        setShuffledWord(shuffled);
        setOptions(allOptions);
        setSelectedOption(null);
        setPhase('playing');
    };

    // Start game
    const startGame = () => {
        setCurrentIndex(0);
        setCorrectCount(0);
        setAnswers([]);
        generateRound();
    };

    // Stop game
    const stopGame = () => {
        if (nextRoundTimeoutRef.current) {
            clearTimeout(nextRoundTimeoutRef.current);
            nextRoundTimeoutRef.current = null;
        }
        setPhase('idle');
        setCurrentWord(null);
        setOptions([]);
    };

    // Handle option selection
    const handleOptionClick = (option: WordEntry) => {
        if (phase !== 'playing' || !currentWord) return;

        if (nextRoundTimeoutRef.current) {
            clearTimeout(nextRoundTimeoutRef.current);
            nextRoundTimeoutRef.current = null;
        }

        const isCorrect = option.word === currentWord.word;

        setSelectedOption(option);
        setAnswers(prev => [...prev, { word: currentWord.word, correct: isCorrect }]);
        if (isCorrect) {
            setCorrectCount(prev => prev + 1);
        }
        setPhase(isCorrect ? 'correct' : 'wrong');

        // Move to next round after delay
        nextRoundTimeoutRef.current = setTimeout(() => {
            const nextIdx = currentIndex + 1;
            if (nextIdx >= anagramCount) {
                setPhase('result');
            } else {
                setCurrentIndex(nextIdx);
                generateRound();
            }
            nextRoundTimeoutRef.current = null;
        }, isCorrect ? 1000 : 2000);
    };

    const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

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
                        <h1 className="text-xl font-bold text-gray-800">Анаграммы 2</h1>
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
                        onClick={phase === 'playing' || phase === 'correct' || phase === 'wrong' ? stopGame : startGame}
                        className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${phase === 'playing' || phase === 'correct' || phase === 'wrong'
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                    >
                        {phase === 'playing' || phase === 'correct' || phase === 'wrong' ? <Square size={18} /> : <Play size={18} />}
                        {phase === 'playing' || phase === 'correct' || phase === 'wrong' ? 'Остановить' : 'Начать'}
                    </button>

                    {/* Progress indicator */}
                    {(phase === 'playing' || phase === 'correct' || phase === 'wrong') && (
                        <div className="text-center text-gray-600">
                            {currentIndex + 1} из {anagramCount}
                        </div>
                    )}

                    {/* Settings - Hidden when locked or playing */}
                    {!isLocked && phase === 'idle' && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings size={16} className="text-gray-500" />
                                <span className="font-medium text-gray-700">Настройки</span>
                            </div>

                            {/* Min Word Length */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2 text-center">Макс. букв в слове</label>
                                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                    <button
                                        onClick={() => setMaxWordLength(Math.max(3, maxWordLength - 1))}
                                        disabled={maxWordLength <= 3}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >−</button>
                                    <span className="font-bold text-xl text-gray-800 min-w-[3rem] text-center">{maxWordLength}</span>
                                    <button
                                        onClick={() => setMaxWordLength(Math.min(10, maxWordLength + 1))}
                                        disabled={maxWordLength >= 10}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >+</button>
                                </div>
                            </div>

                            {/* Anagram Count */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2 text-center">Число анаграмм</label>
                                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                    <button
                                        onClick={() => setAnagramCount(Math.max(5, anagramCount - 5))}
                                        disabled={anagramCount <= 5}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >−</button>
                                    <span className="font-bold text-xl text-gray-800 min-w-[3rem] text-center">{anagramCount}</span>
                                    <button
                                        onClick={() => setAnagramCount(Math.min(20, anagramCount + 5))}
                                        disabled={anagramCount >= 20}
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
                            <div className="text-6xl mb-4">🖼️</div>
                            <div className="text-xl text-gray-500">
                                Нажмите "Начать"
                            </div>
                        </div>
                    )}

                    {/* Playing State */}
                    {(phase === 'playing' || phase === 'correct' || phase === 'wrong') && currentWord && (
                        <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
                            {/* Shuffled Word */}
                            <div className="text-4xl font-bold tracking-widest text-gray-800 uppercase bg-gray-100 px-8 py-4 rounded-2xl">
                                {shuffledWord}
                            </div>

                            {/* Picture Options - 3x2 grid */}
                            <div className="grid grid-cols-3 gap-3 w-full">
                                {options.map((option, i) => {
                                    const isSelected = selectedOption?.word === option.word;
                                    const isCorrectAnswer = currentWord.word === option.word;
                                    const showCorrect = phase === 'wrong' && isCorrectAnswer;
                                    const showWrong = phase === 'wrong' && isSelected && !isCorrectAnswer;
                                    const showSuccess = phase === 'correct' && isSelected;

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleOptionClick(option)}
                                            disabled={phase !== 'playing'}
                                            className={`
                                                relative aspect-square rounded-xl overflow-hidden transition-all border-4
                                                ${phase === 'playing' ? 'hover:scale-105 hover:shadow-lg cursor-pointer border-gray-200' : ''}
                                                ${showSuccess ? 'border-green-500 scale-105 shadow-lg' : ''}
                                                ${showWrong ? 'border-red-500 opacity-60' : ''}
                                                ${showCorrect ? 'border-green-500 shadow-lg' : ''}
                                                ${!isSelected && phase !== 'playing' && !showCorrect ? 'opacity-40 border-gray-200' : ''}
                                            `}
                                        >
                                            <img
                                                src={`/word-images/${option.image}`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                }}
                                            />
                                            {showSuccess && (
                                                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                                                    <div className="bg-green-500 rounded-full p-2">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                            {showWrong && (
                                                <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                                                    <div className="bg-red-500 rounded-full p-2">
                                                        <X className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                            {showCorrect && !showSuccess && (
                                                <div className="absolute bottom-1 left-1 right-1 bg-green-500 text-white py-1 px-2 rounded text-center text-xs font-bold">
                                                    {option.word}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Result State */}
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
                                {isLocked && (() => {
                                    const passed = accuracy >= (requiredResult?.minValue || 0);
                                    return passed ? (
                                        <Link href={getNextPath()}>
                                            <button
                                                onClick={() => {
                                                    lockedCompleteExercise({ correctCount, anagramCount, accuracy }, true);
                                                }}
                                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all flex items-center gap-2"
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
                {(phase === 'playing' || phase === 'correct' || phase === 'wrong' || phase === 'result') && (
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
                                <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
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
                            <p><strong>Цель:</strong> Найти картинку по перемешанному слову.</p>
                            <p><strong>Как играть:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Посмотрите на буквы вверху экрана</li>
                                <li>Составьте слово из этих букв</li>
                                <li>Нажмите на картинку, которая соответствует слову</li>
                            </ul>
                            <p><strong>Настройки:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Мин. букв — минимальная длина слов</li>
                                <li>Число анаграмм — сколько слов угадать</li>
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
