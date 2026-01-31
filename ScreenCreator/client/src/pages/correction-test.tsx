import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Square, Settings, RefreshCw, CheckCircle2, Minus, Plus } from "lucide-react";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";
import { RequiredResultBanner } from "@/components/RequiredResultBanner";

// --- Types & Constants & Helpers ---

type Mode = 'letters' | 'numbers' | 'rings';

interface Attempt {
    attemptNumber: number;
    time: string;
    score: number;
    mode: Mode;
}

const GRID_SIZE = 16;
// Characters for modes
const LETTERS = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
const NUMBERS = "0123456789";
const RING_ORIENTATIONS = ['top', 'right', 'bottom', 'left'] as const;

type RingOrientation = typeof RING_ORIENTATIONS[number];

// Helper to format time
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
};

// --- Landolt Ring Component (Minimal Style) ---
const LandoltRing = ({ orientation, size = 32, className = "" }: { orientation: RingOrientation, size?: number, className?: string }) => {
    const rotation = {
        'top': -90,
        'right': 0,
        'bottom': 90,
        'left': 180
    }[orientation];

    // Calculate gap size proportional to ring size
    // For size 40 (preview): gap ~28x20
    // For size 20 (grid): gap ~14x10
    const gapWidth = size * 0.7;  // 70% of ring size
    const gapHeight = size * 0.5; // 50% of ring size
    const gapOffset = -(gapWidth / 2);

    return (
        <div
            className={`relative rounded-full border-4 border-gray-600 ${className}`}
            style={{
                width: size,
                height: size,
                transform: `rotate(${rotation}deg)`
            }}
        >
            {/* The gap */}
            <div
                className="absolute top-1/2 bg-white -translate-y-1/2"
                style={{
                    right: gapOffset,
                    width: gapWidth,
                    height: gapHeight
                }}
            />
        </div>
    );
};


export default function CorrectionTest() {
    const {
        isLocked,
        requiredResult,
        lockedParameters,
        backPath,
        assignmentId,
        studentId,
        exerciseIndex,
        hasNextExercise,
        completeExercise,
        getNextPath
    } = useLockedParams('correction-test');

    // --- State ---
    const [mode, setMode] = useState<Mode>('letters');
    const [signCount, setSignCount] = useState(200); // Default sign count
    const [timeLimit, setTimeLimit] = useState<number | null>(null); // Time limit in seconds, null = no limit

    // Game State
    const [isRunning, setIsRunning] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isPassed, setIsPassed] = useState(false);
    const [savedResult, setSavedResult] = useState<{ found: number; total: number } | null>(null);
    const [timeoutOccurred, setTimeoutOccurred] = useState(false);

    // The Grid & Logic
    const [grid, setGrid] = useState<string[]>([]); // Flat array for simplicity, mapped to 2D visually
    const [target, setTarget] = useState<string>(''); // The char or orientation to find
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());

    // Stats
    // "targetsFound" is derived from selectedIndices keys that match target

    // --- Timer ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setTimeElapsed(prev => {
                    if (timeLimit !== null && prev >= timeLimit - 1) {
                        handleStop(true); // timeout occurred
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLimit]);

    // Apply locked parameters
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.signCount !== undefined) setSignCount(Number(lockedParameters.signCount));
            if (lockedParameters.mode !== undefined) {
                const newMode = lockedParameters.mode as Mode;
                setMode(newMode);
                // Update target for new mode
                let newTarget = '';
                if (newMode === 'letters') {
                    newTarget = LETTERS[Math.floor(Math.random() * LETTERS.length)];
                } else if (newMode === 'numbers') {
                    newTarget = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
                } else if (newMode === 'rings') {
                    newTarget = RING_ORIENTATIONS[Math.floor(Math.random() * RING_ORIENTATIONS.length)];
                }
                setTarget(newTarget);
            }
            if (lockedParameters.timeLimit !== undefined) setTimeLimit(Number(lockedParameters.timeLimit));
        }
    }, [isLocked, lockedParameters]);

    // Generate initial target on mount
    useEffect(() => {
        if (!isRunning && !target) {
            let newTarget = '';
            if (mode === 'letters') {
                newTarget = LETTERS[Math.floor(Math.random() * LETTERS.length)];
            } else if (mode === 'numbers') {
                newTarget = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
            } else if (mode === 'rings') {
                newTarget = RING_ORIENTATIONS[Math.floor(Math.random() * RING_ORIENTATIONS.length)];
            }
            setTarget(newTarget);
        }
    }, []); // Only run on mount

    // --- Logic ---

    // Derived stats
    const totalTargets = useMemo(() => {
        if (!grid.length) return 0;
        return grid.filter(item => item === target).length;
    }, [grid, target]);

    const foundCount = useMemo(() => {
        let count = 0;
        selectedIndices.forEach(idx => {
            if (grid[idx] === target) count++;
        });
        return count;
    }, [grid, target, selectedIndices]);

    // Handle mode change - update both mode and target together to prevent flicker
    const handleModeChange = (newMode: Mode) => {
        if (isRunning) return;

        // Generate new target for the new mode
        let newTarget = '';
        if (newMode === 'letters') {
            newTarget = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        } else if (newMode === 'numbers') {
            newTarget = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
        } else if (newMode === 'rings') {
            newTarget = RING_ORIENTATIONS[Math.floor(Math.random() * RING_ORIENTATIONS.length)];
        }

        // Update both at once
        setMode(newMode);
        setTarget(newTarget);
    };

    const generateGame = (selectedMode: Mode = mode) => {
        const size = signCount;
        let source: string | readonly string[] = [];

        // Use existing target if available, otherwise generate new one
        let useTarget = target;

        // 1. Select Source and Target
        if (selectedMode === 'letters') {
            source = LETTERS;
            if (!useTarget || !LETTERS.includes(useTarget)) {
                useTarget = LETTERS[Math.floor(Math.random() * LETTERS.length)];
            }
        } else if (selectedMode === 'numbers') {
            source = NUMBERS;
            if (!useTarget || !NUMBERS.includes(useTarget)) {
                useTarget = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
            }
        } else if (selectedMode === 'rings') {
            source = RING_ORIENTATIONS;
            if (!useTarget || !RING_ORIENTATIONS.includes(useTarget as RingOrientation)) {
                useTarget = RING_ORIENTATIONS[Math.floor(Math.random() * RING_ORIENTATIONS.length)];
            }
        }

        // 2. Calculate Counts (13% Targets)
        const targetCount = Math.max(1, Math.round(size * 0.13)); // At least 1 target
        const distractorCount = size - targetCount;

        // 3. Create Grid
        let newGrid: string[] = [];

        // Add Targets
        for (let i = 0; i < targetCount; i++) {
            newGrid.push(useTarget);
        }

        // Add Distractors
        // Filter out the target from potential distractors
        const potentialDistractors = (typeof source === 'string' ? source.split('') : source).filter(item => item !== useTarget);

        for (let i = 0; i < distractorCount; i++) {
            const randomDistractor = potentialDistractors[Math.floor(Math.random() * potentialDistractors.length)];
            newGrid.push(randomDistractor);
        }

        // 4. Shuffle Grid (Fisher-Yates)
        for (let i = newGrid.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newGrid[i], newGrid[j]] = [newGrid[j], newGrid[i]];
        }

        setGrid(newGrid);
        setTarget(useTarget);
        setMode(selectedMode);
    };

    const handleStart = () => {
        generateGame();
        setSelectedIndices(new Set());
        setErrorIndices(new Set());
        setTimeElapsed(0);
        setIsRunning(true);
    };

    const handleStop = (isTimeout = false, overrideFound?: number) => {
        setIsRunning(false);
        setTimeoutOccurred(isTimeout);

        // Use override if provided (fixes stale closure issue when auto-completing)
        const actualFound = overrideFound ?? foundCount;

        // Save result
        if (grid.length > 0) {
            setAttempts(prev => [...prev, {
                attemptNumber: prev.length + 1,
                time: formatTime(timeElapsed),
                score: actualFound,
                mode: mode
            }]);
        }

        // For locked exercises - save result and mark as completed
        if (isLocked) {
            const passed = actualFound >= totalTargets && totalTargets > 0;
            setSavedResult({ found: actualFound, total: totalTargets });
            setIsPassed(passed);
            setIsCompleted(true);
            // Submit result to API
            if (assignmentId && studentId !== null) {
                fetch(`/api/assignments/${assignmentId}/results`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        exerciseIndex,
                        studentId,
                        result: {
                            timeElapsed,
                            foundCount: actualFound,
                            totalTargets,
                            mode
                        },
                        passed: actualFound >= totalTargets && totalTargets > 0
                    })
                }).catch(e => console.error('Failed to submit result:', e));
            }
        }

        setGrid([]);
    };

    const handleCellClick = (index: number) => {
        if (!isRunning) return;
        if (selectedIndices.has(index)) return; // Already selected

        const content = grid[index];
        const isCorrect = content === target;

        if (isCorrect) {
            const newSelected = new Set(selectedIndices);
            newSelected.add(index);
            setSelectedIndices(newSelected);

            // Auto-finish if all found? Optional. 
            // Often correction tests are timed or "until exhaustion". 
            // Let's check win condition for satisfaction.
            // We need to calc foundCount + 1 since state update is async
            let currentFound = 0;
            newSelected.forEach(idx => { if (grid[idx] === target) currentFound++; });

            if (currentFound === totalTargets) {
                // All found!
                // Maybe flash success or just stop? Let's just play sound or notify?
                // For now, simple interaction. User stops manually or we can auto-stop.
                // Let's Auto-Stop for better UX if they truly found everything.
                setTimeout(() => handleStop(false, currentFound), 500);
            }

        } else {
            const newErrors = new Set(errorIndices);
            newErrors.add(index);
            setErrorIndices(newErrors);
            // Optional: Penalty?
        }
    };

    // --- Render Helpers ---
    const renderTargetPreview = () => {
        if (!target) return "?";
        if (mode === 'letters' || mode === 'numbers') {
            return <span className="text-4xl font-bold text-blue-600">{target}</span>;
        }
        return <LandoltRing orientation={target as RingOrientation} size={40} />;
    };

    const renderCellContent = (content: string, index: number) => {
        if (mode === 'rings') {
            return (
                <LandoltRing
                    orientation={content as RingOrientation}
                    size={20}
                    className={`
                         transition-colors
                         ${selectedIndices.has(index) ? 'opacity-70' : ''}
                    `}
                />
            );
        }
        return content;
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href={backPath}>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-600">
                            <ArrowLeft size={24} />
                        </button>
                    </Link>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">Корректурная проба (Тест Бурдона)</h1>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-full md:w-64 bg-gray-50 p-6 flex flex-col gap-6 border-r border-gray-200 z-0">
                    <div className={`text-4xl font-bold font-mono text-center ${timeLimit !== null && timeLimit - timeElapsed <= 10 ? 'text-red-500' : 'text-blue-600'}`}>
                        {timeLimit !== null ? formatTime(Math.max(0, timeLimit - timeElapsed)) : formatTime(timeElapsed)}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={isRunning ? () => handleStop() : handleStart}
                            className={`flex items-center justify-center gap-2 px-6 py-2 text-sm text-white rounded-full font-bold transition-all shadow-md hover:shadow-lg ${isRunning
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-blue-600 hover:bg-blue-700"
                                }`}
                        >
                            {isRunning ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                            {isRunning ? "Стоп" : "Начать тест"}
                        </button>
                    </div>

                    {/* Instructions / Target */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex flex-col items-center text-center">
                        <span className="text-sm text-gray-500 mb-2 uppercase tracking-wider font-semibold">Найти</span>
                        <div className="h-16 flex items-center justify-center">
                            {target ? renderTargetPreview() : <span className="text-gray-300 text-4xl">?</span>}
                        </div>
                        {isRunning && (
                            <div className="mt-2 text-xs text-blue-400 font-mono">
                                Найдено: {foundCount} / {totalTargets}
                            </div>
                        )}
                    </div>



                    {/* Settings Section - Hidden when locked */}
                    {!isLocked && (
                        <div className="flex flex-col gap-4 pt-4 border-t border-gray-200">
                            {/* Mode Switcher */}
                            <div>
                                <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                                    {(['letters', 'numbers', 'rings'] as Mode[]).map(m => (
                                        <button
                                            key={m}
                                            onClick={() => handleModeChange(m)}
                                            disabled={isRunning}
                                            className={`
                                                flex-1 px-2 py-1.5 rounded-md text-sm font-bold transition-all flex items-center justify-center
                                                ${mode === m
                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                }
                                                ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                        >
                                            {m === 'letters' ? <span className="text-lg font-bold">А</span> : m === 'numbers' ? <span className="text-lg font-bold">8</span> : <LandoltRing orientation="right" size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sign Count Control */}
                            <div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Количество знаков</span>
                                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-1.5">
                                    <button
                                        onClick={() => !isRunning && setSignCount(prev => Math.max(10, prev - 10))}
                                        disabled={isRunning || signCount <= 10}
                                        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors text-gray-600"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="flex-1 text-center font-bold text-gray-800 text-base">{signCount}</span>
                                    <button
                                        onClick={() => !isRunning && setSignCount(prev => Math.min(500, prev + 10))}
                                        disabled={isRunning || signCount >= 500}
                                        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors text-gray-600"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Grid Area */}
                <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center bg-gray-100 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
                        <img src="/logo.png" alt="Logo" className="w-1/2 object-contain" />
                    </div>

                    {isRunning && grid.length > 0 ? (
                        <div
                            className="bg-white p-4 rounded-xl shadow-xl border border-gray-200 select-none grid gap-1 w-fit mx-auto"
                            style={{
                                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(30px, 1fr))`
                            }}
                        >
                            {grid.map((item, index) => {
                                const isSelected = selectedIndices.has(index);
                                const isError = errorIndices.has(index);

                                return (
                                    <div
                                        key={index}
                                        onMouseDown={() => handleCellClick(index)}
                                        className={`
                                            w-8 h-8 md:w-10 md:h-10 flex items-center justify-center cursor-pointer rounded transition-all duration-100
                                            ${mode !== 'rings' ? 'text-lg md:text-xl font-bold' : ''}
                                            ${isSelected
                                                ? 'bg-blue-500 text-white scale-95'
                                                : isError
                                                    ? 'bg-red-500 text-white scale-90'
                                                    : 'hover:bg-blue-50 text-gray-800'
                                            }
                                        `}
                                    >
                                        {renderCellContent(item, index)}
                                    </div>
                                );
                            })}
                        </div>
                    ) : isCompleted && isLocked ? (
                        /* Completion banner */
                        <div className="text-center">
                            <div className="text-6xl mb-4">{isPassed ? '🎉' : (timeoutOccurred ? '⏱️' : '🔍')}</div>
                            <div className={`${isPassed ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'} text-white px-8 py-6 rounded-xl shadow-lg inline-block`}>
                                <p className="text-2xl font-bold mb-2">
                                    {isPassed
                                        ? (hasNextExercise ? 'Упражнение завершено!' : 'Занятие завершено!')
                                        : (timeoutOccurred ? 'Время вышло!' : 'Не все найдено!')}
                                </p>
                                <p className="text-lg opacity-90">
                                    {isPassed
                                        ? (hasNextExercise ? 'Отличная работа! Переходите к следующему упражнению.' : 'Поздравляем! Вы выполнили все упражнения.')
                                        : `Найдено ${savedResult?.found ?? 0} из ${savedResult?.total ?? 0}. Попробуйте ещё раз!`}
                                </p>
                            </div>
                            <div className="mt-6">
                                {isPassed ? (
                                    <Link href={getNextPath()}>
                                        <button
                                            onClick={() => completeExercise({
                                                timeElapsed,
                                                foundCount: savedResult?.found ?? 0,
                                                totalTargets: savedResult?.total ?? 0
                                            }, true)}
                                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-all"
                                        >
                                            {hasNextExercise ? 'К следующему упражнению →' : 'Готово ✓'}
                                        </button>
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsCompleted(false);
                                            setIsPassed(false);
                                        }}
                                        className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-lg transition-all"
                                    >
                                        Попробовать ещё раз
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 flex flex-col items-center">
                            {isLocked && requiredResult ? (
                                <>
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl shadow-lg inline-block">
                                        <p className="text-sm opacity-90">Цель упражнения:</p>
                                        <p className="text-xl font-bold">{formatRequiredResult(requiredResult, lockedParameters || undefined)}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={48} className="mb-4 opacity-20" />
                                    <p className="text-xl font-medium">Выберите режим и нажмите "Начать"</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Sidebar - History */}
                <div className="w-full md:w-64 bg-white border-l border-gray-200 p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Результаты</h3>
                    <div className="space-y-2 overflow-y-auto flex-1">
                        {attempts.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-4">Нет попыток</p>
                        )}
                        {attempts.slice().reverse().map((attempt) => (
                            <div
                                key={attempt.attemptNumber}
                                className="bg-gray-50 p-3 rounded-lg text-sm flex flex-col gap-1 border border-gray-100"
                            >
                                <div className="flex justify-between items-center text-gray-500 text-xs uppercase font-bold">
                                    <span>#{attempt.attemptNumber} {attempt.mode === 'letters' ? 'Буквы' : attempt.mode === 'numbers' ? 'Цифры' : 'Кольца'}</span>
                                    <span>{attempt.time}</span>
                                </div>
                                <div className="font-bold text-blue-600 text-lg flex items-center gap-2">
                                    <CheckCircle2 size={16} />
                                    {attempt.score}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
