import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, HelpCircle, X, Square, Settings, ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { useLockedParams } from "@/hooks/useLockedParams";

type Phase = 'idle' | 'playing' | 'finished';

// Individual click during current game (not persisted to history)
interface ClickRecord {
    digit: number;
    correct: boolean;
    reactionTime: number; // ms
}

// Full game session record (persisted to history)
interface GameRecord {
    rounds: number;
    accuracy: number; // %
    avgReactionTime: number; // ms
    errors: number;
    timestamp: Date;
}

export default function FastNumbers() {
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('fast-numbers');

    // Settings
    const [rounds, setRounds] = useState(3);
    const [shuffle, setShuffle] = useState(false);

    // Grid display order (shuffled or sequential)
    const [gridOrder, setGridOrder] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // Game state
    const [phase, setPhase] = useState<Phase>('idle');
    const [currentRound, setCurrentRound] = useState(0);
    const [remainingDigits, setRemainingDigits] = useState<number[]>([]);
    const [currentDigit, setCurrentDigit] = useState<number | null>(null);

    // Current game session clicks (reset each game)
    const [currentClicks, setCurrentClicks] = useState<ClickRecord[]>([]);

    // History of completed game sessions
    const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);

    // Modals
    const [showHelp, setShowHelp] = useState(false);

    // Refs
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
    const digitStartTimeRef = useRef<number>(0);

    // Russian number names for speech synthesis
    const DIGIT_NAMES: Record<number, string> = {
        1: 'один',
        2: 'два',
        3: 'три',
        4: 'четыре',
        5: 'пять',
        6: 'шесть',
        7: 'семь',
        8: 'восемь',
        9: 'девять'
    };

    // Apply locked parameters
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.rounds !== undefined) setRounds(Number(lockedParameters.rounds));
            if (lockedParameters.shuffle !== undefined) setShuffle(Boolean(lockedParameters.shuffle));
        }
    }, [isLocked, lockedParameters]);

    // Speak a digit
    const speak = (digit: number) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(DIGIT_NAMES[digit]);
            utterance.lang = 'ru-RU';
            utterance.rate = 0.9;
            speechRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Fisher-Yates shuffle
    const shuffleArray = <T,>(array: T[]): T[] => {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    };

    // Start a new round
    const startRound = () => {
        const digits = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        setRemainingDigits(digits);
        setCurrentDigit(null);

        // Say the first digit after a short delay
        setTimeout(() => {
            sayNextDigit(digits);
        }, 1000);
    };

    // Say the next digit
    const sayNextDigit = (digits: number[]) => {
        if (digits.length === 0) {
            // Round complete
            const nextRound = currentRound + 1;
            if (nextRound >= rounds) {
                // All rounds complete - save game session to history
                const correctCount = currentClicks.filter(c => c.correct).length;
                const totalAttempts = currentClicks.length;
                const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
                const avgReactionTime = correctCount > 0
                    ? Math.round(currentClicks.filter(c => c.correct).reduce((sum, c) => sum + c.reactionTime, 0) / correctCount)
                    : 0;

                const gameRecord: GameRecord = {
                    rounds,
                    accuracy,
                    avgReactionTime,
                    errors: totalAttempts - correctCount,
                    timestamp: new Date()
                };
                setGameHistory(prev => [...prev, gameRecord]);

                setPhase('finished');
                window.speechSynthesis.cancel();
            } else {
                // Start next round
                setCurrentRound(nextRound);
                setTimeout(() => {
                    startRound();
                }, 1500);
            }
            return;
        }

        const nextDigit = digits[0];
        setCurrentDigit(nextDigit);
        digitStartTimeRef.current = Date.now();
        speak(nextDigit);
    };

    // Handle cell click
    const handleCellClick = (digit: number) => {
        if (phase !== 'playing' || currentDigit === null) return;

        const reactionTime = Date.now() - digitStartTimeRef.current;
        const isCorrect = digit === currentDigit;

        const record: ClickRecord = {
            digit: currentDigit,
            correct: isCorrect,
            reactionTime
        };
        setCurrentClicks(prev => [...prev, record]);

        if (isCorrect) {
            // Remove from remaining and say next
            const newRemaining = remainingDigits.slice(1);
            setRemainingDigits(newRemaining);
            setCurrentDigit(null);

            setTimeout(() => {
                sayNextDigit(newRemaining);
            }, 500);
        } else {
            // Wrong answer - repeat the same digit
            setTimeout(() => {
                speak(currentDigit);
                digitStartTimeRef.current = Date.now();
            }, 500);
        }
    };

    // Start game
    const startGame = () => {
        setPhase('playing');
        setCurrentRound(0);
        setCurrentClicks([]);
        // Set grid order based on shuffle setting
        setGridOrder(shuffle ? shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]) : [1, 2, 3, 4, 5, 6, 7, 8, 9]);
        startRound();
    };

    // Stop game
    const stopGame = () => {
        window.speechSynthesis.cancel();
        setPhase('idle');
        setCurrentDigit(null);
        setCurrentClicks([]);
        setCurrentRound(0);
    };

    // Reset game
    const resetGame = () => {
        window.speechSynthesis.cancel();
        setPhase('idle');
        setCurrentDigit(null);
        setCurrentClicks([]);
        setCurrentRound(0);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    // Calculate statistics for current game
    const correctCount = currentClicks.filter(h => h.correct).length;
    const totalAttempts = currentClicks.length;
    const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
    const avgReactionTime = correctCount > 0
        ? Math.round(currentClicks.filter(h => h.correct).reduce((sum, h) => sum + h.reactionTime, 0) / correctCount)
        : 0;

    // Check if passed (for locked mode)
    const requiredAccuracy = requiredResult ? Number(requiredResult) : 80;
    const passed = accuracy >= requiredAccuracy;

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
                        <h1 className="text-xl font-bold text-gray-800">Быстрые цифры</h1>
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
                {/* Left Sidebar */}
                <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
                    {/* Start/Stop Button */}
                    <button
                        onClick={phase === 'playing' ? stopGame : startGame}
                        className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${phase !== 'playing'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                    >
                        {phase !== 'playing' ? <Play size={18} /> : <Square size={18} />}
                        {phase !== 'playing' ? 'Начать тест' : 'Остановить'}
                    </button>

                    {/* Settings - Hidden when locked or playing */}
                    {!isLocked && phase !== 'playing' && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings size={16} className="text-gray-500" />
                                <span className="font-medium text-gray-700">Настройки</span>
                            </div>

                            {/* Rounds */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2">Количество кругов</label>
                                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => setRounds(Math.max(1, rounds - 1))}
                                        disabled={rounds <= 1}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >−</button>
                                    <span className="font-bold text-gray-800">{rounds}</span>
                                    <button
                                        onClick={() => setRounds(Math.min(10, rounds + 1))}
                                        disabled={rounds >= 10}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>

                            {/* Shuffle toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-500">Вразнобой</label>
                                <button
                                    onClick={() => setShuffle(!shuffle)}
                                    className={`w-10 h-5 rounded-full transition-all ${shuffle ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${shuffle ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Progress during game */}
                    {phase === 'playing' && (
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                            <div className="text-sm text-blue-600 mb-1">Круг</div>
                            <div className="text-3xl font-bold text-blue-800">{currentRound + 1} / {rounds}</div>
                            <div className="text-sm text-blue-600 mt-2">Осталось: {remainingDigits.length}</div>
                        </div>
                    )}
                </div>

                {/* Center - Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    {/* Idle State */}
                    {phase === 'idle' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-64 h-64 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-white">
                                <span className="text-6xl">🔢</span>
                            </div>
                            <p className="text-gray-500 text-center max-w-md">
                                Голос назовёт цифру — нажмите её как можно быстрее!<br />
                                Все 9 цифр будут названы {rounds} раз{rounds > 1 ? 'а' : ''}.
                            </p>
                            <button
                                onClick={startGame}
                                className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all"
                            >
                                НАЧАТЬ ТЕСТ
                            </button>
                        </div>
                    )}

                    {/* Playing State */}
                    {phase === 'playing' && (
                        <div className="flex flex-col items-center gap-8">
                            {/* Current digit display */}
                            <div className="h-20 flex items-center justify-center">
                                {currentDigit !== null && (
                                    <div className="text-4xl font-bold text-blue-600 animate-pulse">
                                        🔊 {DIGIT_NAMES[currentDigit]}
                                    </div>
                                )}
                            </div>

                            {/* 3x3 Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                {gridOrder.map(digit => (
                                    <button
                                        key={digit}
                                        onClick={() => handleCellClick(digit)}
                                        className={`
                      w-24 h-24 rounded-2xl text-4xl font-bold transition-all
                      bg-white border-2 border-gray-200 
                      hover:border-blue-400 hover:bg-blue-50 hover:scale-105
                      active:scale-95 active:bg-blue-100
                      shadow-md hover:shadow-lg
                    `}
                                    >
                                        {digit}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Finished State */}
                    {phase === 'finished' && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                {passed ? (
                                    <div className="bg-green-100 p-6 rounded-full">
                                        <Trophy className="w-20 h-20 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="bg-orange-100 p-6 rounded-full">
                                        <RotateCcw className="w-20 h-20 text-orange-600" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    {passed ? "Отлично!" : "Хорошая попытка!"}
                                </h2>
                                <div className="grid grid-cols-3 gap-4 mt-4 mb-4">
                                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                                        <p className="text-sm text-blue-600">Точность</p>
                                        <p className="text-2xl font-bold text-blue-700">{accuracy}%</p>
                                    </div>
                                    <div className="bg-red-50 rounded-xl p-4 text-center">
                                        <p className="text-sm text-red-600">Ошибок</p>
                                        <p className="text-2xl font-bold text-red-700">{totalAttempts - correctCount}</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                                        <p className="text-sm text-purple-600">Реакция</p>
                                        <p className="text-2xl font-bold text-purple-700">{avgReactionTime} мс</p>
                                    </div>
                                </div>
                                <p className="text-gray-500">
                                    {correctCount} правильных из {totalAttempts} попыток за {rounds} круг{rounds > 1 ? 'а' : ''}
                                </p>
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all"
                                >
                                    <RotateCcw size={18} className="inline mr-2" />
                                    Ещё раз
                                </button>
                                {isLocked && passed && (
                                    <Link href={getNextPath()}>
                                        <button
                                            onClick={() => {
                                                lockedCompleteExercise({ correctCount, totalAttempts, accuracy, avgReactionTime }, true);
                                            }}
                                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all flex items-center gap-2"
                                        >
                                            {hasNextExercise ? 'К следующему →' : 'Готово ✓'}
                                            <ArrowRight size={18} />
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Game Session History */}
                <div className="w-64 bg-white border-l border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-700">История игр</span>
                    </div>

                    {gameHistory.length === 0 ? (
                        <p className="text-gray-400 text-sm">Нет завершённых игр</p>
                    ) : (
                        <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                            {gameHistory.slice().reverse().map((game, i) => (
                                <div
                                    key={i}
                                    className={`p-4 rounded-xl text-sm border ${game.accuracy >= 80
                                        ? 'bg-green-50 border-green-200'
                                        : game.accuracy >= 60
                                            ? 'bg-yellow-50 border-yellow-200'
                                            : 'bg-red-50 border-red-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-500 text-xs">Игра #{gameHistory.length - i}</span>
                                        <span className={`font-bold text-lg ${game.accuracy >= 80 ? 'text-green-600' :
                                            game.accuracy >= 60 ? 'text-yellow-600' : 'text-red-500'
                                            }`}>
                                            {game.accuracy}%
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Кругов:</span>
                                            <span className="font-medium">{game.rounds}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Ошибок:</span>
                                            <span className="font-medium text-red-600">{game.errors}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Реакция:</span>
                                            <span className="font-medium">{game.avgReactionTime} мс</span>
                                        </div>
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
                            <p><strong>Цель:</strong> Тренировка слухового восприятия и скорости реакции.</p>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Голос называет цифру от 1 до 9</li>
                                <li>Нажмите названную цифру как можно быстрее</li>
                                <li>Каждая цифра называется ровно 1 раз за круг</li>
                                <li>Порядок цифр случайный</li>
                                <li>Можно настроить количество кругов</li>
                            </ul>
                            <p><strong>Совет:</strong> Смотрите на всё поле, не фокусируйтесь на одной цифре!</p>
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
