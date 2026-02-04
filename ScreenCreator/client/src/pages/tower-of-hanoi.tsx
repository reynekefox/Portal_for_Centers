import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Clock, CheckCircle, HelpCircle, X, Square, ArrowRight, Minus, Plus } from "lucide-react";
import { useLessonConfig } from "@/hooks/use-lesson-config";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";

const diskColors = [
    'bg-red-500 border-red-600',
    'bg-orange-500 border-orange-600',
    'bg-yellow-500 border-yellow-600',
    'bg-green-500 border-green-600',
    'bg-blue-500 border-blue-600',
    'bg-purple-500 border-purple-600',
    'bg-pink-500 border-pink-600',
    'bg-cyan-500 border-cyan-600'
];

export default function TowerOfHanoiTest() {
    const { config, isLessonMode, timeRemaining, isTimeUp, completeExercise } = useLessonConfig();
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('tower-of-hanoi');

    const [phase, setPhase] = useState<'idle' | 'running' | 'results'>('idle');
    const [pegs, setPegs] = useState<number[][]>([[], [], []]);
    const [moves, setMoves] = useState(0);
    const [errors, setErrors] = useState(0);
    const [levelsCompleted, setLevelsCompleted] = useState(0);
    const [selectedPeg, setSelectedPeg] = useState<number | null>(null);
    const [exerciseCompleted, setExerciseCompleted] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showError, setShowError] = useState(false);
    const [draggingDisk, setDraggingDisk] = useState<{ size: number; fromPeg: number } | null>(null);
    const [puzzleSuccess, setPuzzleSuccess] = useState<boolean | null>(null); // null = not checked, true = success, false = failure

    // Settings
    const [diskCount, setDiskCount] = useState(3);
    const [exerciseDuration, setExerciseDuration] = useState(0); // 0 = infinite
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const initLevel = () => {
        const newPegs: number[][] = [[], [], []];
        for (let i = diskCount; i >= 1; i--) {
            newPegs[0].push(i);
        }
        setPegs(newPegs);
        setMoves(0);
    };

    // Apply locked parameters from assignment
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.diskCount !== undefined) setDiskCount(Number(lockedParameters.diskCount));
        }
    }, [isLocked, lockedParameters]);

    const startTest = () => {
        setPhase('running');
        setErrors(0);
        setLevelsCompleted(0);
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

        initLevel();
    };

    const stopTest = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('idle');
        setPegs([[], [], []]);
        setSelectedPeg(null);
    };

    const handlePegClick = (pegIndex: number) => {
        if (phase !== 'running') return;

        if (selectedPeg === null) {
            // No peg selected yet - select this peg if it has disks
            if (pegs[pegIndex].length > 0) {
                setSelectedPeg(pegIndex);
            }
        } else if (selectedPeg === pegIndex) {
            // Clicked same peg - deselect
            setSelectedPeg(null);
        } else {
            // Try to move disk from selectedPeg to pegIndex
            const srcPeg = pegs[selectedPeg];
            const targetPeg = pegs[pegIndex];
            const diskSize = srcPeg[srcPeg.length - 1];
            const topDiskOnTarget = targetPeg.length > 0 ? targetPeg[targetPeg.length - 1] : Infinity;

            if (diskSize < topDiskOnTarget) {
                // Valid move
                const newPegs = pegs.map(peg => [...peg]);
                newPegs[selectedPeg].pop();
                newPegs[pegIndex].push(diskSize);
                setPegs(newPegs);
                setMoves(prev => prev + 1);
                setSelectedPeg(null);

                // Check win condition
                if (newPegs[2].length === diskCount) {
                    const finalMoves = moves + 1; // +1 because setMoves hasn't updated yet
                    const optimalMoves = Math.pow(2, diskCount) - 1;

                    if (isLocked) {
                        // In locked mode, check if moves <= optimal
                        const success = finalMoves <= optimalMoves;
                        setPuzzleSuccess(success);

                        // Report completion to server if successful
                        if (success) {
                            lockedCompleteExercise({
                                moves: finalMoves,
                                optimal: optimalMoves
                            }, true);
                        }

                        setPhase('results');
                        setShowResults(true);
                        if (timerRef.current) clearInterval(timerRef.current);
                    } else {
                        // In free mode, just restart level
                        setLevelsCompleted(prev => prev + 1);
                        setTimeout(initLevel, 500);
                    }
                }
            } else {
                // Invalid move
                setErrors(prev => prev + 1);
                setShowError(true);
                setTimeout(() => setShowError(false), 1000);
                setSelectedPeg(null);
            }
        }
    };

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, diskSize: number, fromPeg: number, isTop: boolean) => {
        if (!isTop || phase !== 'running') {
            e.preventDefault();
            return;
        }
        setDraggingDisk({ size: diskSize, fromPeg });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetPeg: number) => {
        e.preventDefault();
        if (!draggingDisk || phase !== 'running') {
            setDraggingDisk(null);
            return;
        }

        const { size: diskSize, fromPeg } = draggingDisk;
        if (fromPeg === targetPeg) {
            setDraggingDisk(null);
            return;
        }

        const targetPegDisks = pegs[targetPeg];
        const topDiskOnTarget = targetPegDisks.length > 0 ? targetPegDisks[targetPegDisks.length - 1] : Infinity;

        if (diskSize < topDiskOnTarget) {
            // Valid move
            const newPegs = pegs.map(peg => [...peg]);
            newPegs[fromPeg].pop();
            newPegs[targetPeg].push(diskSize);
            setPegs(newPegs);
            setMoves(prev => prev + 1);

            // Check win condition
            if (newPegs[2].length === diskCount) {
                const finalMoves = moves + 1;
                const optimalMoves = Math.pow(2, diskCount) - 1;

                if (isLocked) {
                    const success = finalMoves <= optimalMoves;
                    setPuzzleSuccess(success);

                    // Report completion to server if successful
                    if (success) {
                        lockedCompleteExercise({
                            moves: finalMoves,
                            optimal: optimalMoves
                        }, true);
                    }

                    setPhase('results');
                    setShowResults(true);
                    if (timerRef.current) clearInterval(timerRef.current);
                } else {
                    setLevelsCompleted(prev => prev + 1);
                    setTimeout(initLevel, 500);
                }
            }
        } else {
            // Invalid move
            setErrors(prev => prev + 1);
            setShowError(true);
            setTimeout(() => setShowError(false), 1000);
        }

        setDraggingDisk(null);
        setSelectedPeg(null);
    };

    const handleDragEnd = () => {
        setDraggingDisk(null);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Handle time up in lesson mode
    useEffect(() => {
        if (isTimeUp && isLessonMode && phase === 'running') {
            handleCompleteExercise();
        }
    }, [isTimeUp, isLessonMode, phase]);

    const handleCompleteExercise = async () => {
        if (!isLessonMode) return;

        if (timerRef.current) clearInterval(timerRef.current);
        const result = {
            moves,
            errors,
            levelsCompleted,
            elapsedTime,
        };

        const success = await completeExercise(result);
        if (success) {
            setExerciseCompleted(true);
        }
    };

    // Calculate optimal moves (2^n - 1)
    const optimalMoves = Math.pow(2, diskCount) - 1;
    const efficiency = moves > 0 ? Math.max(0, Math.round((optimalMoves / moves) * 100)) : 100;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Exercise Completed Overlay */}
            {exerciseCompleted && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Упражнение завершено!</h2>
                        <p className="text-gray-600">Результаты отправлены</p>
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
                        <h1 className="text-xl font-bold text-gray-800">Ханойская башня</h1>
                    </div>

                    {/* RIGHT: Timer Display - Absolutely positioned */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        {isLessonMode && (
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                                📚 Занятие
                            </span>
                        )}
                        {phase !== 'idle' && (
                            <div className="bg-gray-100 px-5 py-2.5 rounded-xl">
                                <span className="text-2xl font-bold text-blue-600 font-mono tracking-wider">
                                    {String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')}
                                </span>
                            </div>
                        )}
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
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
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

                        {/* Disk Count Control - Hidden when locked or running */}
                        {!isLocked && phase === 'idle' && (
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Дисков</span>
                                <div className="flex items-center rounded-lg border p-1.5 bg-white border-gray-200 h-[42px]">
                                    <button
                                        onClick={() => setDiskCount(Math.max(2, diskCount - 1))}
                                        disabled={diskCount <= 2}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-14 text-center font-bold text-base text-gray-800">
                                        {diskCount}
                                    </span>
                                    <button
                                        onClick={() => setDiskCount(Math.min(8, diskCount + 1))}
                                        disabled={diskCount >= 8}
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
                            <p><strong>Цель:</strong> Переместите все диски на зелёный стержень (справа).</p>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Можно перемещать только верхний диск</li>
                                <li>Нельзя класть большой диск на меньший</li>
                                <li>Чем меньше ходов — тем лучше</li>
                            </ul>
                            <p><strong>Подсказка:</strong> Оптимально: {optimalMoves} ходов для {diskCount} дисков</p>
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

            {/* Stats Bar */}
            <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Ходов:</span>
                    <span className="font-bold text-blue-600">{moves}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Цель:</span>
                    <span className="font-bold text-green-600">{optimalMoves}</span>
                </div>
            </div>

            {/* Error Indicator */}
            {showError && (
                <div className="bg-red-500 text-white text-center py-2 font-bold animate-pulse">
                    Нельзя положить большой диск на маленький!
                </div>
            )}

            {/* Game Area */}
            <div className="flex-1 flex items-center justify-center">
                {phase === 'idle' ? (
                    <div className="flex flex-col items-center">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-32 h-32 object-contain opacity-30 mb-8"
                        />
                        {isLocked && requiredResult ? (
                            <>
                                <div className="text-6xl mb-4">🎯</div>
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl shadow-lg inline-block mb-4">
                                    <p className="text-sm opacity-90 text-center">Цель упражнения:</p>
                                    <p className="text-xl font-bold text-center">Завершить за {optimalMoves} ходов</p>
                                </div>
                            </>
                        ) : null}
                        <button
                            onClick={startTest}
                            className="w-48 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-lg shadow-lg transition-all"
                        >
                            НАЧАТЬ ТЕСТ
                        </button>
                    </div>
                ) : (
                    <div className="flex items-end justify-center gap-4 md:gap-12 p-4">
                        {[0, 1, 2].map(pegIndex => {
                            const isSelected = selectedPeg === pegIndex;
                            const hasDisks = pegs[pegIndex].length > 0;
                            const isDragOver = draggingDisk && draggingDisk.fromPeg !== pegIndex;

                            return (
                                <div
                                    key={pegIndex}
                                    onClick={() => handlePegClick(pegIndex)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, pegIndex)}
                                    className={`relative flex flex-col items-center justify-end w-32 md:w-48 h-64 md:h-96 cursor-pointer transition-all rounded-2xl ${pegIndex === 2 ? 'bg-green-50/50 border-2 border-green-300' : ''
                                        } ${isSelected ? 'ring-4 ring-blue-400 bg-blue-50/50' : ''} ${selectedPeg !== null && !isSelected ? 'hover:bg-gray-100' : ''
                                        } ${isDragOver ? 'ring-4 ring-yellow-400 bg-yellow-50/50' : ''}`}
                                >
                                    {/* Peg Rod */}
                                    <div className="absolute bottom-6 w-3 h-52 md:h-80 bg-amber-700 rounded-t-full shadow-inner" />

                                    {/* Peg Base */}
                                    <div className="absolute bottom-0 w-full h-6 bg-amber-800 rounded-lg shadow-md" />

                                    {/* Disks */}
                                    <div className="absolute bottom-6 flex flex-col-reverse items-center w-full">
                                        {pegs[pegIndex].map((diskSize, diskIndex) => {
                                            const isTop = diskIndex === pegs[pegIndex].length - 1;
                                            const widthPercent = 35 + diskSize * 10;
                                            const isDragging = draggingDisk?.size === diskSize && draggingDisk?.fromPeg === pegIndex;

                                            return (
                                                <div
                                                    key={`${pegIndex}-${diskSize}`}
                                                    draggable={isTop}
                                                    onDragStart={(e) => handleDragStart(e, diskSize, pegIndex, isTop)}
                                                    onDragEnd={handleDragEnd}
                                                    className={`h-8 md:h-10 rounded-xl border-2 flex items-center justify-center text-white font-bold text-lg transition-all shadow-sm ${diskColors[diskSize - 1]} ${isTop && isSelected ? 'scale-110 ring-2 ring-white animate-pulse' : ''
                                                        } ${isTop ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-50' : ''}`}
                                                    style={{
                                                        width: `${widthPercent}%`,
                                                        minWidth: '50px',
                                                        maxWidth: '180px'
                                                    }}
                                                >
                                                    {diskSize}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Target Label */}
                                    {pegIndex === 2 && (
                                        <div className="absolute -top-6 text-green-600 font-semibold text-sm">
                                            ЦЕЛЬ
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Results Modal */}
            {showResults && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                        {isLocked && puzzleSuccess !== null ? (
                            // Locked mode - success/failure
                            <>
                                <div className={`p-6 text-center ${puzzleSuccess ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <div className={`text-6xl mb-4`}>
                                        {puzzleSuccess ? '🎉' : '😔'}
                                    </div>
                                    <h2 className={`text-2xl font-bold ${puzzleSuccess ? 'text-green-700' : 'text-red-700'}`}>
                                        {puzzleSuccess ? 'Отлично!' : 'Не получилось'}
                                    </h2>
                                    <p className="text-gray-600 mt-2">
                                        {puzzleSuccess
                                            ? `Вы решили задачу за ${moves} ходов!`
                                            : `Вы использовали ${moves} ходов, нужно было ${optimalMoves}`
                                        }
                                    </p>
                                </div>
                                <div className="p-6 space-y-3">
                                    {puzzleSuccess ? (
                                        hasNextExercise ? (
                                            <Link href={getNextPath()}>
                                                <button
                                                    onClick={() => lockedCompleteExercise({ moves, optimalMoves, efficiency: Math.round((optimalMoves / moves) * 100) }, true)}
                                                    className="w-full px-6 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                                                >
                                                    Следующее упражнение <ArrowRight size={20} />
                                                </button>
                                            </Link>
                                        ) : (
                                            <Link href={backPath}>
                                                <button className="w-full px-6 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-all">
                                                    Завершить занятие
                                                </button>
                                            </Link>
                                        )
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setPuzzleSuccess(null);
                                                setShowResults(false);
                                                setPhase('idle');
                                                setMoves(0);
                                                setErrors(0);
                                            }}
                                            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all"
                                        >
                                            Попробовать ещё раз
                                        </button>
                                    )}
                                    <Link href={backPath}>
                                        <button className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-all">
                                            Вернуться к списку
                                        </button>
                                    </Link>
                                </div>
                            </>
                        ) : (
                            // Free mode - regular results
                            <>
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-xl font-bold text-gray-800">Результаты</h2>
                                </div>
                                <div className="p-6 space-y-3">
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Завершено уровней:</span>
                                        <span className="font-bold text-purple-600">{levelsCompleted}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Всего ходов:</span>
                                        <span className="font-bold text-blue-600">{moves}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Ошибок:</span>
                                        <span className="font-bold text-red-600">{errors}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-600">Эффективность:</span>
                                        <span className={`font-bold ${efficiency >= 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {efficiency}%
                                        </span>
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 p-6">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all"
                                    >
                                        Пройти ещё раз
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
