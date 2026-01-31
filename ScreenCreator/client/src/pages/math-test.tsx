import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Square, HelpCircle, X, Settings, RotateCcw, ArrowRight } from "lucide-react";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";
import { RequiredResultBanner } from "@/components/RequiredResultBanner";

type Phase = 'idle' | 'playing' | 'result';

interface MathProblem {
    num1: number;
    num2: number;
    operator: '+' | '-' | '×' | '÷';
    answer: number;
    userAnswer: string;
    isCorrect: boolean | null;
    timeExpired: boolean;
}

// Generate random number within range
const randomNum = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate a math problem based on selected operators and digit range
const generateProblem = (operators: string[], digitRange: 1 | 2 | 3 | 4 | 5): MathProblem => {
    const operator = operators[Math.floor(Math.random() * operators.length)] as '+' | '-' | '×' | '÷';
    let num1: number, num2: number, answer: number;

    // Get number ranges based on digit setting
    const getRange = (digits: 1 | 2 | 3 | 4 | 5): [number, number] => {
        switch (digits) {
            case 1: return [1, 9];
            case 2: return [10, 99];
            case 3: return [100, 999];
            case 4: return [1000, 9999];
            case 5: return [10000, 99999];
        }
    };
    const [minNum, maxNum] = getRange(digitRange);

    switch (operator) {
        case '+':
            num1 = randomNum(minNum, maxNum);
            num2 = randomNum(minNum, maxNum);
            answer = num1 + num2;
            break;
        case '-':
            num1 = randomNum(minNum, maxNum);
            num2 = randomNum(minNum, Math.min(num1, maxNum));
            answer = num1 - num2;
            break;
        case '×':
            num1 = randomNum(Math.max(2, minNum), Math.min(12, maxNum));
            num2 = randomNum(2, 12);
            answer = num1 * num2;
            break;
        case '÷':
            num2 = randomNum(2, Math.min(12, maxNum));
            answer = randomNum(2, Math.min(12, maxNum));
            num1 = num2 * answer;
            break;
        default:
            num1 = randomNum(minNum, maxNum);
            num2 = randomNum(minNum, maxNum);
            answer = num1 + num2;
    }

    return {
        num1,
        num2,
        operator,
        answer,
        userAnswer: '',
        isCorrect: null,
        timeExpired: false
    };
};

export default function MathTest() {
    const {
        isLocked,
        requiredResult,
        lockedParameters,
        backPath,
        completeExercise: completeLockedExercise,
        hasNextExercise,
        getNextPath
    } = useLockedParams('math-test');

    const [phase, setPhase] = useState<Phase>('idle');

    // Settings
    const [operationsCount, setOperationsCount] = useState<number | null>(null); // null = infinity
    const [selectedOperators, setSelectedOperators] = useState<string[]>(['+']);
    const [digitRange, setDigitRange] = useState<1 | 2 | 3 | 4 | 5>(1); // 1=single, 2=double, etc.
    const [answerTimeLimit, setAnswerTimeLimit] = useState<number | null>(null); // null = infinity
    const [demoTime, setDemoTime] = useState<number | null>(null); // null = show forever

    // Game state
    const [problems, setProblems] = useState<MathProblem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [showProblem, setShowProblem] = useState(true);

    const [showHelp, setShowHelp] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const demoTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Apply locked parameters from assignment
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.rounds !== undefined) setOperationsCount(Number(lockedParameters.rounds));
            if (lockedParameters.difficulty !== undefined) {
                const diff = lockedParameters.difficulty;
                if (diff === 'easy') setDigitRange(1);
                else if (diff === 'medium') setDigitRange(2);
                else if (diff === 'hard') setDigitRange(3);
            }
        }
    }, [isLocked, lockedParameters]);

    // Timer effect
    useEffect(() => {
        if (phase === 'playing' && answerTimeLimit !== null && timeLeft !== null && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => (prev !== null ? prev - 1 : null));
            }, 1000);
        } else if (phase === 'playing' && answerTimeLimit !== null && timeLeft === 0) {
            handleTimeExpired();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [phase, timeLeft, answerTimeLimit]);

    // Demo timer effect
    useEffect(() => {
        if (phase === 'playing' && demoTime !== null && showProblem) {
            demoTimerRef.current = setTimeout(() => {
                setShowProblem(false);
            }, demoTime * 1000);
        }
        return () => {
            if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
        };
    }, [phase, showProblem, currentIndex, demoTime]);

    const handleTimeExpired = () => {
        setProblems(prev => prev.map((p, i) =>
            i === currentIndex ? { ...p, timeExpired: true, isCorrect: false } : p
        ));
        moveToNext();
    };

    const generateProblems = (count: number) => {
        const ops = selectedOperators.length > 0 ? selectedOperators : ['+'];
        return Array(count).fill(null).map(() => generateProblem(ops, digitRange));
    };

    const startGame = () => {
        const count = operationsCount ?? 20; // Default to 20 if infinity
        const newProblems = generateProblems(count);
        setProblems(newProblems);
        setCurrentIndex(0);
        setUserInput('');
        setTimeLeft(answerTimeLimit);
        setShowProblem(true);
        setPhase('playing');
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const stopGame = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
        setPhase('idle');
        setProblems([]);
        setCurrentIndex(0);
        setUserInput('');
        setTimeLeft(null);
    };

    const checkAnswer = () => {
        const current = problems[currentIndex];
        const userNum = parseInt(userInput);
        const isCorrect = !isNaN(userNum) && userNum === current.answer;

        setProblems(prev => prev.map((p, i) =>
            i === currentIndex ? { ...p, userAnswer: userInput, isCorrect } : p
        ));

        moveToNext();
    };

    const moveToNext = () => {
        const totalCount = operationsCount ?? problems.length;
        if (currentIndex + 1 >= totalCount) {
            setPhase('result');
        } else {
            setCurrentIndex(prev => prev + 1);
            setUserInput('');
            setTimeLeft(answerTimeLimit);
            setShowProblem(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && userInput.trim()) {
            checkAnswer();
        }
    };

    const toggleOperator = (op: string) => {
        setSelectedOperators(prev => {
            if (prev.includes(op)) {
                if (prev.length === 1) return prev; // Keep at least one
                return prev.filter(o => o !== op);
            }
            return [...prev, op];
        });
    };

    const formatTime = (seconds: number) => {
        return seconds < 10 ? `0${seconds}` : `${seconds}`;
    };

    const correctCount = problems.filter(p => p.isCorrect).length;
    const answeredCount = problems.filter(p => p.isCorrect !== null).length;
    const totalCount = operationsCount ?? problems.length;

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
                        <h1 className="text-xl font-bold text-gray-800">Математика</h1>
                    </div>
                    <button
                        onClick={() => setShowHelp(true)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                    >
                        <HelpCircle size={24} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="flex gap-4">
                    <button className="px-4 py-3 text-blue-600 border-b-2 border-blue-600 font-medium">
                        Простые примеры
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Left Sidebar - Settings */}
                {!isLocked && (
                    <div className="w-72 bg-white border-r border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto">
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
                                {currentIndex + 1} из {totalCount}
                            </div>
                        )}

                        {/* Settings */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings size={16} className="text-gray-500" />
                                <span className="font-medium text-gray-700">Настройки</span>
                            </div>

                            {/* Operations Count */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2 text-center">Действий</label>
                                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                    <button
                                        onClick={() => setOperationsCount(prev => prev === null ? 20 : Math.max(5, prev - 5))}
                                        disabled={phase !== 'idle'}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >−</button>
                                    <span className="font-bold text-xl text-gray-800 min-w-[3rem] text-center">
                                        {operationsCount === null ? <span className="text-2xl">∞</span> : operationsCount}
                                    </span>
                                    <button
                                        onClick={() => setOperationsCount(prev => {
                                            if (prev === null) return 20;
                                            if (prev >= 100) return null;
                                            return prev + 5;
                                        })}
                                        disabled={phase !== 'idle'}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >+</button>
                                </div>
                            </div>

                            {/* Operation Types */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2 text-center">Операции</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['+', '-', '×', '÷'].map(op => (
                                        <button
                                            key={op}
                                            onClick={() => toggleOperator(op)}
                                            disabled={phase !== 'idle'}
                                            className={`py-3 rounded-xl text-2xl font-bold transition-all ${selectedOperators.includes(op)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white border border-gray-200 text-gray-600'
                                                } disabled:opacity-50`}
                                        >
                                            {op}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Digit Range */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2 text-center">Разряд</label>
                                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                    <button
                                        onClick={() => setDigitRange(prev => Math.max(1, prev - 1) as 1 | 2 | 3 | 4 | 5)}
                                        disabled={phase !== 'idle' || digitRange === 1}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >−</button>
                                    <span className="font-bold text-xl text-gray-800 min-w-[4rem] text-center">
                                        {digitRange === 1 ? '1' : digitRange === 2 ? '22' : digitRange === 3 ? '333' : digitRange === 4 ? '4444' : '55555'}
                                    </span>
                                    <button
                                        onClick={() => setDigitRange(prev => Math.min(5, prev + 1) as 1 | 2 | 3 | 4 | 5)}
                                        disabled={phase !== 'idle' || digitRange === 5}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >+</button>
                                </div>
                            </div>

                            {/* Answer Time Limit */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2 text-center">Таймер скорости</label>
                                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                    <button
                                        onClick={() => setAnswerTimeLimit(prev => prev === null ? 10 : Math.max(5, prev - 5))}
                                        disabled={phase !== 'idle'}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >−</button>
                                    <span className="font-bold text-xl text-gray-800 min-w-[3rem] text-center">
                                        {answerTimeLimit === null ? <span className="text-2xl">∞</span> : `${answerTimeLimit}с`}
                                    </span>
                                    <button
                                        onClick={() => setAnswerTimeLimit(prev => {
                                            if (prev === null) return 10;
                                            if (prev >= 60) return null;
                                            return prev + 5;
                                        })}
                                        disabled={phase !== 'idle'}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >+</button>
                                </div>
                            </div>

                            {/* Demo Time */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2 text-center">Демонстрация</label>
                                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                                    <button
                                        onClick={() => setDemoTime(prev => prev === null ? 2 : Math.max(0.2, +(prev - 0.2).toFixed(1)))}
                                        disabled={phase !== 'idle'}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >−</button>
                                    <span className="font-bold text-xl text-gray-800 min-w-[3rem] text-center">
                                        {demoTime === null ? <span className="text-2xl">∞</span> : `${demoTime}с`}
                                    </span>
                                    <button
                                        onClick={() => setDemoTime(prev => {
                                            if (prev === null) return 2;
                                            if (prev >= 10) return null;
                                            return +(prev + 0.2).toFixed(1);
                                        })}
                                        disabled={phase !== 'idle'}
                                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Center - Game Area */}
                <div className="flex-1 flex items-center justify-center bg-white p-8">
                    {/* Idle State */}
                    {phase === 'idle' && (
                        <div className="text-center">
                            {isLocked && requiredResult ? (
                                <>
                                    <div className="text-6xl mb-4">🎯</div>
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl shadow-lg inline-block">
                                        <p className="text-sm opacity-90">Цель упражнения:</p>
                                        <p className="text-xl font-bold">{formatRequiredResult(requiredResult, lockedParameters || undefined)}</p>
                                    </div>
                                    <div className="mt-4 text-gray-500">Нажмите "Начать"</div>
                                </>
                            ) : (
                                <>
                                    <div className="text-6xl mb-4">🧮</div>
                                    <div className="text-xl text-gray-500">
                                        Нажмите "Начать"
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Playing State */}
                    {phase === 'playing' && problems[currentIndex] && (
                        <div className="flex flex-col items-center gap-8 w-full max-w-md">
                            {/* Timer */}
                            {answerTimeLimit !== null && timeLeft !== null && (
                                <div className={`text-3xl font-mono font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-blue-600'}`}>
                                    00:{formatTime(timeLeft)}
                                </div>
                            )}

                            {/* Problem */}
                            {showProblem ? (
                                <div className="text-5xl font-bold text-gray-800">
                                    {problems[currentIndex].num1} {problems[currentIndex].operator} {problems[currentIndex].num2} = ?
                                </div>
                            ) : (
                                <div className="text-5xl font-bold text-gray-300">
                                    ? = ?
                                </div>
                            )}

                            {/* Input */}
                            <input
                                ref={inputRef}
                                type="text"
                                inputMode="numeric"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value.replace(/[^0-9-]/g, ''))}
                                onKeyDown={handleKeyDown}
                                placeholder="Ответ..."
                                className="w-48 text-center text-3xl py-4 px-6 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                                autoComplete="off"
                            />

                            {/* Submit Button */}
                            <button
                                onClick={checkAnswer}
                                disabled={!userInput.trim()}
                                className="px-10 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-full transition-all"
                            >
                                Далее
                            </button>
                        </div>
                    )}

                    {/* Result State */}
                    {phase === 'result' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="text-5xl mb-2">
                                {correctCount === totalCount ? '🎉' : correctCount >= totalCount / 2 ? '👍' : '💪'}
                            </div>
                            <div className="text-3xl font-bold text-gray-800">
                                {correctCount} из {answeredCount}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={startGame}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all flex items-center gap-2"
                                >
                                    <RotateCcw size={18} />
                                    Ещё раз
                                </button>
                                {isLocked && (
                                    <Link href={getNextPath()}>
                                        <button
                                            onClick={() => {
                                                const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
                                                const passed = accuracy >= (requiredResult?.minValue || 0);
                                                completeLockedExercise({ correctCount, answeredCount, accuracy }, passed);
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

                {/* Right Sidebar - Stats */}
                {(phase === 'playing' || phase === 'result') && (
                    <div className="w-64 bg-white border-l border-gray-200 p-4">
                        <div className="font-medium text-gray-700 mb-4">Статистика</div>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-xl text-center">
                                <div className="text-gray-500 text-sm mb-1">Всего примеров</div>
                                <div className="text-3xl font-bold text-gray-800">{totalCount}</div>
                            </div>

                            <div className="p-4 bg-green-50 rounded-xl text-center">
                                <div className="text-green-600 text-sm mb-1">Правильно</div>
                                <div className="text-3xl font-bold text-green-600">{correctCount}</div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-xl text-center">
                                <div className="text-blue-600 text-sm mb-1">Процент</div>
                                <div className="text-3xl font-bold text-blue-600">
                                    {answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl text-center">
                                <div className="text-gray-500 text-sm mb-1">Прогресс</div>
                                <div className="text-xl font-bold text-gray-800">
                                    {phase === 'result' ? answeredCount : currentIndex + 1} / {totalCount}
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
                            <p><strong>Цель:</strong> Решать математические примеры.</p>
                            <p><strong>Настройки:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Действий — количество примеров</li>
                                <li>Операции — типы математических действий</li>
                                <li>Таймер — время на ответ</li>
                                <li>Демонстрация — время показа примера</li>
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
