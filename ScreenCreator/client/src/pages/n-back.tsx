import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import {
    ArrowLeft, Settings, Play, Square, RotateCcw,
    Circle, Triangle, Hexagon, Octagon, Star, Heart,
    Cloud, Moon, Sun, Diamond, History, Plus, Minus,
    HelpCircle, X, CheckCircle, XCircle, Timer
} from "lucide-react";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";
import { RequiredResultBanner } from "@/components/RequiredResultBanner";

interface GameStats {
    hits: number;
    misses: number;
    falseAlarms: number;
    totalMatches: number;
}

interface Attempt {
    id: number;
    n: number;
    mode: "letters" | "shapes";
    accuracy: number;
    timestamp: string;
}

const LETTERS = "АБВГДЕЁЖЗИКЛМНОПРСТУФХЦЧШЩЫЭЮЯ";

const SHAPES = [
    { icon: Circle, color: "text-red-500", id: "circle" },
    { icon: Square, color: "text-blue-500", id: "square" },
    { icon: Triangle, color: "text-green-500", id: "triangle" },
    { icon: Star, color: "text-yellow-500", id: "star" },
    { icon: Hexagon, color: "text-purple-500", id: "hexagon" },
    { icon: Octagon, color: "text-cyan-500", id: "octagon" },
    { icon: Heart, color: "text-pink-500", id: "heart" },
    { icon: Cloud, color: "text-sky-500", id: "cloud" },
    { icon: Moon, color: "text-indigo-500", id: "moon" },
    { icon: Sun, color: "text-orange-500", id: "sun" },
];

export default function NBack() {
    // Use the shared hook for locked parameters
    const {
        isLocked,
        requiredResult,
        lockedParameters,
        backPath,
        completeExercise,
        hasNextExercise,
        getNextPath
    } = useLockedParams('n-back');

    // Settings
    const [n, setN] = useState(2);
    const [intervalMs, setIntervalMs] = useState(2000);
    const [mode, setMode] = useState<"letters" | "shapes">("letters");
    const [duration, setDuration] = useState(120); // seconds, default 2 min
    const [requiredAccuracy, setRequiredAccuracy] = useState(70); // min accuracy %

    // Timer state
    const [timeLeft, setTimeLeft] = useState(120);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Game State
    const [isRunning, setIsRunning] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [sequence, setSequence] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [currentItem, setCurrentItem] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

    // Stats
    const [stats, setStats] = useState<GameStats>({
        hits: 0,
        misses: 0,
        falseAlarms: 0,
        totalMatches: 0
    });

    const [hasResponded, setHasResponded] = useState(false);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [lastResult, setLastResult] = useState<{ passed: boolean; accuracy: number } | null>(null);

    // Apply locked parameters from assignment
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.n !== undefined) setN(Number(lockedParameters.n));
            if (lockedParameters.mode !== undefined) setMode(lockedParameters.mode as "letters" | "shapes");
            if (lockedParameters.intervalMs !== undefined) setIntervalMs(Number(lockedParameters.intervalMs));
            if (lockedParameters.duration !== undefined) setDuration(Number(lockedParameters.duration));
            // Get required accuracy from requiredResult
            if (requiredResult?.minValue !== undefined) {
                setRequiredAccuracy(Number(requiredResult.minValue));
            }
        }
    }, [isLocked, lockedParameters, requiredResult]);

    const generateNextStimulus = useCallback(() => {
        const shouldBeMatch = Math.random() < 0.3; // 30% chance of match
        let nextVal = "";
        const pool = mode === "letters" ? LETTERS.split('') : SHAPES.map(s => s.id);

        if (shouldBeMatch && sequence.length >= n) {
            nextVal = sequence[sequence.length - n];
        } else {
            do {
                nextVal = pool[Math.floor(Math.random() * pool.length)];
            } while (sequence.length >= n && nextVal === sequence[sequence.length - n] && !shouldBeMatch);

            if (!shouldBeMatch && sequence.length >= n && nextVal === sequence[sequence.length - n]) {
                const available = pool.filter(c => c !== sequence[sequence.length - n]);
                nextVal = available[Math.floor(Math.random() * available.length)];
            }
        }
        return nextVal;
    }, [n, sequence, mode]);

    const finishGame = useCallback((manual: boolean = false) => {
        // Clear timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Calculate accuracy and save attempt
        const totalEvents = stats.hits + stats.misses + stats.falseAlarms;
        const accuracy = totalEvents > 0
            ? Math.round((stats.hits / totalEvents) * 100)
            : 0;

        const passed = accuracy >= requiredAccuracy;

        if (sequence.length > 0) {
            const newAttempt: Attempt = {
                id: Date.now(),
                n,
                mode,
                accuracy,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setAttempts(prev => [newAttempt, ...prev]);
        }

        setIsRunning(false);
        setCurrentItem(null);
        setFeedback(null);

        // Show result screen if timer finished (not manual stop)
        if (!manual && totalEvents > 0) {
            setLastResult({ passed, accuracy });
            setShowResult(true);
        }
    }, [stats, sequence, n, mode, requiredAccuracy]);

    const stopGame = () => {
        finishGame(true);
    };

    const startGame = () => {
        setSequence([]);
        setCurrentIndex(-1);
        setStats({ hits: 0, misses: 0, falseAlarms: 0, totalMatches: 0 });
        setTimeLeft(duration);
        setShowResult(false);
        setLastResult(null);
        setIsRunning(true);
        setHasResponded(false);
    };

    const closeResult = () => {
        setShowResult(false);
        setLastResult(null);
    };

    // Timer countdown
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            };
        }
    }, [isRunning]);

    // Auto-finish when time runs out
    useEffect(() => {
        if (isRunning && timeLeft === 0) {
            finishGame(false);
        }
    }, [isRunning, timeLeft, finishGame]);

    // Format time for display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleMatchClick = useCallback(() => {
        if (!isRunning || hasResponded || currentIndex < n) return;

        setHasResponded(true);
        const isMatch = sequence[currentIndex] === sequence[currentIndex - n];

        if (isMatch) {
            setStats(prev => ({ ...prev, hits: prev.hits + 1 }));
            setFeedback("correct");
        } else {
            setStats(prev => ({ ...prev, falseAlarms: prev.falseAlarms + 1 }));
            setFeedback("wrong");
        }

        setTimeout(() => setFeedback(null), 500);
    }, [isRunning, hasResponded, currentIndex, n, sequence]);

    // Game Loop
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (isRunning) {
            const step = () => {
                // Check if previous step was a miss
                if (currentIndex >= n && !hasResponded) {
                    const wasMatch = sequence[currentIndex] === sequence[currentIndex - n];
                    if (wasMatch) {
                        setStats(prev => ({ ...prev, misses: prev.misses + 1, totalMatches: prev.totalMatches + 1 }));
                    }
                } else if (currentIndex >= n && hasResponded) {
                    const wasMatch = sequence[currentIndex] === sequence[currentIndex - n];
                    if (wasMatch) {
                        setStats(prev => ({ ...prev, totalMatches: prev.totalMatches + 1 }));
                    }
                }

                const nextVal = generateNextStimulus();
                setSequence(prev => [...prev, nextVal]);
                setCurrentItem(nextVal);
                setCurrentIndex(prev => prev + 1);
                setHasResponded(false);
                setFeedback(null);
            };

            if (currentIndex === -1) {
                step();
            }

            timer = setInterval(step, intervalMs);
        }

        return () => clearInterval(timer);
    }, [isRunning, intervalMs, generateNextStimulus, currentIndex, hasResponded, n, sequence]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                handleMatchClick();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleMatchClick]);

    return (
        <div className="min-h-screen flex flex-col bg-white p-6 relative">
            <div className="absolute top-6 left-6">
                <Link href={backPath}>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                </Link>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800">N-back</h1>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 justify-center flex-1 items-start max-w-6xl mx-auto w-full">

                {/* LEFT COLUMN: Settings & Stats */}
                <div className="w-full lg:w-80 flex flex-col gap-6">

                    <button
                        onClick={isRunning ? stopGame : startGame}
                        className={`w-full flex items-center justify-center gap-2 px-6 py-2 text-sm text-white rounded-full font-bold transition-all shadow-md hover:shadow-lg ${isRunning
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                    >
                        {isRunning ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        {isRunning ? "Стоп" : "Начать тест"}
                    </button>

                    {/* Settings - Hidden when locked */}
                    {!isLocked && (
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold">
                                <Settings size={20} />
                                Настройки
                            </div>

                            <div className="space-y-4">
                                {/* Mode Switcher */}
                                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200">
                                    <div className="flex bg-gray-100 p-1 rounded-lg flex-1">
                                        <button
                                            onClick={() => setMode("letters")}
                                            disabled={isRunning}
                                            className={`flex-1 py-1 rounded-md text-sm font-bold transition-all ${mode === "letters" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Буквы
                                        </button>
                                        <button
                                            onClick={() => setMode("shapes")}
                                            disabled={isRunning}
                                            className={`flex-1 py-1 rounded-md text-sm font-bold transition-all ${mode === "shapes" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Фигуры
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Уровень N</label>
                                    <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1.5">
                                        <button
                                            onClick={() => setN(Math.max(1, n - 1))}
                                            disabled={isRunning || n <= 1}
                                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors text-gray-600"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="flex-1 text-center font-bold text-gray-800 text-base">{n}</span>
                                        <button
                                            onClick={() => setN(Math.min(5, n + 1))}
                                            disabled={isRunning || n >= 5}
                                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors text-gray-600"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Скорость (сек)</label>
                                    <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1.5">
                                        <button
                                            onClick={() => setIntervalMs(Math.max(500, intervalMs - 500))}
                                            disabled={isRunning || intervalMs <= 500}
                                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors text-gray-600"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="flex-1 text-center font-bold text-gray-800 text-base">{(intervalMs / 1000).toFixed(1)}</span>
                                        <button
                                            onClick={() => setIntervalMs(Math.min(5000, intervalMs + 500))}
                                            disabled={isRunning || intervalMs >= 5000}
                                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors text-gray-600"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold">
                            <RotateCcw size={20} />
                            Текущая сессия
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Верно:</span>
                                <span className="font-bold text-green-600">{stats.hits}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Ошибки:</span>
                                <span className="font-bold text-red-600">{stats.falseAlarms}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Пропуски:</span>
                                <span className="font-bold text-orange-600">{stats.misses}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-200 mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Точность:</span>
                                    <span className="font-bold text-lg text-blue-600">
                                        {stats.hits + stats.falseAlarms + stats.misses > 0
                                            ? Math.round((stats.hits / (stats.hits + stats.falseAlarms + stats.misses)) * 100)
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER COLUMN: Game Area */}
                <div className="flex flex-col items-center gap-8 w-full max-w-md">
                    {/* Game Area */}
                    <div className="relative flex items-center justify-center w-80 h-80 bg-gray-50 rounded-3xl border-4 border-gray-200 shadow-inner overflow-hidden">
                        {/* Background Logo or Goal Banner */}
                        {!isRunning && isLocked && requiredResult ? (
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg">
                                <p className="text-xs opacity-90">Цель упражнения:</p>
                                <p className="text-lg font-bold">{formatRequiredResult(requiredResult, lockedParameters || undefined)}</p>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
                                <img src="/logo.png" alt="Logo" className="w-1/2 object-contain" />
                            </div>
                        )}
                        {isRunning && currentItem && (
                            mode === "letters" ? (
                                <span className={`text-9xl font-bold transition-all duration-200 ${feedback === "correct" ? "text-green-500 scale-110" :
                                    feedback === "wrong" ? "text-red-500 scale-90" : "text-gray-800"
                                    }`}>
                                    {currentItem}
                                </span>
                            ) : (
                                (() => {
                                    const shape = SHAPES.find(s => s.id === currentItem);
                                    if (!shape) return null;
                                    const Icon = shape.icon;
                                    return (
                                        <Icon
                                            size={160}
                                            fill="currentColor"
                                            className={`transition-all duration-200 ${shape.color} ${feedback === "correct" ? "scale-110 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" :
                                                feedback === "wrong" ? "scale-90 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" : ""
                                                }`}
                                        />
                                    );
                                })()
                            )
                        )}


                        {feedback && (
                            <div className={`absolute inset-0 rounded-2xl opacity-20 ${feedback === "correct" ? "bg-green-500" : "bg-red-500"
                                }`} />
                        )}
                    </div>

                    {/* Timer Display */}
                    {isRunning && (
                        <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-xl px-4 py-2">
                            <Timer size={20} className={timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-gray-600"} />
                            <span className={`text-2xl font-bold ${timeLeft <= 10 ? "text-red-500" : "text-gray-800"}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex flex-col gap-4 w-full">


                        <button
                            onClick={isRunning ? handleMatchClick : startGame}
                            disabled={isRunning && (currentIndex < n || hasResponded)}
                            className={`w-full py-6 rounded-xl text-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${!isRunning
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                                : "bg-green-500 text-white hover:bg-green-600 active:scale-95"
                                }`}
                        >
                            {isRunning ? (
                                <>СОВПАДЕНИЕ</>
                            ) : (
                                <><Play size={24} fill="currentColor" /> Начать тест</>
                            )}
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: History */}
                <div className="w-full lg:w-64 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                        <History size={20} />
                        История попыток
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {attempts.map((attempt) => (
                            <div
                                key={attempt.id}
                                className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-1"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">{attempt.timestamp}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${attempt.mode === "letters" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                                        }`}>
                                        {attempt.mode === "letters" ? "Буквы" : "Фигуры"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500">Уровень</span>
                                        <span className="font-bold text-gray-800">N-{attempt.n}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-gray-500">Точность</span>
                                        <span className={`font-bold text-lg ${attempt.accuracy >= 80 ? "text-green-600" :
                                            attempt.accuracy >= 50 ? "text-orange-500" : "text-red-500"
                                            }`}>
                                            {attempt.accuracy}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {attempts.length === 0 && (
                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p>Нет попыток</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Result Modal */}
            {showResult && lastResult && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
                        <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${lastResult.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                            {lastResult.passed ? (
                                <CheckCircle size={48} className="text-green-600" />
                            ) : (
                                <XCircle size={48} className="text-red-600" />
                            )}
                        </div>

                        <h2 className={`text-3xl font-bold mb-2 ${lastResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {lastResult.passed ? 'Отлично!' : 'Попробуй ещё!'}
                        </h2>

                        <p className="text-gray-600 mb-6">
                            {lastResult.passed
                                ? 'Задание выполнено успешно!'
                                : `Нужна точность минимум ${requiredAccuracy}%`
                            }
                        </p>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <div className="text-sm text-gray-500 mb-1">Твоя точность</div>
                            <div className={`text-5xl font-bold ${lastResult.passed ? 'text-green-600' : 'text-red-500'}`}>
                                {lastResult.accuracy}%
                            </div>
                            <div className="text-sm text-gray-400 mt-1">Требуется: {requiredAccuracy}%</div>
                        </div>

                        <div className="flex gap-3">
                            {isLocked && lastResult.passed ? (
                                <>
                                    <button
                                        onClick={() => { closeResult(); startGame(); }}
                                        className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw size={18} />
                                        Ещё раз
                                    </button>
                                    <Link href={getNextPath()}>
                                        <button
                                            onClick={() => completeExercise({ accuracy: lastResult.accuracy }, true)}
                                            className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            {hasNextExercise ? 'Далее →' : 'Готово ✓'}
                                        </button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={closeResult}
                                        className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-all"
                                    >
                                        Закрыть
                                    </button>
                                    <button
                                        onClick={() => { closeResult(); startGame(); }}
                                        className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw size={18} />
                                        Ещё раз
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
