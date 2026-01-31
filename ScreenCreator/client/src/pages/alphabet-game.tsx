import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Square, Plus, Minus, ArrowRight } from "lucide-react";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";

const LETTERS = "АБВГДЕЁЖЗИКЛМНОПРСТУФХЦЧШЩЫЭЮЯ";
const NUMBERS = "0123456789";

export default function AlphabetGame() {
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('alphabet-game');

    // Settings
    const [speed, setSpeed] = useState(2.0); // Seconds
    const [mode, setMode] = useState<"letters" | "numbers" | "fingers">("letters");
    const [isX2Mode, setIsX2Mode] = useState(false);
    const [isHardFingersMode, setIsHardFingersMode] = useState(false);
    const [fontSizeScale, setFontSizeScale] = useState(1.0);
    const [exerciseDuration, setExerciseDuration] = useState(120); // 2 minutes default
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showResults, setShowResults] = useState(false);

    // Game State
    const [isRunning, setIsRunning] = useState(false);
    const [topChar, setTopChar] = useState("");
    const [bottomChar, setBottomChar] = useState("");
    const [thirdChar, setThirdChar] = useState("");
    const [position, setPosition] = useState({ top: "50%", left: "50%" });

    const containerRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Apply locked parameters
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.duration !== undefined) setExerciseDuration(Number(lockedParameters.duration));
            if (lockedParameters.speed !== undefined) setSpeed(Number(lockedParameters.speed));
            if (lockedParameters.mode !== undefined) setMode(lockedParameters.mode as "letters" | "numbers" | "fingers");
            if (lockedParameters.fontSizeScale !== undefined) setFontSizeScale(Number(lockedParameters.fontSizeScale));
            if (lockedParameters.isX2Mode !== undefined) setIsX2Mode(Boolean(lockedParameters.isX2Mode));
        }
    }, [isLocked, lockedParameters]);

    const generateStep = useCallback(() => {
        let randomTop = "";
        let randomBottom = "";
        let randomThird = "";

        if (mode === "fingers") {
            // Fingers Mode
            // Top: 0-9
            randomTop = Math.floor(Math.random() * 10).toString();

            // Bottom: 1-5 or 1-10
            const maxBottom = isHardFingersMode ? 10 : 5;
            randomBottom = (Math.floor(Math.random() * maxBottom) + 1).toString();

            // Third char not used in fingers mode (or could be if we wanted x2, but plan said hide it)
            randomThird = "";
        } else {
            // Letters or Numbers Mode
            const pool = mode === "letters" ? LETTERS : NUMBERS;
            randomTop = pool[Math.floor(Math.random() * pool.length)];
            randomBottom = ["Л", "П", "О"][Math.floor(Math.random() * 3)];
            randomThird = isX2Mode ? ["Л", "П", "О"][Math.floor(Math.random() * 3)] : "";
        }

        setTopChar(randomTop);
        setBottomChar(randomBottom);
        setThirdChar(randomThird);

        // Random Position Logic
        if (containerRef.current) {
            const container = containerRef.current;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            // Assume item size approx 175px x 250px (taller for x2)
            // Scale item size based on font scale to avoid clipping
            const baseWidth = 175 * fontSizeScale;
            const baseHeight = (isX2Mode ? 250 : 175) * fontSizeScale;

            const maxLeft = containerWidth - baseWidth;
            const maxTop = containerHeight - baseHeight;

            const randomLeft = Math.floor(Math.random() * maxLeft);
            const randomTopPos = Math.floor(Math.random() * maxTop);

            setPosition({
                left: `${Math.max(0, randomLeft)}px`,
                top: `${Math.max(0, randomTopPos)}px`
            });
        }
    }, [mode, isX2Mode, isHardFingersMode, fontSizeScale]);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (isRunning) {
            if (!topChar) {
                generateStep();
            }
            timer = setInterval(() => {
                generateStep();
            }, speed * 1000);
        } else {
            setTopChar("");
            setBottomChar("");
            setThirdChar("");
            setPosition({ top: "50%", left: "50%" });
        }

        return () => clearInterval(timer);
    }, [isRunning, speed, generateStep, topChar]);

    const toggleGame = () => {
        if (!isRunning) {
            // Start
            setIsRunning(true);
            setElapsedTime(exerciseDuration);
            setShowResults(false);

            // Start countdown timer
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => {
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
            // Stop
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRunning(false);
        }
    };

    const adjustSpeed = (delta: number) => {
        setSpeed(prev => {
            const newVal = prev + delta;
            return Math.max(0.5, Math.min(10, Number(newVal.toFixed(1))));
        });
    };

    const adjustFontSize = (delta: number) => {
        setFontSizeScale(prev => {
            const newVal = prev + delta;
            return Math.max(0.4, Math.min(2.0, Number(newVal.toFixed(1))));
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-white p-6 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                {/* Left: Back + Title */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link href={backPath}>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">Алфавит</h1>

                    <button
                        onClick={toggleGame}
                        className={`ml-4 px-6 py-2 text-sm font-bold rounded-full transition-all shadow-md hover:shadow-lg focus:outline-none flex items-center justify-center gap-2 ${isRunning
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                    >
                        {isRunning ? (
                            <>
                                <Square size={18} fill="currentColor" />
                                Стоп
                            </>
                        ) : (
                            <>
                                <Play size={18} fill="currentColor" />
                                Начать тест
                            </>
                        )}
                    </button>
                </div>

                {/* Timer Display */}
                {isRunning && (
                    <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                        <span className="text-blue-600 font-bold">{Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</span>
                    </div>
                )}


                {/* Right: Settings (Inline) - Hidden when locked */}
                {!isLocked && (
                    <div className="flex items-center gap-6 bg-gray-50 px-6 py-3 rounded-xl border border-gray-200 w-full md:w-auto justify-between md:justify-end">
                        {/* Mode */}
                        <div className="flex bg-white p-1.5 rounded-lg border border-gray-100">
                            <button
                                onClick={() => setMode("letters")}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === "letters" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Буквы
                            </button>
                            <button
                                onClick={() => setMode("numbers")}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === "numbers" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Цифры
                            </button>
                            <button
                                onClick={() => setMode("fingers")}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === "fingers" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Пальцы
                            </button>
                        </div>

                        {/* +ноги Mode Toggle (Hidden in Fingers mode) */}
                        {mode !== "fingers" && (
                            <button
                                onClick={() => setIsX2Mode(!isX2Mode)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all border border-gray-200 ${isX2Mode ? "bg-purple-50 text-purple-600 border-purple-200 shadow-sm" : "bg-white text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                +ноги
                            </button>
                        )}

                        {/* Hard Fingers Mode Toggle (Only in Fingers mode) */}
                        {mode === "fingers" && (
                            <button
                                onClick={() => setIsHardFingersMode(!isHardFingersMode)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all border border-gray-200 ${isHardFingersMode ? "bg-red-50 text-red-600 border-red-200 shadow-sm" : "bg-white text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {isHardFingersMode ? "-5" : "+5"}
                            </button>
                        )}

                        {/* Font Size Control */}
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1.5">
                            <button
                                onClick={() => adjustFontSize(-0.2)}
                                disabled={fontSizeScale <= 0.4}
                                className="px-3 py-2 hover:bg-gray-100 rounded disabled:opacity-50 text-sm font-bold text-gray-600"
                                title="Уменьшить шрифт"
                            >
                                A-
                            </button>
                            <span className="text-sm font-medium text-gray-500 w-12 text-center">
                                {Math.round(fontSizeScale * 100)}%
                            </span>
                            <button
                                onClick={() => adjustFontSize(0.2)}
                                disabled={fontSizeScale >= 2.0}
                                className="px-3 py-2 hover:bg-gray-100 rounded disabled:opacity-50 text-sm font-bold text-gray-600"
                                title="Увеличить шрифт"
                            >
                                A+
                            </button>
                        </div>

                        {/* Speed */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 font-medium">Скорость (сек)</span>
                            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1.5">
                                <button
                                    onClick={() => adjustSpeed(-0.5)}
                                    disabled={speed <= 0.5}
                                    className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                                >
                                    <Minus size={18} className="text-gray-600" />
                                </button>
                                <span className="w-14 text-center font-bold text-gray-800 text-base">{speed.toFixed(1)}</span>
                                <button
                                    onClick={() => adjustSpeed(0.5)}
                                    disabled={speed >= 10}
                                    className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                                >
                                    <Plus size={18} className="text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative">

                {/* Game Area */}
                <div
                    ref={containerRef}
                    className="flex-1 bg-gray-50 rounded-3xl border-4 border-gray-200 shadow-inner relative overflow-hidden min-h-[400px]"
                >
                    {/* Background Logo */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
                        <img src="/logo.png" alt="Logo" className="w-1/3 object-contain" />
                    </div>
                    {isRunning ? (
                        <div
                            className="absolute flex flex-col items-center justify-center transition-all duration-300 ease-out"
                            style={{
                                top: position.top,
                                left: position.left,
                                width: `${175 * fontSizeScale}px`,
                                height: `${(isX2Mode ? 250 : 175) * fontSizeScale}px`,
                                transformOrigin: 'center center'
                            }}
                        >
                            <div
                                className="font-bold text-gray-800 leading-none select-none mb-2"
                                style={{ fontSize: `${60 * fontSizeScale}px` }}
                            >
                                {topChar}
                            </div>
                            <div
                                className="font-bold text-blue-600 leading-none select-none"
                                style={{ fontSize: `${72 * fontSizeScale}px` }}
                            >
                                {bottomChar}
                            </div>
                            {isX2Mode && mode !== "fingers" && (
                                <div
                                    className="font-bold text-purple-600 leading-none select-none mt-2"
                                    style={{ fontSize: `${72 * fontSizeScale}px` }}
                                >
                                    {thirdChar}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            {isLocked && requiredResult && !showResults ? (
                                <div className="text-center">
                                    <div className="text-6xl mb-4">🎯</div>
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl shadow-lg inline-block">
                                        <p className="text-sm opacity-90">Цель упражнения:</p>
                                        <p className="text-xl font-bold">{formatRequiredResult(requiredResult, lockedParameters || undefined)}</p>
                                        <p className="text-sm opacity-90 mt-2">Время: {Math.floor(exerciseDuration / 60)}:{(exerciseDuration % 60).toString().padStart(2, '0')}</p>
                                    </div>
                                    <div className="mt-4 text-gray-500">Нажмите "Начать тест"</div>
                                </div>
                            ) : (
                                <div className="text-gray-400 text-xl font-medium text-center">
                                    Нажмите Старт
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* Results Modal */}
            {showResults && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6 text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Упражнение завершено!</h2>
                            <p className="text-gray-600">Время вышло. Отличная работа!</p>
                        </div>
                        <div className="border-t border-gray-200 p-6 space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-bold transition-all"
                            >
                                Пройти ещё раз
                            </button>
                            {isLocked && (
                                <Link href={getNextPath()}>
                                    <button
                                        onClick={() => lockedCompleteExercise({ completed: true }, true)}
                                        className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        {hasNextExercise ? 'К следующему упражнению' : 'Завершить занятие'}
                                        <ArrowRight size={18} />
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
