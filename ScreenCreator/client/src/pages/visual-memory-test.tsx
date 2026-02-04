import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, HelpCircle, X, CheckCircle, RotateCcw, Clock, Square, ArrowRight } from "lucide-react";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";
import { RequiredResultBanner } from "@/components/RequiredResultBanner";
import { testQuestions, getImagePath, Question } from "@/lib/vocabulary";

type Phase = 'idle' | 'exposure' | 'recall' | 'results';

interface AttemptRecord {
    correct: number;
    total: number;
    accuracy: number;
    timestamp: Date;
}

export default function VisualMemoryTest() {
    const {
        isLocked,
        requiredResult,
        lockedParameters,
        backPath,
        completeExercise: completeLockedExercise,
        hasNextExercise,
        getNextPath
    } = useLockedParams('visual-memory-test');

    // Game State
    const [phase, setPhase] = useState<Phase>('idle');
    const [sequence, setSequence] = useState<Question[]>([]);
    const [userSequence, setUserSequence] = useState<(Question | null)[]>([]);
    const [pool, setPool] = useState<Question[]>([]);

    // Settings
    const [itemCount, setItemCount] = useState(5);
    const [exposureTime, setExposureTime] = useState(10);
    const [wordMode, setWordMode] = useState(false);
    const [sequentialMode, setSequentialMode] = useState(false);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);

    // Timer
    const [timeLeft, setTimeLeft] = useState(10);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Results
    const [score, setScore] = useState(0);
    const [attemptHistory, setAttemptHistory] = useState<AttemptRecord[]>([]);

    // Modals
    const [showHelp, setShowHelp] = useState(false);
    const [exerciseCompleted, setExerciseCompleted] = useState(false);

    // Dragging
    const [draggedItem, setDraggedItem] = useState<Question | null>(null);

    // Apply locked parameters from assignment
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.itemCount !== undefined) setItemCount(Number(lockedParameters.itemCount));
            if (lockedParameters.exposureTime !== undefined) setExposureTime(Number(lockedParameters.exposureTime));
            if (lockedParameters.wordMode !== undefined) setWordMode(Boolean(lockedParameters.wordMode));
        }
    }, [isLocked, lockedParameters]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startGame = () => {
        const shuffled = [...testQuestions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, itemCount);
        setSequence(selected);
        setUserSequence(new Array(itemCount).fill(null));
        setPool([]);
        setCurrentItemIndex(0);

        if (!sequentialMode) {
            setTimeLeft(exposureTime);
        }
        setPhase('exposure');
    };

    const stopGame = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('idle');
        setSequence([]);
        setUserSequence([]);
        setPool([]);
        setCurrentItemIndex(0);
    };

    const startRecall = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        const poolItems = [...sequence].sort(() => Math.random() - 0.5);
        setPool(poolItems);
        setCurrentItemIndex(0);
        setPhase('recall');
    };

    const handleNextItem = () => {
        if (currentItemIndex < sequence.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1);
        } else {
            startRecall();
        }
    };

    const checkResults = () => {
        let correct = 0;
        userSequence.forEach((item, index) => {
            if (item?.id === sequence[index]?.id) {
                correct++;
            }
        });
        setScore(correct);

        // Save to history
        const accuracy = Math.round((correct / itemCount) * 100);
        setAttemptHistory(prev => [{
            correct,
            total: itemCount,
            accuracy,
            timestamp: new Date()
        }, ...prev].slice(0, 10));

        setPhase('results');
    };

    const resetGame = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('idle');
        setSequence([]);
        setUserSequence([]);
        setPool([]);
        setScore(0);
        setCurrentItemIndex(0);
    };

    // Timer effect
    useEffect(() => {
        if (phase === 'exposure' && !sequentialMode) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        startRecall();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase, sequentialMode]);

    // Drag and drop handlers
    const handleDragStart = (item: Question) => {
        setDraggedItem(item);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (slotIndex: number) => {
        if (!draggedItem) return;

        const existingSlotIndex = userSequence.findIndex(item => item?.id === draggedItem.id);
        if (existingSlotIndex !== -1) {
            const newSequence = [...userSequence];
            newSequence[existingSlotIndex] = null;
            setUserSequence(newSequence);
        }

        const newSequence = [...userSequence];
        const displacedItem = newSequence[slotIndex];
        newSequence[slotIndex] = draggedItem;
        setUserSequence(newSequence);

        if (existingSlotIndex === -1) {
            setPool(pool.filter(item => item.id !== draggedItem.id));
        }
        if (displacedItem) {
            setPool(prev => [...prev, displacedItem]);
        }
        setDraggedItem(null);
    };

    const handleSlotClick = (slotIndex: number) => {
        const item = userSequence[slotIndex];
        if (item) {
            const newSequence = [...userSequence];
            newSequence[slotIndex] = null;
            setUserSequence(newSequence);
            setPool(prev => [...prev, item]);
        }
    };

    const handlePoolItemClick = (item: Question) => {
        const emptySlotIndex = userSequence.findIndex(slot => slot === null);
        if (emptySlotIndex !== -1) {
            const newSequence = [...userSequence];
            newSequence[emptySlotIndex] = item;
            setUserSequence(newSequence);
            setPool(pool.filter(p => p.id !== item.id));
        }
    };

    const allSlotsFilled = userSequence.every(slot => slot !== null);

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
                        <h1 className="text-xl font-bold text-gray-800">Цепочки</h1>
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
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                    >
                        {phase === 'idle' ? <Play size={18} /> : <Square size={18} />}
                        {phase === 'idle' ? 'Начать тест' : 'Остановить'}
                    </button>

                    {/* Timer */}
                    <div className="text-4xl font-mono font-bold text-blue-600 text-center py-2">
                        {sequentialMode ? '∞' : formatTime(phase === 'idle' ? exposureTime : timeLeft)}
                    </div>

                    {/* Settings - Hidden when locked */}
                    {!isLocked && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock size={16} className="text-gray-500" />
                                <span className="font-medium text-gray-700">Настройки</span>
                            </div>

                            {/* Item Count */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2">{wordMode ? 'Слов' : 'Картинок'}</label>
                                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => setItemCount(Math.max(3, itemCount - 1))}
                                        disabled={phase !== 'idle' || itemCount <= 3}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >−</button>
                                    <span className="font-bold text-gray-800">{itemCount}</span>
                                    <button
                                        onClick={() => setItemCount(Math.min(12, itemCount + 1))}
                                        disabled={phase !== 'idle' || itemCount >= 12}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>

                            {/* Exposure Time */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2">Время (сек)</label>
                                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => setExposureTime(Math.max(5, exposureTime - 5))}
                                        disabled={phase !== 'idle' || exposureTime <= 5}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >−</button>
                                    <span className="font-bold text-gray-800">{exposureTime}</span>
                                    <button
                                        onClick={() => setExposureTime(Math.min(120, exposureTime + 5))}
                                        disabled={phase !== 'idle' || exposureTime >= 120}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>

                            {/* Word Mode Toggle */}
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm text-gray-500">Слова</label>
                                <button
                                    onClick={() => setWordMode(!wordMode)}
                                    disabled={phase !== 'idle'}
                                    className={`w-10 h-5 rounded-full transition-all ${wordMode ? 'bg-indigo-600' : 'bg-gray-300'} disabled:opacity-50`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${wordMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>

                            {/* Sequential Mode Toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-500">По очереди</label>
                                <button
                                    onClick={() => setSequentialMode(!sequentialMode)}
                                    disabled={phase !== 'idle'}
                                    className={`w-10 h-5 rounded-full transition-all ${sequentialMode ? 'bg-indigo-600' : 'bg-gray-300'} disabled:opacity-50`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${sequentialMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
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
                            {isLocked && requiredResult ? (
                                <>
                                    <div className="text-6xl mb-4">🎯</div>
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl shadow-lg inline-block">
                                        <p className="text-sm opacity-90">Цель упражнения:</p>
                                        <p className="text-xl font-bold">{formatRequiredResult(requiredResult, lockedParameters || undefined)}</p>
                                    </div>
                                    <div className="mt-4 text-gray-500">Нажмите "Начать тест"</div>
                                </>
                            ) : (
                                <>
                                    <div className="w-64 h-64 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-white">
                                        <span className="text-6xl">🔗</span>
                                    </div>
                                    <button
                                        onClick={startGame}
                                        className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all"
                                    >
                                        НАЧАТЬ ТЕСТ
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Exposure Phase */}
                    {phase === 'exposure' && (
                        <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
                            <p className="text-gray-600 text-lg">
                                Запомните {sequentialMode ? `${currentItemIndex + 1} из ${itemCount}` : `последовательность ${wordMode ? 'слов' : 'картинок'}`}
                            </p>

                            {sequentialMode ? (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-40 h-40 bg-white rounded-2xl shadow-md border border-gray-200 p-4 flex items-center justify-center">
                                        {wordMode ? (
                                            <span className="text-2xl font-bold text-gray-800 text-center">
                                                {sequence[currentItemIndex]?.name.charAt(0).toUpperCase() + sequence[currentItemIndex]?.name.slice(1)}
                                            </span>
                                        ) : (
                                            <img
                                                src={getImagePath(sequence[currentItemIndex]?.image)}
                                                alt={sequence[currentItemIndex]?.name}
                                                className="w-full h-full object-contain"
                                            />
                                        )}
                                    </div>
                                    <button
                                        onClick={handleNextItem}
                                        className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-full shadow-lg transition-all"
                                    >
                                        Далее
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap justify-center gap-4">
                                    {sequence.map((item, idx) => (
                                        <div key={idx} className="w-24 h-24 bg-white rounded-2xl shadow-md border border-gray-200 p-2 flex items-center justify-center">
                                            {wordMode ? (
                                                <span className="text-sm font-bold text-gray-800 text-center">{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</span>
                                            ) : (
                                                <img src={getImagePath(item.image)} alt={item.name} className="w-full h-full object-contain" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recall Phase */}
                    {phase === 'recall' && (
                        <div className="flex flex-col gap-8 w-full max-w-3xl">
                            <p className="text-center text-gray-600 text-lg">Перетащите {wordMode ? 'слова' : 'картинки'} в правильном порядке</p>

                            {/* Drop Zones */}
                            <div className="bg-gray-100 p-4 rounded-2xl border-2 border-dashed border-gray-300">
                                <div className="flex flex-wrap justify-center gap-3">
                                    {userSequence.map((item, idx) => (
                                        <div
                                            key={idx}
                                            onDragOver={handleDragOver}
                                            onDrop={() => handleDrop(idx)}
                                            onClick={() => handleSlotClick(idx)}
                                            className={`w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${item ? 'bg-white border-blue-400 shadow-md' : 'bg-gray-50 border-gray-300 hover:border-blue-300'
                                                }`}
                                        >
                                            {item ? (
                                                wordMode ? (
                                                    <span className="text-xs font-bold text-gray-800 text-center px-1">{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</span>
                                                ) : (
                                                    <img src={getImagePath(item.image)} alt={item.name} className="w-full h-full object-contain p-1" />
                                                )
                                            ) : (
                                                <span className="text-gray-400 text-sm">{idx + 1}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pool */}
                            {pool.length > 0 && (
                                <div className="bg-white p-4 rounded-xl border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-3 text-center">{wordMode ? 'Слова для выбора' : 'Картинки для выбора'}</p>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {pool.map((item) => (
                                            <div
                                                key={item.id}
                                                draggable
                                                onDragStart={() => handleDragStart(item)}
                                                onClick={() => handlePoolItemClick(item)}
                                                className="w-20 h-20 bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-2 cursor-grab hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-center"
                                            >
                                                {wordMode ? (
                                                    <span className="text-xs font-bold text-gray-800 text-center">{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</span>
                                                ) : (
                                                    <img src={getImagePath(item.image)} alt={item.name} className="w-full h-full object-contain" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Check Button */}
                            {allSlotsFilled && (
                                <div className="flex justify-center">
                                    <button
                                        onClick={checkResults}
                                        className="px-10 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg transition-all"
                                    >
                                        Проверить
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results Phase */}
                    {phase === 'results' && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                {score === itemCount ? (
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
                                    {score === itemCount ? "Отлично!" : "Хорошая попытка!"}
                                </h2>
                                <p className="text-xl text-gray-600">
                                    {score} из {itemCount} {wordMode ? 'слов' : 'картинок'} на месте
                                </p>
                                <p className="text-gray-500">
                                    Точность: <span className="font-bold text-blue-600">{Math.round((score / itemCount) * 100)}%</span>
                                </p>
                            </div>

                            {/* Results grid */}
                            <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
                                {sequence.map((item, idx) => {
                                    const userItem = userSequence[idx];
                                    const isCorrect = userItem?.id === item.id;
                                    return (
                                        <div key={idx} className={`w-12 h-12 rounded-lg p-1 border-2 flex items-center justify-center ${isCorrect ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                                            {wordMode ? (
                                                <span className="text-xs font-bold text-gray-700">{item.name.charAt(0).toUpperCase()}</span>
                                            ) : (
                                                <img src={getImagePath(item.image)} className="w-full h-full object-contain opacity-80" />
                                            )}
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
                                {isLocked && (
                                    <Link href={getNextPath()}>
                                        <button
                                            onClick={() => {
                                                const accuracy = Math.round((score / itemCount) * 100);
                                                const passed = accuracy >= (requiredResult?.minValue || 0);
                                                completeLockedExercise({ score, accuracy, itemCount }, passed);
                                            }}
                                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg transition-all flex items-center gap-2"
                                        >
                                            {hasNextExercise ? 'Далее' : 'Готово'}
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
                            <p><strong>Цель:</strong> Запомнить последовательность и восстановить её в правильном порядке.</p>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Запомните порядок показанных элементов</li>
                                <li>Перетащите элементы в слоты в правильном порядке</li>
                                <li>Нажмите "Проверить" для проверки</li>
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
