import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Clock, CheckCircle, HelpCircle, X, History, Square, ArrowRight } from "lucide-react";
import { useLessonConfig } from "@/hooks/use-lesson-config";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";

interface LevelItem {
    id: number;
    type: 'circle' | 'hexagon';
    content: string;
    val: number | string | null;
}

interface Level {
    type: 'sequence' | 'select';
    instruction: string;
    items: LevelItem[];
    targetType?: 'circle';
    targetContent?: 'number';
}

type TrialLog = {
    level: number;
    outcome: 'correct' | 'error';
    timestamp: number
};

function generateRandomItems(mode: 'sequence' | 'select_circle_num'): LevelItem[] {
    const items: LevelItem[] = [];

    if (mode === 'sequence') {
        const seqLen = 3 + Math.floor(Math.random() * 2);
        for (let i = 1; i <= seqLen; i++) {
            items.push({ id: i, type: 'circle', content: i.toString(), val: i });
        }
        while (items.length < 6) {
            items.push({ id: items.length + 1, type: 'hexagon', content: '', val: null });
        }
    } else {
        const targets = 3;
        for (let i = 0; i < targets; i++) {
            items.push({ id: i + 1, type: 'circle', content: Math.floor(Math.random() * 20).toString(), val: 'number' });
        }
        items.push({ id: 4, type: 'circle', content: 'A', val: 'letter' });
        items.push({ id: 5, type: 'hexagon', content: '5', val: 'number' });
        items.push({ id: 6, type: 'hexagon', content: 'B', val: 'letter' });
    }

    return items.sort(() => Math.random() - 0.5);
}

function generateLevel(): Level {
    const isSequence = Math.random() > 0.5;
    if (isSequence) {
        return {
            type: 'sequence',
            instruction: 'Выберите числа в порядке возрастания',
            items: generateRandomItems('sequence')
        };
    } else {
        return {
            type: 'select',
            targetType: 'circle',
            targetContent: 'number',
            instruction: 'Выберите все круги с числами',
            items: generateRandomItems('select_circle_num')
        };
    }
}

function getCircularPositions(count: number, radius: number) {
    const pos: { x: number; y: number }[] = [];
    const step = (2 * Math.PI) / count;
    for (let i = 0; i < count; i++) {
        const angle = i * step - Math.PI / 2;
        pos.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        });
    }
    return pos;
}

export default function FlexibilityTest() {
    const { config, isLessonMode, timeRemaining, isTimeUp, completeExercise } = useLessonConfig();
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('flexibility-test');

    const [phase, setPhase] = useState<'idle' | 'running' | 'results'>('idle');
    const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
    const [levelNumber, setLevelNumber] = useState(0);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [errorId, setErrorId] = useState<number | null>(null);
    const [totalErrors, setTotalErrors] = useState(0);
    const [totalCorrect, setTotalCorrect] = useState(0);
    const [history, setHistory] = useState<TrialLog[]>([]);
    const [exerciseCompleted, setExerciseCompleted] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Settings
    const [exerciseDuration, setExerciseDuration] = useState(0); // 0 = infinite
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const startLevel = useCallback(() => {
        const levelData = generateLevel();
        setCurrentLevel(levelData);
        setCurrentStep(1);
        setSelectedIds(new Set());
        setLines([]);
        itemRefs.current.clear();
    }, []);

    const handleItemClick = useCallback((item: LevelItem) => {
        if (!currentLevel || phase !== 'running') return;
        if (selectedIds.has(item.id)) return;

        if (currentLevel.type === 'sequence') {
            if (item.val === currentStep) {
                setTotalCorrect(prev => prev + 1);
                setSelectedIds(prev => new Set(prev).add(item.id));
                setHistory(prev => [{ level: levelNumber, outcome: 'correct', timestamp: Date.now() }, ...prev.slice(0, 19)]);

                // Draw line
                if (currentStep > 1) {
                    const prevItem = currentLevel.items.find(it => it.val === currentStep - 1);
                    if (prevItem) {
                        const prevEl = itemRefs.current.get(prevItem.id);
                        const currEl = itemRefs.current.get(item.id);
                        if (prevEl && currEl && gameAreaRef.current) {
                            const containerRect = gameAreaRef.current.getBoundingClientRect();
                            const r1 = prevEl.getBoundingClientRect();
                            const r2 = currEl.getBoundingClientRect();

                            // Get center points
                            const cx1 = (r1.left - containerRect.left) + r1.width / 2;
                            const cy1 = (r1.top - containerRect.top) + r1.height / 2;
                            const cx2 = (r2.left - containerRect.left) + r2.width / 2;
                            const cy2 = (r2.top - containerRect.top) + r2.height / 2;

                            // Calculate distance and direction
                            const dx = cx2 - cx1;
                            const dy = cy2 - cy1;
                            const dist = Math.sqrt(dx * dx + dy * dy);

                            if (dist > 0) {
                                // Normalize direction
                                const nx = dx / dist;
                                const ny = dy / dist;

                                // Circle radius (half of width + small buffer)
                                const radius1 = r1.width / 2 + 2;
                                const radius2 = r2.width / 2 + 2;

                                // Offset line endpoints to circle edges
                                setLines(prev => [...prev, {
                                    x1: cx1 + nx * radius1,
                                    y1: cy1 + ny * radius1,
                                    x2: cx2 - nx * radius2,
                                    y2: cy2 - ny * radius2
                                }]);
                            }
                        }
                    }
                }

                setCurrentStep(prev => prev + 1);

                const maxVal = Math.max(...currentLevel.items.filter(i => typeof i.val === 'number').map(i => i.val as number));
                if (currentStep >= maxVal) {
                    setLevelNumber(prev => prev + 1);
                    setTimeout(startLevel, 500);
                }
            } else {
                handleError(item.id);
            }
        } else if (currentLevel.type === 'select') {
            const isTargetType = item.type === currentLevel.targetType;
            const isTargetContent = item.val === currentLevel.targetContent;

            if (isTargetType && isTargetContent) {
                setTotalCorrect(prev => prev + 1);
                setHistory(prev => [{ level: levelNumber, outcome: 'correct', timestamp: Date.now() }, ...prev.slice(0, 19)]);
                const newSelected = new Set(selectedIds).add(item.id);
                setSelectedIds(newSelected);

                const totalTargets = currentLevel.items.filter(
                    it => it.type === currentLevel.targetType && it.val === currentLevel.targetContent
                ).length;

                if (newSelected.size === totalTargets) {
                    setLevelNumber(prev => prev + 1);
                    setTimeout(startLevel, 500);
                }
            } else {
                handleError(item.id);
            }
        }
    }, [currentLevel, currentStep, phase, selectedIds, levelNumber, startLevel]);

    const handleError = (id: number) => {
        setErrorId(id);
        setTotalErrors(prev => prev + 1);
        setHistory(prev => [{ level: levelNumber, outcome: 'error', timestamp: Date.now() }, ...prev.slice(0, 19)]);
        setTimeout(() => setErrorId(null), 400);
    };

    const startTest = () => {
        setPhase('running');
        setLevelNumber(1);
        setTotalErrors(0);
        setTotalCorrect(0);
        setHistory([]);
        setShowResults(false);

        // Start timer
        if (exerciseDuration > 0) {
            setElapsedTime(exerciseDuration);
        } else {
            setElapsedTime(0);
        }
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
            setElapsedTime(prev => {
                if (exerciseDuration > 0) {
                    if (prev <= 1) {
                        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
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

        startLevel();
    };

    const stopTest = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setPhase('idle');
        setCurrentLevel(null);
    };

    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
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

        const total = totalCorrect + totalErrors;
        const result = {
            totalCorrect,
            totalErrors,
            accuracy: total > 0 ? Math.round((totalCorrect / total) * 100) : 100,
            levelsCompleted: levelNumber,
        };

        const success = await completeExercise(result);
        if (success) {
            setExerciseCompleted(true);
        }
    };

    // Calculate stats
    const total = totalCorrect + totalErrors;
    const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 100;

    const positions = currentLevel ? getCircularPositions(currentLevel.items.length, 120) : [];

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

            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href={backPath}>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-600">
                            <ArrowLeft size={24} />
                        </button>
                    </Link>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">Когнитивная гибкость</h1>
                    {isLessonMode && (
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                            📚 Занятие
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowHelp(true)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500"
                >
                    <HelpCircle size={24} />
                </button>
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
                            <p><strong>Цель:</strong> Переключайтесь между разными заданиями.</p>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li><strong>Круги с числами и пустые фигуры:</strong> соединяйте круги в порядке возрастания чисел</li>
                                <li><strong>Круги и шестиугольники с числами/буквами:</strong> нажимайте только на круги с числами</li>
                            </ul>
                            <p><strong>Подсказка:</strong> Читайте инструкцию над игровым полем!</p>
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

            {/* Main 3-Column Layout */}
            <div className="flex-1 flex">
                {/* Left Panel - Settings */}
                <div className="w-72 bg-white border-r border-gray-200 p-6 flex flex-col gap-6">
                    {/* Start/Stop Button */}
                    <button
                        onClick={phase === 'idle' ? startTest : stopTest}
                        className={`w-full px-6 py-3 text-sm font-bold rounded-full transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${phase !== 'idle'
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
                                Начать тест
                            </>
                        )}
                    </button>

                    {/* Timer Display */}
                    <div className="text-4xl font-mono font-bold text-blue-600 text-center">
                        {(() => {
                            const displayTime = phase === 'idle' ? exerciseDuration : elapsedTime;
                            return `${Math.floor(displayTime / 60).toString().padStart(2, '0')}:${(displayTime % 60).toString().padStart(2, '0')}`;
                        })()}
                    </div>

                    {/* Settings - Hidden when locked */}
                    {!isLocked && phase === 'idle' && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <Clock size={18} />
                                Настройки
                            </h3>

                            {/* Exercise Duration */}
                            <div>
                                <label className="text-sm text-gray-500 block mb-2">Время (сек)</label>
                                <div className="flex items-center justify-between bg-gray-100 rounded-full px-4 py-3">
                                    <button
                                        onClick={() => setExerciseDuration(Math.max(0, exerciseDuration - 30))}
                                        disabled={exerciseDuration <= 0 || phase !== 'idle'}
                                        className="w-8 h-8 rounded-full disabled:opacity-50 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center"
                                    >
                                        <span className="text-xl font-bold">−</span>
                                    </button>
                                    <span className="font-bold text-gray-800 text-xl">
                                        {exerciseDuration === 0 ? "∞" : exerciseDuration}
                                    </span>
                                    <button
                                        onClick={() => setExerciseDuration(exerciseDuration + 30)}
                                        disabled={phase !== 'idle'}
                                        className="w-8 h-8 rounded-full disabled:opacity-50 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center"
                                    >
                                        <span className="text-xl font-bold">+</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Current Session Stats */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <Clock size={18} />
                            Текущая сессия
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Уровень:</span>
                                <span className="font-bold text-gray-800">{levelNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Верно:</span>
                                <span className="font-bold text-green-600">{totalCorrect}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Ошибки:</span>
                                <span className="font-bold text-red-600">{totalErrors}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Точность:</span>
                                <span className="font-bold text-blue-600">{accuracy}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center - Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    {/* Instruction */}
                    {currentLevel && (
                        <div className="text-center mb-6">
                            <p className="text-lg font-semibold text-gray-700 bg-yellow-100 px-6 py-3 rounded-full">{currentLevel.instruction}</p>
                        </div>
                    )}

                    {/* Game Board */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        {phase === 'idle' ? (
                            <div className="w-[320px] h-[320px] flex items-center justify-center">
                                <img
                                    src="/logo.png"
                                    alt="Logo"
                                    className="w-32 h-32 object-contain opacity-30"
                                />
                            </div>
                        ) : currentLevel ? (
                            <div className="relative w-[320px] h-[320px]" ref={gameAreaRef}>
                                {/* SVG Lines */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
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

                                {/* Items */}
                                {currentLevel.items.map((item, idx) => {
                                    const isSelected = selectedIds.has(item.id);
                                    const isError = errorId === item.id;

                                    const baseClasses = "absolute w-14 h-14 md:w-16 md:h-16 flex items-center justify-center font-bold text-lg cursor-pointer transition-all transform -translate-x-1/2 -translate-y-1/2";

                                    let shapeClasses = "";
                                    if (item.type === 'circle') {
                                        shapeClasses = "rounded-full";
                                    }

                                    let colorClasses = "";
                                    if (isSelected) {
                                        colorClasses = "bg-blue-500 text-white border-blue-600 scale-110";
                                    } else if (isError) {
                                        colorClasses = "bg-red-500 text-white border-red-600";
                                    } else {
                                        colorClasses = "bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300";
                                    }

                                    return (
                                        <div
                                            key={item.id}
                                            ref={el => { if (el) itemRefs.current.set(item.id, el); }}
                                            className={`${baseClasses} ${shapeClasses} ${colorClasses} border-4`}
                                            style={{
                                                left: `calc(50% + ${positions[idx]?.x || 0}px)`,
                                                top: `calc(50% + ${positions[idx]?.y || 0}px)`,
                                                clipPath: item.type === 'hexagon' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : undefined
                                            }}
                                            onClick={() => handleItemClick(item)}
                                        >
                                            {item.content}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>

                    {/* Start Button below game board */}
                    {phase === 'idle' && (
                        <button
                            onClick={startTest}
                            className="mt-6 w-48 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-lg shadow-lg transition-all transform active:scale-95"
                        >
                            НАЧАТЬ ТЕСТ
                        </button>
                    )}
                </div>

                {/* Right Panel - History */}
                <div className="w-72 bg-white border-l border-gray-200 p-6">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <History size={18} />
                        История действий
                    </h3>
                    {history.length === 0 ? (
                        <p className="text-gray-400 text-sm">Нет действий</p>
                    ) : (
                        <>
                            {/* Summary Stats */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Общее время:</span>
                                    <span className="font-bold text-gray-800">
                                        {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{(elapsedTime % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Точность:</span>
                                    <span className="font-bold text-blue-600">{accuracy}%</span>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {history.map((log, idx) => (
                                    <div
                                        key={idx}
                                        className={`text-sm px-3 py-2 rounded-lg ${log.outcome === 'correct'
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-red-50 text-red-700'
                                            }`}
                                    >
                                        Ур.{log.level} {log.outcome === 'correct' ? '✓' : '✕'}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Results Modal */}
            {showResults && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">Результаты</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Пройдено уровней:</span>
                                <span className="font-bold text-gray-800">{levelNumber}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Верных:</span>
                                <span className="font-bold text-gray-800">{totalCorrect}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Ошибок:</span>
                                <span className="font-bold text-gray-800">{totalErrors}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-gray-600">Точность:</span>
                                <span className="font-bold text-gray-800">{accuracy}%</span>
                            </div>
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
                                        onClick={() => lockedCompleteExercise({ levelNumber, totalCorrect, totalErrors, accuracy }, true)}
                                        className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        {hasNextExercise ? 'К следующему упражнению →' : 'Готово ✓'}
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
