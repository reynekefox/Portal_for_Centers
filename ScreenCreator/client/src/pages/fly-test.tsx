import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, HelpCircle, X, CheckCircle, RotateCcw, Clock, Square, Settings, ArrowRight } from "lucide-react";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";

type Phase = 'idle' | 'playing' | 'answering' | 'result' | 'final';
type Direction = 'up' | 'down' | 'left' | 'right';

interface AttemptRecord {
    correct: boolean;
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
    userPos: { x: number; y: number };
    moves: Direction[];
}

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
const DIRECTION_NAMES: Record<Direction, string> = {
    up: 'Вверх',
    down: 'Вниз',
    left: 'Влево',
    right: 'Вправо'
};

export default function FlyTest() {
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('fly-test');

    // Game State
    const [phase, setPhase] = useState<Phase>('idle');
    const [gridSize, setGridSize] = useState(5);
    const [attempts, setAttempts] = useState(5);
    const [hiddenMode, setHiddenMode] = useState(false);
    const [speechEnabled, setSpeechEnabled] = useState(true);
    const [stepCount, setStepCount] = useState(5);
    const [stepSpeed, setStepSpeed] = useState(3);

    // Current game state
    const [flyPosition, setFlyPosition] = useState({ x: 0, y: 0 });
    const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
    const [currentMoves, setCurrentMoves] = useState<Direction[]>([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [currentAttempt, setCurrentAttempt] = useState(0);
    const [userAnswer, setUserAnswer] = useState<{ x: number; y: number } | null>(null);

    // Results
    const [attemptHistory, setAttemptHistory] = useState<AttemptRecord[]>([]);
    const [showCurrentDirection, setShowCurrentDirection] = useState<Direction | null>(null);

    // Modals
    const [showHelp, setShowHelp] = useState(false);

    // Timer ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
    const isStoppedRef = useRef(false);
    const speechEnabledRef = useRef(true);

    // Keep ref in sync with state
    useEffect(() => {
        speechEnabledRef.current = speechEnabled;
        // Cancel any ongoing speech when disabled
        if (!speechEnabled && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, [speechEnabled]);

    const speak = (text: string) => {
        if (!speechEnabledRef.current) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ru-RU';
            utterance.rate = 0.9;
            speechRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Apply locked parameters from assignment
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.attempts !== undefined) setAttempts(Number(lockedParameters.attempts));
            if (lockedParameters.gridSize !== undefined) setGridSize(Number(lockedParameters.gridSize));
            if (lockedParameters.stepCount !== undefined) setStepCount(Number(lockedParameters.stepCount));
            if (lockedParameters.stepSpeed !== undefined) setStepSpeed(Number(lockedParameters.stepSpeed));
            if (lockedParameters.hiddenMode !== undefined) setHiddenMode(Boolean(lockedParameters.hiddenMode));
        }
    }, [isLocked, lockedParameters]);

    const generateMoves = (): Direction[] => {
        const moves: Direction[] = [];
        let pos = { ...flyPosition };

        for (let i = 0; i < stepCount; i++) {
            const validDirections: Direction[] = [];
            if (pos.y > 0) validDirections.push('up');
            if (pos.y < gridSize - 1) validDirections.push('down');
            if (pos.x > 0) validDirections.push('left');
            if (pos.x < gridSize - 1) validDirections.push('right');

            const dir = validDirections[Math.floor(Math.random() * validDirections.length)];
            moves.push(dir);

            // Update position for next move calculation
            if (dir === 'up') pos.y--;
            else if (dir === 'down') pos.y++;
            else if (dir === 'left') pos.x--;
            else if (dir === 'right') pos.x++;
        }

        return moves;
    };

    const calculateFinalPosition = (startPos: { x: number; y: number }, moves: Direction[]): { x: number; y: number } => {
        let pos = { ...startPos };
        for (const dir of moves) {
            if (dir === 'up') pos.y--;
            else if (dir === 'down') pos.y++;
            else if (dir === 'left') pos.x--;
            else if (dir === 'right') pos.x++;
        }
        return pos;
    };

    const startGame = () => {
        // Reset stopped flag
        isStoppedRef.current = false;

        // Random start position
        const startX = Math.floor(Math.random() * gridSize);
        const startY = Math.floor(Math.random() * gridSize);
        setFlyPosition({ x: startX, y: startY });

        const moves = generateMovesFromPosition({ x: startX, y: startY });
        setCurrentMoves(moves);

        const finalPos = calculateFinalPosition({ x: startX, y: startY }, moves);
        setTargetPosition(finalPos);

        setCurrentMoveIndex(0);
        setUserAnswer(null);
        setPhase('playing');

        // Start playing moves after a short delay
        setTimeout(() => {
            playNextMove(0, moves);
        }, 1500);
    };

    const generateMovesFromPosition = (startPos: { x: number; y: number }): Direction[] => {
        const moves: Direction[] = [];
        let pos = { ...startPos };

        for (let i = 0; i < stepCount; i++) {
            const validDirections: Direction[] = [];
            if (pos.y > 0) validDirections.push('up');
            if (pos.y < gridSize - 1) validDirections.push('down');
            if (pos.x > 0) validDirections.push('left');
            if (pos.x < gridSize - 1) validDirections.push('right');

            const dir = validDirections[Math.floor(Math.random() * validDirections.length)];
            moves.push(dir);

            if (dir === 'up') pos.y--;
            else if (dir === 'down') pos.y++;
            else if (dir === 'left') pos.x--;
            else if (dir === 'right') pos.x++;
        }

        return moves;
    };

    const playNextMove = (index: number, moves: Direction[]) => {
        // Check if game was stopped using ref (not state - state is stale in closure)
        if (isStoppedRef.current) {
            return;
        }

        if (index >= moves.length) {
            setShowCurrentDirection(null);
            setPhase('answering');
            return;
        }

        const direction = moves[index];
        setShowCurrentDirection(direction);
        setCurrentMoveIndex(index);
        speak(DIRECTION_NAMES[direction]);

        timerRef.current = setTimeout(() => {
            playNextMove(index + 1, moves);
        }, stepSpeed * 1000);
    };

    const stopGame = () => {
        isStoppedRef.current = true;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        window.speechSynthesis.cancel();
        setPhase('idle');
        setAttemptHistory([]);
        setCurrentAttempt(0);
        setShowCurrentDirection(null);
    };

    const handleCellClick = (x: number, y: number) => {
        if (phase !== 'answering') return;

        setUserAnswer({ x, y });
        const isCorrect = x === targetPosition.x && y === targetPosition.y;

        const record: AttemptRecord = {
            correct: isCorrect,
            startPos: flyPosition,
            endPos: targetPosition,
            userPos: { x, y },
            moves: currentMoves
        };

        setAttemptHistory(prev => [...prev, record]);
        setPhase('result');
    };

    const nextAttempt = () => {
        if (currentAttempt + 1 >= attempts) {
            setPhase('final');
        } else {
            setCurrentAttempt(prev => prev + 1);
            startGame();
        }
    };

    const resetGame = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        window.speechSynthesis.cancel();
        setPhase('idle');
        setAttemptHistory([]);
        setCurrentAttempt(0);
        setShowCurrentDirection(null);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            window.speechSynthesis.cancel();
        };
    }, []);

    const correctCount = attemptHistory.filter(a => a.correct).length;
    const accuracy = attemptHistory.length > 0 ? Math.round((correctCount / attemptHistory.length) * 100) : 0;

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
                        <h1 className="text-xl font-bold text-gray-800">Муха</h1>
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

                    {/* Settings - Hidden when locked */}
                    {!isLocked && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings size={16} className="text-gray-500" />
                                <span className="font-medium text-gray-700">Настройки</span>
                            </div>

                            {/* Game settings - visible but disabled during game */}
                            <div className={phase !== 'idle' ? 'opacity-50 pointer-events-none' : ''}>
                                {/* Grid Size */}
                                <div className="mb-4">
                                    <label className="text-sm text-gray-500 block mb-2">Поле</label>
                                    <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                        <button
                                            onClick={() => setGridSize(Math.max(3, gridSize - 1))}
                                            disabled={gridSize <= 3 || phase !== 'idle'}
                                            className="p-2 text-gray-500 disabled:opacity-50"
                                        >−</button>
                                        <span className="font-bold text-gray-800">{gridSize}×{gridSize}</span>
                                        <button
                                            onClick={() => setGridSize(Math.min(10, gridSize + 1))}
                                            disabled={gridSize >= 10 || phase !== 'idle'}
                                            className="p-2 text-gray-500 disabled:opacity-50"
                                        >+</button>
                                    </div>
                                </div>

                                {/* Step Count */}
                                <div className="mb-4">
                                    <label className="text-sm text-gray-500 block mb-2">Число шагов</label>
                                    <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                        <button
                                            onClick={() => setStepCount(Math.max(2, stepCount - 1))}
                                            disabled={stepCount <= 2 || phase !== 'idle'}
                                            className="p-2 text-gray-500 disabled:opacity-50"
                                        >−</button>
                                        <span className="font-bold text-gray-800">{stepCount}</span>
                                        <button
                                            onClick={() => setStepCount(Math.min(20, stepCount + 1))}
                                            disabled={stepCount >= 20 || phase !== 'idle'}
                                            className="p-2 text-gray-500 disabled:opacity-50"
                                        >+</button>
                                    </div>
                                </div>

                                {/* Step Speed */}
                                <div className="mb-4">
                                    <label className="text-sm text-gray-500 block mb-2">Скорость (сек)</label>
                                    <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                        <button
                                            onClick={() => setStepSpeed(Math.max(1, stepSpeed - 1))}
                                            disabled={stepSpeed <= 1 || phase !== 'idle'}
                                            className="p-2 text-gray-500 disabled:opacity-50"
                                        >−</button>
                                        <span className="font-bold text-gray-800">{stepSpeed}</span>
                                        <button
                                            onClick={() => setStepSpeed(Math.min(10, stepSpeed + 1))}
                                            disabled={stepSpeed >= 10 || phase !== 'idle'}
                                            className="p-2 text-gray-500 disabled:opacity-50"
                                        >+</button>
                                    </div>
                                </div>

                                {/* Hidden Mode Toggle */}
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm text-gray-500">Закрыто</label>
                                    <button
                                        onClick={() => phase === 'idle' && setHiddenMode(!hiddenMode)}
                                        className={`w-10 h-5 rounded-full transition-all ${hiddenMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${hiddenMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Speech Toggle - always available */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-500">Проговаривание</label>
                                <button
                                    onClick={() => setSpeechEnabled(!speechEnabled)}
                                    className={`w-10 h-5 rounded-full transition-all ${speechEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${speechEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
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
                                <span className="text-6xl">🪰</span>
                            </div>
                            <button
                                onClick={startGame}
                                className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all"
                            >
                                НАЧАТЬ ТЕСТ
                            </button>
                        </div>
                    )}

                    {/* Playing & Answering Phase - Show Grid */}
                    {(phase === 'playing' || phase === 'answering' || phase === 'result') && (
                        <div className="flex flex-col items-center h-full">
                            {/* Fixed height header area for direction or prompt */}
                            <div className="h-12 flex items-center justify-center">
                                {phase === 'playing' && showCurrentDirection && (
                                    <div className="text-3xl font-bold text-blue-600">
                                        {DIRECTION_NAMES[showCurrentDirection]}
                                    </div>
                                )}
                                {phase === 'answering' && (
                                    <div className="text-xl text-gray-600">
                                        Укажите, где оказалась муха
                                    </div>
                                )}
                                {phase === 'result' && <div className="h-6" />}
                            </div>

                            {/* Grid - responsive square container at 80% */}
                            <div className="flex-1 flex items-center justify-center py-4">
                                <div
                                    className="grid gap-1 bg-gray-200 p-3 rounded-xl"
                                    style={{
                                        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                                        width: 'min(60vh, 60vw)',
                                        height: 'min(60vh, 60vw)'
                                    }}
                                >
                                    {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
                                        const x = idx % gridSize;
                                        const y = Math.floor(idx / gridSize);
                                        const isFlyHere = flyPosition.x === x && flyPosition.y === y;
                                        const isTarget = phase === 'result' && targetPosition.x === x && targetPosition.y === y;
                                        const isUserAnswer = phase === 'result' && userAnswer?.x === x && userAnswer?.y === y;
                                        const isHidden = hiddenMode && phase === 'playing';

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => handleCellClick(x, y)}
                                                className={`
                                                    aspect-square rounded-lg flex items-center justify-center transition-all
                                                    ${phase === 'answering' ? 'cursor-pointer hover:bg-blue-100' : ''}
                                                    ${isTarget && !isUserAnswer ? 'bg-green-200 border-2 border-green-500' : ''}
                                                    ${isUserAnswer && isTarget ? 'bg-green-300 border-2 border-green-600' : ''}
                                                    ${isUserAnswer && !isTarget ? 'bg-red-200 border-2 border-red-500' : ''}
                                                    ${!isTarget && !isUserAnswer ? 'bg-white' : ''}
                                                `}
                                            >
                                                {isFlyHere && !isHidden && (phase === 'playing' || phase === 'answering') && (
                                                    <span className="text-3xl">🪰</span>
                                                )}
                                                {isHidden && isFlyHere && phase === 'playing' && showCurrentDirection === null && (
                                                    <span className="text-3xl">🪰</span>
                                                )}
                                                {phase === 'result' && isTarget && (
                                                    <span className="text-3xl">🪰</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Fixed height footer area for result feedback */}
                            <div className="h-24 flex items-center justify-center">
                                {phase === 'result' && (() => {
                                    const isCorrect = userAnswer?.x === targetPosition.x && userAnswer?.y === targetPosition.y;

                                    // Auto-proceed on correct answer after delay
                                    if (isCorrect) {
                                        setTimeout(() => {
                                            nextAttempt();
                                        }, 1000);
                                    }

                                    return (
                                        <div className="flex flex-col items-center gap-3">
                                            {isCorrect ? (
                                                <div className="flex items-center gap-2 text-green-600 text-xl font-bold">
                                                    <CheckCircle size={28} />
                                                    Правильно!
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 text-red-500 text-xl font-bold">
                                                        <X size={28} />
                                                        Неверно
                                                    </div>
                                                    <button
                                                        onClick={startGame}
                                                        className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all"
                                                    >
                                                        Ещё раз
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Final Results */}
                    {phase === 'final' && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                {accuracy >= 80 ? (
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
                                    {accuracy >= 80 ? "Отлично!" : "Хорошая попытка!"}
                                </h2>
                                <p className="text-xl text-gray-600">
                                    {correctCount} из {attempts} правильно
                                </p>
                                <p className="text-gray-500">
                                    Точность: <span className="font-bold text-blue-600">{accuracy}%</span>
                                </p>
                            </div>

                            {/* Results grid */}
                            <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                                {attemptHistory.map((record, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-2 rounded-lg flex items-center justify-center ${record.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                                            }`}
                                    >
                                        {record.correct ? '✓' : '✗'}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all"
                                >
                                    Ещё раз
                                </button>
                                {/* Next button - only if all attempts correct */}
                                {isLocked && correctCount === attempts && (
                                    <Link href={getNextPath()}>
                                        <button
                                            onClick={() => {
                                                lockedCompleteExercise({ correctCount, attempts, accuracy }, true);
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

                {/* Right Sidebar - History */}
                <div className="w-64 bg-white border-l border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-700">Текущий раунд</span>
                    </div>

                    {attemptHistory.length === 0 ? (
                        <p className="text-gray-400 text-sm">Нет попыток</p>
                    ) : (
                        <div className="space-y-2">
                            {attemptHistory.map((attempt, i) => (
                                <div key={i} className={`p-3 rounded-lg text-sm ${attempt.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                                    }`}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-600">Попытка {i + 1}</span>
                                        <span className={attempt.correct ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                                            {attempt.correct ? '✓' : '✗'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {attempt.moves.length} шагов
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
                            <p><strong>Цель:</strong> Отследить перемещение мухи по полю.</p>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Муха появляется на поле</li>
                                <li>Голос называет направления движения</li>
                                <li>Представьте, куда переместится муха</li>
                                <li>Укажите конечную позицию мухи</li>
                            </ul>
                            <p><strong>Режим "Закрыто":</strong> поле скрывается во время команд</p>
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
