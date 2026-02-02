import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Clock, CheckCircle, HelpCircle, X, Square, ArrowRight, Minus, Plus } from "lucide-react";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";
import { RequiredResultBanner } from "@/components/RequiredResultBanner";


interface NodePosition {
    x: number;
    y: number;
}

function getSafePos(existing: NodePosition[]): NodePosition {
    let x, y, tooClose;
    let tries = 0;
    do {
        tooClose = false;
        x = 10 + Math.random() * 80;
        y = 10 + Math.random() * 80;
        for (const p of existing) {
            if (Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2) < 18) {
                tooClose = true;
                break;
            }
        }
        tries++;
    } while (tooClose && tries < 100);
    return { x, y };
}

export default function SequenceTest() {
    const {
        isLocked,
        requiredResult,
        lockedParameters,
        backPath,
        completeExercise: completeLockedExercise,
        hasNextExercise,
        getNextPath
    } = useLockedParams('sequence-test');

    const [phase, setPhase] = useState<'idle' | 'running' | 'results'>('idle');
    const [currentStep, setCurrentStep] = useState(0);
    const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
    const [completedNodes, setCompletedNodes] = useState<Set<number>>(new Set());
    const [errorNode, setErrorNode] = useState<number | null>(null);
    const [totalErrors, setTotalErrors] = useState(0);
    const [totalCorrect, setTotalCorrect] = useState(0);
    const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
    const [exerciseCompleted, setExerciseCompleted] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showResults, setShowResults] = useState(false);


    // Settings
    const [sequenceLength, setSequenceLength] = useState(12);
    const [exerciseDuration, setExerciseDuration] = useState(0); // 0 = infinite
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const gameAreaRef = useRef<HTMLDivElement>(null);
    const nodeRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    // Apply locked parameters from assignment
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.startLength !== undefined) setSequenceLength(Number(lockedParameters.startLength));
            if (lockedParameters.timeLimit !== undefined) setExerciseDuration(Number(lockedParameters.timeLimit));
        }
    }, [isLocked, lockedParameters]);

    // Generate sequence
    const sequence = Array.from({ length: sequenceLength }, (_, i) => i + 1);

    const initGame = () => {
        const positions: NodePosition[] = [];
        sequence.forEach(() => {
            positions.push(getSafePos(positions));
        });
        setNodePositions(positions);
        setCurrentStep(0);
        setCompletedNodes(new Set());
        setLines([]);
        nodeRefs.current.clear();
    };

    // Actually start the test (after countdown)
    const doStartTest = () => {
        setPhase('running');
        setTotalErrors(0);
        setTotalCorrect(0);
        setShowResults(false);

        // Start timer
        if (exerciseDuration > 0) {
            setElapsedTime(exerciseDuration);
        } else {
            setElapsedTime(0);
        }
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => {
                if (exerciseDuration > 0) {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        setShowResults(true);
                        setPhase('results');
                        return 0;
                    }
                    return prev - 1;
                } else {
                    return prev + 1;
                }
            });
        }, 1000);

        initGame();
    };

    const stopTest = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('idle');
        setNodePositions([]);
        setLines([]);
        setCompletedNodes(new Set());
    };

    // Start test wrapper
    const startTest = () => {
        doStartTest();
    };

    const handleTap = (idx: number, node: HTMLDivElement) => {
        if (errorNode !== null || phase !== 'running') return;
        if (completedNodes.has(idx)) return;

        if (idx === currentStep) {
            setTotalCorrect(prev => prev + 1);
            const newCompleted = new Set(completedNodes).add(idx);
            setCompletedNodes(newCompleted);

            // Draw line
            if (currentStep > 0 && gameAreaRef.current) {
                const prevNode = nodeRefs.current.get(currentStep - 1);
                if (prevNode) {
                    const containerRect = gameAreaRef.current.getBoundingClientRect();
                    const r1 = prevNode.getBoundingClientRect();
                    const r2 = node.getBoundingClientRect();

                    const cx1 = (r1.left - containerRect.left) + r1.width / 2;
                    const cy1 = (r1.top - containerRect.top) + r1.height / 2;
                    const cx2 = (r2.left - containerRect.left) + r2.width / 2;
                    const cy2 = (r2.top - containerRect.top) + r2.height / 2;

                    const dx = cx2 - cx1;
                    const dy = cy2 - cy1;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 0) {
                        const nx = dx / dist;
                        const ny = dy / dist;
                        const radius1 = r1.width / 2 + 2;
                        const radius2 = r2.width / 2 + 2;

                        setLines(prev => [...prev, {
                            x1: cx1 + nx * radius1,
                            y1: cy1 + ny * radius1,
                            x2: cx2 - nx * radius2,
                            y2: cy2 - ny * radius2
                        }]);
                    }
                }
            }

            setCurrentStep(prev => prev + 1);

            // Level complete
            if (currentStep + 1 === sequence.length) {
                setTimeout(() => {
                    initGame();
                }, 500);
            }
        } else {
            setErrorNode(idx);
            setTotalErrors(prev => prev + 1);
            setTimeout(() => setErrorNode(null), 500);
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Handle time up
    useEffect(() => {
        if (exerciseDuration > 0 && elapsedTime === 0 && phase === 'running') {
            // Time is up
        }
    }, [elapsedTime, exerciseDuration, phase]);

    const handleCompleteExercise = async () => {
        if (!isLocked) return;

        const total = totalCorrect + totalErrors;
        const result = {
            totalCorrect,
            totalErrors,
            accuracy: total > 0 ? Math.round((totalCorrect / total) * 100) : 100,
        };

        await completeLockedExercise(result, result.accuracy >= (requiredResult?.minValue || 0));
        setExerciseCompleted(true);
    };

    const total = totalCorrect + totalErrors;
    const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 100;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Exercise Completed Overlay */}
            {exerciseCompleted && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Упражнение завершено!</h2>
                        <p className="text-gray-600 mb-4">Результаты отправлены</p>
                        {isLocked && (
                            <Link href={getNextPath()}>
                                <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg transition-all flex items-center gap-2 mx-auto">
                                    {hasNextExercise ? 'К следующему упражнению' : 'Завершить занятие'}
                                    <ArrowRight size={18} />
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Header - Same style as speed-reading */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0 z-10 shadow-sm">
                <div className="flex items-center justify-center h-full relative">

                    {/* LEFT: Back Button and Title - Absolutely positioned */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        <Link href={backPath}>
                            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all">
                                <ArrowLeft size={24} />
                            </button>
                        </Link>
                        <h1 className="text-xl font-bold text-gray-800">Последовательность</h1>
                    </div>

                    {/* RIGHT: Timer Display - Absolutely positioned */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        {isLocked && (
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                                📚 Занятие
                            </span>
                        )}
                        <div className="bg-gray-100 px-5 py-2.5 rounded-xl">
                            <span className="text-2xl font-bold text-blue-600 font-mono tracking-wider">
                                {phase === 'idle' && exerciseDuration === 0 ? (
                                    '∞'
                                ) : (
                                    `${Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:${(elapsedTime % 60).toString().padStart(2, '0')}`
                                )}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowHelp(true)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500"
                        >
                            <HelpCircle size={24} />
                        </button>
                    </div>

                    {/* CENTERED GROUP: Controls & Settings */}
                    <div className="flex items-end gap-6">
                        {/* Toggle Start/Stop Button */}
                        <div className="flex flex-col gap-1 items-center">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                                Управление
                            </span>
                            <button
                                onClick={phase === 'idle' ? startTest : stopTest}
                                className={`h-[42px] px-6 text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none flex items-center justify-center gap-2 ${phase !== 'idle'
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                            >
                                {phase !== 'idle' ? (
                                    <>
                                        <Square size={18} fill="currentColor" />
                                        Стоп
                                    </>
                                ) : (
                                    <>
                                        <Play size={18} fill="currentColor" />
                                        Начать
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Duration Control - Hidden when locked or running */}
                        {!isLocked && phase === 'idle' && (
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Время</span>
                                <div className="flex items-center rounded-lg border p-1.5 bg-white border-gray-200 h-[42px]">
                                    <button
                                        onClick={() => {
                                            if (exerciseDuration === 0) return;
                                            const val = exerciseDuration <= 30 ? 0 : exerciseDuration - 30;
                                            setExerciseDuration(val);
                                            if (phase === 'idle') setElapsedTime(val);
                                        }}
                                        disabled={exerciseDuration === 0}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-14 text-center font-bold text-base text-gray-800">
                                        {exerciseDuration === 0 ? '∞' : exerciseDuration}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const val = Math.min(300, exerciseDuration + 30);
                                            setExerciseDuration(val);
                                            if (phase === 'idle') setElapsedTime(val);
                                        }}
                                        disabled={exerciseDuration >= 300}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Sequence Length Control - Hidden when locked or running */}
                        {!isLocked && phase === 'idle' && (
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Элементов</span>
                                <div className="flex items-center rounded-lg border p-1.5 bg-white border-gray-200 h-[42px]">
                                    <button
                                        onClick={() => setSequenceLength(Math.max(5, sequenceLength - 1))}
                                        disabled={sequenceLength <= 5}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-14 text-center font-bold text-base text-gray-800">
                                        {sequenceLength}
                                    </span>
                                    <button
                                        onClick={() => setSequenceLength(Math.min(25, sequenceLength + 1))}
                                        disabled={sequenceLength >= 25}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
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
                            <p><strong>Цель:</strong> Нажимайте на числа в порядке возрастания.</p>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Начните с числа 1</li>
                                <li>Нажимайте последовательно: 1, 2, 3...</li>
                                <li>Неправильный клик засчитывается как ошибка</li>
                                <li>После прохождения генерируется новый уровень</li>
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

            {/* Stats Bar */}
            <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Верно:</span>
                    <span className="font-bold text-green-600">{totalCorrect}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Ошибки:</span>
                    <span className="font-bold text-red-600">{totalErrors}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Точность:</span>
                    <span className="font-bold text-blue-600">{accuracy}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Шаг:</span>
                    <span className="font-bold text-gray-800">{currentStep} / {sequenceLength}</span>
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 relative p-4" ref={gameAreaRef}>
                {phase === 'idle' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {isLocked && requiredResult ? (
                            <>
                                <div className="text-6xl mb-4">🎯</div>
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl shadow-lg inline-block mb-4">
                                    <p className="text-sm opacity-90 text-center">Цель упражнения:</p>
                                    <p className="text-xl font-bold text-center">{formatRequiredResult(requiredResult, lockedParameters || undefined)}</p>
                                </div>
                                <button
                                    onClick={startTest}
                                    className="w-48 h-14 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg shadow-lg transition-all"
                                >
                                    НАЧАТЬ ТЕСТ
                                </button>
                            </>
                        ) : (
                            <>
                                <img
                                    src="/logo.png"
                                    alt="Logo"
                                    className="w-32 h-32 object-contain opacity-30 mb-8"
                                />
                                <button
                                    onClick={startTest}
                                    className="w-48 h-14 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg shadow-lg transition-all"
                                >
                                    НАЧАТЬ ТЕСТ
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {/* SVG Lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                            {lines.map((line, idx) => (
                                <line
                                    key={idx}
                                    x1={line.x1}
                                    y1={line.y1}
                                    x2={line.x2}
                                    y2={line.y2}
                                    stroke="#3B82F6"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            ))}
                        </svg>

                        {/* Nodes */}
                        {nodePositions.map((pos, idx) => {
                            const val = sequence[idx];
                            const isCompleted = completedNodes.has(idx);
                            const isError = errorNode === idx;
                            const isFirst = idx === 0;
                            const isLast = idx === sequence.length - 1;

                            return (
                                <div
                                    key={idx}
                                    ref={el => { if (el) nodeRefs.current.set(idx, el); }}
                                    className="absolute flex flex-col items-center z-10"
                                    style={{
                                        left: `${pos.x}%`,
                                        top: `${pos.y}%`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    {isFirst && (
                                        <span className="text-xs font-semibold text-green-600 mb-1">НАЧАЛО</span>
                                    )}
                                    {isLast && (
                                        <span className="text-xs font-semibold text-red-500 mb-1">КОНЕЦ</span>
                                    )}
                                    <div
                                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-bold text-lg cursor-pointer transition-all border-4 ${isCompleted
                                            ? 'bg-blue-500 text-white border-blue-600 scale-110'
                                            : isError
                                                ? 'bg-red-500 text-white border-red-600'
                                                : 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300'
                                            }`}
                                        onClick={(e) => handleTap(idx, e.currentTarget)}
                                    >
                                        {val}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Results Modal */}
            {showResults && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="text-6xl mb-4">{accuracy >= (requiredResult?.minValue ?? 0) ? '🎉' : '📊'}</div>
                        <div className={`${accuracy >= (requiredResult?.minValue ?? 0) ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'} text-white px-8 py-6 rounded-xl shadow-lg inline-block`}>
                            <p className="text-2xl font-bold mb-2">
                                {isLocked && accuracy >= (requiredResult?.minValue ?? 0)
                                    ? (hasNextExercise ? 'Упражнение завершено!' : 'Занятие завершено!')
                                    : 'Результаты теста'}
                            </p>
                            <div className="text-lg opacity-90 space-y-1">
                                <p>Верных: {totalCorrect} | Ошибок: {totalErrors}</p>
                                <p>Точность: {accuracy}%</p>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-full transition-all"
                            >
                                Ещё раз
                            </button>
                            {isLocked && accuracy >= (requiredResult?.minValue ?? 0) && (
                                <Link href={getNextPath()}>
                                    <button
                                        onClick={() => completeLockedExercise({ totalCorrect, totalErrors, accuracy }, true)}
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-all"
                                    >
                                        {hasNextExercise ? 'К следующему упражнению →' : 'Готово ✓'}
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
