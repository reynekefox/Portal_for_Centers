import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, HelpCircle, X, CheckCircle, RotateCcw, Clock, Square, ArrowRight } from "lucide-react";
import { useLessonConfig } from "@/hooks/use-lesson-config";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";
import { testQuestions, getImagePath, Question } from "@/lib/vocabulary";

type Phase = 'idle' | 'exposure' | 'recall' | 'results';

interface Pair {
    id: number;
    item1: Question;
    item2: Question;
}

interface AttemptRecord {
    correct: number;
    total: number;
    accuracy: number;
    timestamp: Date;
}

export default function PairsTest() {
    const { config, isLessonMode, timeRemaining, isTimeUp, completeExercise } = useLessonConfig();
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('pairs-test');

    // Game State
    const [phase, setPhase] = useState<Phase>('idle');
    const [pairs, setPairs] = useState<Pair[]>([]);
    const [currentPairIndex, setCurrentPairIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<(Question | null)[]>([]);
    const [pool, setPool] = useState<Question[]>([]);
    const [seenPairs, setSeenPairs] = useState<Set<number>>(new Set());

    // Settings
    const [pairCount, setPairCount] = useState(5);
    const [wordMode, setWordMode] = useState(false);
    const [pairTime, setPairTime] = useState<number | null>(null); // null = infinity

    // Timer for individual pair
    const [pairTimeLeft, setPairTimeLeft] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Results
    const [score, setScore] = useState(0);
    const [attemptHistory, setAttemptHistory] = useState<AttemptRecord[]>([]);

    // Modals
    const [showHelp, setShowHelp] = useState(false);

    // Dragging
    const [draggedItem, setDraggedItem] = useState<Question | null>(null);

    const formatTime = (seconds: number) => {
        const roundedSeconds = Math.round(seconds);
        const mins = Math.floor(roundedSeconds / 60);
        const secs = roundedSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatPairTime = (time: number | null) => {
        if (time === null) return '∞';
        return `${time.toFixed(1)}с`;
    };

    // Apply locked parameters from assignment
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.pairCount !== undefined) setPairCount(Number(lockedParameters.pairCount));
            if (lockedParameters.pairTime !== undefined) setPairTime(Number(lockedParameters.pairTime));
            if (lockedParameters.wordMode !== undefined) setWordMode(Boolean(lockedParameters.wordMode));
        }
    }, [isLocked, lockedParameters]);

    // Countdown timer for exposure phase
    useEffect(() => {
        if (phase === 'exposure' && pairTime !== null) {
            setPairTimeLeft(pairTime);
            timerRef.current = setInterval(() => {
                setPairTimeLeft(prev => {
                    if (prev === null || prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
    }, [phase, pairTime]);

    // Auto-proceed to recall when timer reaches 0
    useEffect(() => {
        if (phase === 'exposure' && pairTimeLeft === 0) {
            startRecall();
        }
    }, [pairTimeLeft, phase]);

    const startGame = () => {
        // Select random items and create pairs
        const shuffled = [...testQuestions].sort(() => Math.random() - 0.5);
        const selectedItems = shuffled.slice(0, pairCount * 2);

        const newPairs: Pair[] = [];
        for (let i = 0; i < pairCount; i++) {
            newPairs.push({
                id: i,
                item1: selectedItems[i * 2],
                item2: selectedItems[i * 2 + 1]
            });
        }

        setPairs(newPairs);
        setCurrentPairIndex(0);
        setUserAnswers(new Array(pairCount).fill(null));
        setPool([]);
        setSeenPairs(new Set([0])); // Mark first pair as seen
        setPhase('exposure');

        // Start timer if pairTime is set
        if (pairTime !== null) {
            setPairTimeLeft(pairTime);
        }
    };

    const stopGame = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('idle');
        setPairs([]);
        setUserAnswers([]);
        setPool([]);
        setCurrentPairIndex(0);
        setPairTimeLeft(null);
        setSeenPairs(new Set());
    };

    const handleNextPair = () => {
        if (timerRef.current) clearInterval(timerRef.current);

        if (pairTime === null) {
            // No time limit: cycle pairs infinitely
            const nextIndex = (currentPairIndex + 1) % pairs.length;
            setCurrentPairIndex(nextIndex);
            setSeenPairs(prev => {
                const newSet = new Set(Array.from(prev));
                newSet.add(nextIndex);
                return newSet;
            });
        } else {
            // Time limit: only go forward, no cycling
            if (currentPairIndex < pairs.length - 1) {
                const nextIndex = currentPairIndex + 1;
                setCurrentPairIndex(nextIndex);
                setSeenPairs(prev => {
                    const newSet = new Set(Array.from(prev));
                    newSet.add(nextIndex);
                    return newSet;
                });
                setPairTimeLeft(pairTime);
            }
        }
    };

    const startRecall = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPairTimeLeft(null);

        // Create pool with all second items from pairs, shuffled
        const poolItems = pairs.map(p => p.item2).sort(() => Math.random() - 0.5);
        setPool(poolItems);
        setPhase('recall');
    };

    const checkResults = () => {
        let correct = 0;
        userAnswers.forEach((answer, index) => {
            if (answer?.id === pairs[index]?.item2.id) {
                correct++;
            }
        });
        setScore(correct);

        const accuracy = Math.round((correct / pairCount) * 100);
        setAttemptHistory(prev => [{
            correct,
            total: pairCount,
            accuracy,
            timestamp: new Date()
        }, ...prev].slice(0, 10));

        setPhase('results');
    };

    const resetGame = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('idle');
        setPairs([]);
        setUserAnswers([]);
        setPool([]);
        setScore(0);
        setCurrentPairIndex(0);
        setPairTimeLeft(null);
        setSeenPairs(new Set());
    };

    // Timer effect for pair exposure
    useEffect(() => {
        if (phase === 'exposure' && pairTime !== null && pairTimeLeft !== null) {
            timerRef.current = setInterval(() => {
                setPairTimeLeft(prev => {
                    if (prev === null || prev <= 0.1) {
                        // If on last pair, auto-start recall
                        if (currentPairIndex >= pairs.length - 1) {
                            startRecall();
                            return null;
                        }
                        handleNextPair();
                        return pairTime;
                    }
                    return prev - 0.1;
                });
            }, 100);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase, pairTime, currentPairIndex]);

    // Drag and drop handlers
    const handleDragStart = (item: Question) => {
        setDraggedItem(item);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (slotIndex: number) => {
        if (!draggedItem) return;

        // Check if item was already placed somewhere
        const existingSlotIndex = userAnswers.findIndex(item => item?.id === draggedItem.id);
        if (existingSlotIndex !== -1) {
            const newAnswers = [...userAnswers];
            newAnswers[existingSlotIndex] = null;
            setUserAnswers(newAnswers);
        }

        const newAnswers = [...userAnswers];
        const displacedItem = newAnswers[slotIndex];
        newAnswers[slotIndex] = draggedItem;
        setUserAnswers(newAnswers);

        if (existingSlotIndex === -1) {
            setPool(pool.filter(item => item.id !== draggedItem.id));
        }
        if (displacedItem) {
            setPool(prev => [...prev, displacedItem]);
        }
        setDraggedItem(null);
    };

    const handleSlotClick = (slotIndex: number) => {
        const item = userAnswers[slotIndex];
        if (item) {
            const newAnswers = [...userAnswers];
            newAnswers[slotIndex] = null;
            setUserAnswers(newAnswers);
            setPool(prev => [...prev, item]);
        }
    };

    const handlePoolItemClick = (item: Question) => {
        const emptySlotIndex = userAnswers.findIndex(slot => slot === null);
        if (emptySlotIndex !== -1) {
            const newAnswers = [...userAnswers];
            newAnswers[emptySlotIndex] = item;
            setUserAnswers(newAnswers);
            setPool(pool.filter(p => p.id !== item.id));
        }
    };

    const allSlotsFilled = userAnswers.every(slot => slot !== null);
    const allPairsSeen = seenPairs.size >= pairs.length;
    const currentPair = pairs[currentPairIndex];

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
                        <h1 className="text-xl font-bold text-gray-800">Пары</h1>
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
                        onClick={phase === 'idle' ? startGame : stopGame}
                        className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${phase === 'idle'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                    >
                        {phase === 'idle' ? <Play size={18} /> : <Square size={18} />}
                        {phase === 'idle' ? 'Начать тест' : 'Остановить'}
                    </button>

                    {/* Timer */}
                    {phase !== 'idle' && pairTime !== null && pairTimeLeft !== null && (
                        <div className="text-4xl font-mono font-bold text-blue-600 text-center py-2">
                            {formatTime(pairTimeLeft)}
                        </div>
                    )}

                    {/* Settings - Hidden when locked */}
                    {!isLocked && phase === 'idle' && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock size={16} className="text-gray-500" />
                                <span className="font-medium text-gray-700">Настройки</span>
                            </div>

                            {/* Pair Count */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2">Пар</label>
                                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => setPairCount(Math.max(2, pairCount - 1))}
                                        disabled={phase !== 'idle' || pairCount <= 2}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >−</button>
                                    <span className="font-bold text-gray-800">{pairCount}</span>
                                    <button
                                        onClick={() => setPairCount(Math.min(10, pairCount + 1))}
                                        disabled={phase !== 'idle' || pairCount >= 10}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>

                            {/* Pair Time */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2">Время (сек)</label>
                                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => {
                                            if (pairTime === null) {
                                                setPairTime(5);
                                            } else if (pairTime > 0.5) {
                                                setPairTime(pairTime - 0.5);
                                            }
                                        }}
                                        disabled={phase !== 'idle'}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >−</button>
                                    <span className="font-bold text-gray-800">{pairTime === null ? '∞' : pairTime.toFixed(1)}</span>
                                    <button
                                        onClick={() => {
                                            if (pairTime === null) {
                                                setPairTime(0.5);
                                            } else {
                                                setPairTime(Math.min(30, pairTime + 0.5));
                                            }
                                        }}
                                        disabled={phase !== 'idle'}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>

                            {/* Word Mode Toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-500">Слова</label>
                                <button
                                    onClick={() => setWordMode(!wordMode)}
                                    disabled={phase !== 'idle'}
                                    className={`w-10 h-5 rounded-full transition-all ${wordMode ? 'bg-blue-600' : 'bg-gray-300'} disabled:opacity-50`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${wordMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Center - Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    {/* Idle State */}
                    {phase === 'idle' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-64 h-64 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-white">
                                <span className="text-6xl">🎴</span>
                            </div>
                            <button
                                onClick={startGame}
                                className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-all"
                            >
                                НАЧАТЬ ТЕСТ
                            </button>
                        </div>
                    )}

                    {/* Exposure Phase */}
                    {phase === 'exposure' && currentPair && (
                        <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
                            <p className="text-gray-600 text-lg">
                                Запомните пару {currentPairIndex + 1} из {pairCount}
                            </p>

                            {/* Pair Display */}
                            <div className="flex items-center gap-8">
                                {/* First item */}
                                <div className="w-32 h-32 bg-white rounded-2xl shadow-md border border-gray-200 p-3 flex items-center justify-center">
                                    {wordMode ? (
                                        <span className="text-lg font-bold text-gray-800 text-center">
                                            {currentPair.item1.name.charAt(0).toUpperCase() + currentPair.item1.name.slice(1)}
                                        </span>
                                    ) : (
                                        <img
                                            src={getImagePath(currentPair.item1.image)}
                                            alt={currentPair.item1.name}
                                            className="w-full h-full object-contain"
                                        />
                                    )}
                                </div>

                                <span className="text-3xl text-gray-400">↔</span>

                                {/* Second item */}
                                <div className="w-32 h-32 bg-white rounded-2xl shadow-md border border-gray-200 p-3 flex items-center justify-center">
                                    {wordMode ? (
                                        <span className="text-lg font-bold text-gray-800 text-center">
                                            {currentPair.item2.name.charAt(0).toUpperCase() + currentPair.item2.name.slice(1)}
                                        </span>
                                    ) : (
                                        <img
                                            src={getImagePath(currentPair.item2.image)}
                                            alt={currentPair.item2.name}
                                            className="w-full h-full object-contain"
                                        />
                                    )}
                                </div>
                            </div>



                            {/* Navigation buttons */}
                            <div className="flex gap-4">
                                {pairTime === null ? (
                                    /* No time limit: Далее cycles, Готов! after all seen */
                                    <>
                                        <button
                                            onClick={handleNextPair}
                                            className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-full shadow-lg transition-all"
                                        >
                                            Далее
                                        </button>
                                        {allPairsSeen && (
                                            <button
                                                onClick={startRecall}
                                                className="px-12 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-full shadow-lg transition-all"
                                            >
                                                Готов!
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    /* Time limit: Далее goes forward only, Готов! on last pair */
                                    <>
                                        {currentPairIndex < pairs.length - 1 && (
                                            <button
                                                onClick={handleNextPair}
                                                className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-full shadow-lg transition-all"
                                            >
                                                Далее
                                            </button>
                                        )}
                                        {currentPairIndex === pairs.length - 1 && (
                                            <button
                                                onClick={startRecall}
                                                className="px-12 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-full shadow-lg transition-all"
                                            >
                                                Готов!
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recall Phase */}
                    {phase === 'recall' && (
                        <div className="flex flex-col h-full w-full max-w-5xl">
                            <p className="text-center text-gray-600 text-lg mb-4">
                                Соедините пары: перетащите {wordMode ? 'слова' : 'картинки'} к их парам
                            </p>

                            {/* Scrollable pairs area */}
                            <div className="flex-1 overflow-y-auto mb-4">
                                {/* 2-column grid for pairs */}
                                <div className="grid grid-cols-2 gap-4 p-2">
                                    {pairs.map((pair, idx) => (
                                        <div key={pair.id} className="flex items-center justify-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                                            {/* First item (fixed) */}
                                            <div className="w-20 h-20 bg-gray-50 rounded-xl border border-gray-200 p-2 flex items-center justify-center flex-shrink-0">
                                                {wordMode ? (
                                                    <span className="text-sm font-bold text-gray-800 text-center">
                                                        {pair.item1.name.charAt(0).toUpperCase() + pair.item1.name.slice(1)}
                                                    </span>
                                                ) : (
                                                    <img src={getImagePath(pair.item1.image)} alt={pair.item1.name} className="w-full h-full object-contain" />
                                                )}
                                            </div>

                                            <span className="text-lg text-gray-400">↔</span>

                                            {/* Drop zone for second item */}
                                            <div
                                                onDragOver={handleDragOver}
                                                onDrop={() => handleDrop(idx)}
                                                onClick={() => handleSlotClick(idx)}
                                                className={`w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${userAnswers[idx] ? 'bg-white border-blue-400 shadow-md' : 'bg-gray-50 border-gray-300 hover:border-blue-300'
                                                    }`}
                                            >
                                                {userAnswers[idx] ? (
                                                    wordMode ? (
                                                        <span className="text-sm font-bold text-gray-800 text-center px-1">
                                                            {userAnswers[idx]!.name.charAt(0).toUpperCase() + userAnswers[idx]!.name.slice(1)}
                                                        </span>
                                                    ) : (
                                                        <img src={getImagePath(userAnswers[idx]!.image)} alt="" className="w-full h-full object-contain p-1" />
                                                    )
                                                ) : (
                                                    <span className="text-gray-400 text-2xl">?</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Fixed Pool at bottom */}
                            <div className="sticky bottom-0 bg-white p-4 rounded-xl border border-gray-200 shadow-lg">
                                <p className="text-sm text-gray-500 mb-3 text-center">{wordMode ? 'Слова для выбора' : 'Картинки для выбора'}</p>
                                <div className="flex flex-wrap justify-center gap-3">
                                    {pool.map((item) => (
                                        <div
                                            key={item.id}
                                            draggable
                                            onDragStart={() => handleDragStart(item)}
                                            onClick={() => handlePoolItemClick(item)}
                                            className="w-16 h-16 bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-2 cursor-grab hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-center"
                                        >
                                            {wordMode ? (
                                                <span className="text-xs font-bold text-gray-800 text-center">{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</span>
                                            ) : (
                                                <img src={getImagePath(item.image)} alt={item.name} className="w-full h-full object-contain" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Check Button */}
                                {allSlotsFilled && (
                                    <div className="flex justify-center mt-4">
                                        <button
                                            onClick={checkResults}
                                            className="px-10 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg transition-all"
                                        >
                                            Проверить
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Results Phase */}
                    {phase === 'results' && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                {score === pairCount ? (
                                    <div className="bg-green-100 p-6 rounded-full">
                                        <CheckCircle className="w-20 h-20 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="bg-orange-100 p-6 rounded-full">
                                        <RotateCcw className="w-20 h-20 text-orange-600" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    {score === pairCount ? "Отлично!" : "Хорошая попытка!"}
                                </h2>
                                <p className="text-xl text-gray-600">
                                    {score} из {pairCount} пар правильно
                                </p>
                                <p className="text-gray-500">
                                    Точность: <span className="font-bold text-blue-600">{Math.round((score / pairCount) * 100)}%</span>
                                </p>
                            </div>

                            {/* Results display - responsive grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-2xl mx-auto">
                                {pairs.map((pair, idx) => {
                                    const userAnswer = userAnswers[idx];
                                    const isCorrect = userAnswer?.id === pair.item2.id;
                                    return (
                                        <div key={pair.id} className={`flex items-center justify-center gap-1 p-2 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                            <div className="w-8 h-8 bg-white rounded-lg p-0.5 flex-shrink-0">
                                                {wordMode ? (
                                                    <span className="text-xs font-bold">{pair.item1.name.charAt(0).toUpperCase()}</span>
                                                ) : (
                                                    <img src={getImagePath(pair.item1.image)} className="w-full h-full object-contain" />
                                                )}
                                            </div>
                                            <span className="text-gray-400 text-sm">↔</span>
                                            <div className="w-8 h-8 bg-white rounded-lg p-0.5 flex-shrink-0">
                                                {wordMode ? (
                                                    <span className="text-xs font-bold">{pair.item2.name.charAt(0).toUpperCase()}</span>
                                                ) : (
                                                    <img src={getImagePath(pair.item2.image)} className="w-full h-full object-contain" />
                                                )}
                                            </div>
                                            <span className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                                                {isCorrect ? '✓' : '✗'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all"
                                >
                                    Ещё раз
                                </button>
                                {isLocked && score === pairCount && (
                                    <Link href={getNextPath()}>
                                        <button
                                            onClick={() => {
                                                const accuracy = Math.round((score / pairCount) * 100);
                                                // For completion type, must get all pairs correct
                                                const passed = score === pairCount;
                                                lockedCompleteExercise({ score, accuracy, pairCount }, passed);
                                            }}
                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-all flex items-center gap-2"
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

                {/* Right Sidebar - History */}
                <div className="w-64 bg-white border-l border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-700">История попыток</span>
                    </div>

                    {attemptHistory.length === 0 ? (
                        <p className="text-gray-400 text-sm">Нет попыток</p>
                    ) : (
                        <div className="space-y-2">
                            {attemptHistory.map((attempt, i) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-500">Точность</span>
                                        <span className={`font-bold ${attempt.accuracy >= 80 ? 'text-green-600' : 'text-orange-500'}`}>
                                            {attempt.accuracy}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Результат</span>
                                        <span className="text-gray-700">{attempt.correct}/{attempt.total}</span>
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
                            <p><strong>Цель:</strong> Запомнить пары и правильно их соединить.</p>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Запоминайте показываемые пары</li>
                                <li>Нажимайте "Далее" для следующей пары</li>
                                <li>Когда готовы — нажмите "Готов!"</li>
                                <li>Перетащите элементы к их парам</li>
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
