import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Square, Settings, RefreshCw, CheckCircle2 } from "lucide-react";

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
    // --- State ---
    const [mode, setMode] = useState<Mode>('letters');
    const [signCount, setSignCount] = useState(200); // Default sign count

    // Game State
    const [isRunning, setIsRunning] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [attempts, setAttempts] = useState<Attempt[]>([]);

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
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

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
        let newGrid: string[] = [];
        let newTarget = '';

        if (selectedMode === 'letters') {
            newGrid = Array.from({ length: size }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]);
            newTarget = LETTERS[Math.floor(Math.random() * LETTERS.length)];
            // Ensure at least some targets exist, otherwise regen (simple heuristic)
            while (!newGrid.includes(newTarget)) {
                newTarget = LETTERS[Math.floor(Math.random() * LETTERS.length)];
            }
        } else if (selectedMode === 'numbers') {
            newGrid = Array.from({ length: size }, () => NUMBERS[Math.floor(Math.random() * NUMBERS.length)]);
            newTarget = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
            while (!newGrid.includes(newTarget)) {
                newTarget = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
            }
        } else if (selectedMode === 'rings') {
            newGrid = Array.from({ length: size }, () => RING_ORIENTATIONS[Math.floor(Math.random() * RING_ORIENTATIONS.length)]);
            newTarget = RING_ORIENTATIONS[Math.floor(Math.random() * RING_ORIENTATIONS.length)];
        }

        setGrid(newGrid);
        setTarget(newTarget);
        setMode(selectedMode);
    };

    const handleStart = () => {
        generateGame();
        setSelectedIndices(new Set());
        setErrorIndices(new Set());
        setTimeElapsed(0);
        setIsRunning(true);
    };

    const handleStop = () => {
        setIsRunning(false);
        // Save result
        if (grid.length > 0) {
            setAttempts(prev => [...prev, {
                attemptNumber: prev.length + 1,
                time: formatTime(timeElapsed),
                score: foundCount,
                mode: mode
            }]);
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
                setTimeout(() => handleStop(), 500);
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
                    <Link href="/testing">
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

                    <div className="text-4xl font-bold text-gray-800 font-mono text-center">
                        {formatTime(timeElapsed)}
                    </div>

                    <div className="flex flex-col gap-3">
                        {!isRunning ? (
                            <button
                                onClick={handleStart}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                            >
                                <Play size={20} fill="currentColor" />
                                Начать тест
                            </button>
                        ) : (
                            <button
                                onClick={handleStop}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                            >
                                <Square size={20} fill="currentColor" />
                                Завершить
                            </button>
                        )}
                    </div>

                    {/* Settings Section */}
                    <div className="flex flex-col gap-4 pt-4 border-t border-gray-200">
                        {/* Mode Switcher */}
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Режим</span>
                            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                                {(['letters', 'numbers', 'rings'] as Mode[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => handleModeChange(m)}
                                        disabled={isRunning}
                                        className={`
                                            flex-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all
                                            ${mode === m
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }
                                            ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        {m === 'letters' ? 'Буквы' : m === 'numbers' ? 'Цифры' : 'Кольца'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sign Count Control */}
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Количество знаков</span>
                            <div className="flex items-center justify-between bg-gray-100 rounded-lg p-2">
                                <button
                                    onClick={() => !isRunning && setSignCount(prev => Math.max(10, prev - 10))}
                                    disabled={isRunning || signCount <= 10}
                                    className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
                                >
                                    -
                                </button>
                                <span className="font-mono font-bold text-gray-800 text-lg w-12 text-center">{signCount}</span>
                                <button
                                    onClick={() => !isRunning && setSignCount(prev => Math.min(500, prev + 10))}
                                    disabled={isRunning || signCount >= 500}
                                    className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Grid Area */}
                <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center bg-gray-100 relative">
                    {/* Background Logo */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
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
                    ) : (
                        <div className="text-center text-gray-400 flex flex-col items-center">
                            <RefreshCw size={48} className="mb-4 opacity-20" />
                            <p className="text-xl font-medium">Выберите режим и нажмите "Начать"</p>
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
