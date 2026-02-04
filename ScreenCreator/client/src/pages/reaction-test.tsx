import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Clock, CheckCircle, History, Square, HelpCircle, X, ArrowRight } from "lucide-react";
import { useLessonConfig } from "@/hooks/use-lesson-config";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";
import { RequiredResultBanner } from "@/components/RequiredResultBanner";

// Constants
const DEFAULT_GREEN_DURATION = 2000;
const MIN_WAIT = 1500;
const MAX_WAIT = 4000;
const FEEDBACK_DURATION = 500;

type Phase = 'idle' | 'running' | 'results';
type RoundState = 'waiting' | 'active' | 'feedback';
type TrialOutcome = 'hit' | 'miss' | 'false_start';
type TrialLog = { outcome: TrialOutcome; rt: number | null; timestamp: number };

export default function ReactionTest() {
    const { config, isLessonMode, timeRemaining, isTimeUp, completeExercise: lessonCompleteExercise } = useLessonConfig();
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('reaction-test');

    const [phase, setPhase] = useState<Phase>('idle');
    const [currentRound, setCurrentRound] = useState(0);
    const [correct, setCorrect] = useState(0);
    const [errors, setErrors] = useState(0);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [history, setHistory] = useState<TrialLog[]>([]);
    const [exerciseCompleted, setExerciseCompleted] = useState(false);

    const [indicatorActive, setIndicatorActive] = useState(false);
    const [showCheckmark, setShowCheckmark] = useState(false);
    const [showCross, setShowCross] = useState(false);
    const [roundState, setRoundState] = useState<RoundState>('waiting');
    const [showResults, setShowResults] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [buttonPressed, setButtonPressed] = useState(false);

    // Configurable settings
    const [greenDuration, setGreenDuration] = useState(DEFAULT_GREEN_DURATION);
    const [exerciseDuration, setExerciseDuration] = useState(120); // default 2 minutes
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const greenStartTime = useRef(0);
    const activeTimeout = useRef<NodeJS.Timeout | null>(null);
    const waitTimeout = useRef<NodeJS.Timeout | null>(null);

    const logTrial = useCallback((outcome: TrialOutcome, rt: number | null) => {
        setHistory(prev => [{ outcome, rt, timestamp: Date.now() }, ...prev.slice(0, 19)]);
    }, []);

    const scheduleGreen = useCallback(() => {
        setRoundState('waiting');
        setIndicatorActive(false);
        setShowCheckmark(false);
        setShowCross(false);

        const waitTime = MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT);
        waitTimeout.current = setTimeout(() => {
            setIndicatorActive(true);
            setRoundState('active');
            greenStartTime.current = Date.now();

            activeTimeout.current = setTimeout(() => {
                // Missed - too slow
                setErrors(prev => prev + 1);
                logTrial('miss', null);
                showError();
            }, greenDuration);
        }, waitTime);
    }, [greenDuration, logTrial]);

    const showSuccess = useCallback(() => {
        setRoundState('feedback');
        setIndicatorActive(false);
        setShowCheckmark(true);
        setShowCross(false);

        setTimeout(() => {
            setShowCheckmark(false);
            nextRound();
        }, FEEDBACK_DURATION);
    }, []);

    const showError = useCallback(() => {
        setRoundState('feedback');
        setIndicatorActive(false);
        setShowCross(true);
        setShowCheckmark(false);

        setTimeout(() => {
            setShowCross(false);
            nextRound();
        }, FEEDBACK_DURATION);
    }, []);

    const nextRound = useCallback(() => {
        setCurrentRound(prev => prev + 1);
        scheduleGreen();
    }, [scheduleGreen]);

    // Re-wire callbacks after nextRound is defined
    const showSuccessWithNext = () => {
        setRoundState('feedback');
        setIndicatorActive(false);
        setShowCheckmark(true);
        setShowCross(false);

        setTimeout(() => {
            setShowCheckmark(false);
            setCurrentRound(prev => prev + 1);
            scheduleGreen();
        }, FEEDBACK_DURATION);
    };

    const showErrorWithNext = () => {
        setRoundState('feedback');
        setIndicatorActive(false);
        setShowCross(true);
        setShowCheckmark(false);

        setTimeout(() => {
            setShowCross(false);
            setCurrentRound(prev => prev + 1);
            scheduleGreen();
        }, FEEDBACK_DURATION);
    };

    const handleClick = useCallback(() => {
        if (phase !== 'running') return;
        if (roundState === 'feedback') return;

        if (roundState === 'waiting') {
            // False start
            if (waitTimeout.current) clearTimeout(waitTimeout.current);
            setErrors(prev => prev + 1);
            logTrial('false_start', null);
            showErrorWithNext();
            return;
        }

        if (roundState === 'active') {
            if (activeTimeout.current) clearTimeout(activeTimeout.current);
            const reactionTime = Date.now() - greenStartTime.current;
            setReactionTimes(prev => [...prev, reactionTime]);
            setCorrect(prev => prev + 1);
            logTrial('hit', reactionTime);
            showSuccessWithNext();
        }
    }, [phase, roundState, logTrial]);

    const startTest = () => {
        setPhase('running');
        setCurrentRound(0);
        setCorrect(0);
        setErrors(0);
        setReactionTimes([]);
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
                        // Stop all game logic
                        if (activeTimeout.current) clearTimeout(activeTimeout.current);
                        if (waitTimeout.current) clearTimeout(waitTimeout.current);
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

        scheduleGreen();
    };

    const stopTest = () => {
        if (activeTimeout.current) clearTimeout(activeTimeout.current);
        if (waitTimeout.current) clearTimeout(waitTimeout.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setPhase('idle');
        setIndicatorActive(false);
        setShowCheckmark(false);
        setShowCross(false);
        setRoundState('waiting');
    };

    // Keyboard handler for spacebar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                setButtonPressed(true);
                handleClick();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === ' ') {
                setButtonPressed(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleClick]);

    useEffect(() => {
        return () => {
            if (activeTimeout.current) clearTimeout(activeTimeout.current);
            if (waitTimeout.current) clearTimeout(waitTimeout.current);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, []);

    // Apply locked parameters from assignment
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.duration !== undefined) {
                setExerciseDuration(Number(lockedParameters.duration));
            }
            if (lockedParameters.targetTime !== undefined) {
                setGreenDuration(Number(lockedParameters.targetTime));
            }
        }
    }, [isLocked, lockedParameters]);

    // Handle time up in lesson mode
    useEffect(() => {
        if (isTimeUp && isLessonMode && phase === 'running') {
            handleCompleteExercise();
        }
    }, [isTimeUp, isLessonMode, phase]);

    const handleCompleteExercise = async () => {
        if (!isLessonMode) return;

        if (activeTimeout.current) clearTimeout(activeTimeout.current);
        if (waitTimeout.current) clearTimeout(waitTimeout.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

        const total = correct + errors;
        const result = {
            correct,
            errors,
            accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
            avgReactionTime: reactionTimes.length > 0
                ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
                : 0,
            roundsCompleted: currentRound,
        };

        const success = await (isLocked ? lockedCompleteExercise(result, true) : lessonCompleteExercise(result));
        if (success) {
            setExerciseCompleted(true);
        }
    };

    // Calculate results
    const total = correct + errors;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const avgReaction = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
    const minReaction = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;
    const maxReaction = reactionTimes.length > 0 ? Math.max(...reactionTimes) : 0;

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

            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href={backPath}>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-600">
                            <ArrowLeft size={24} />
                        </button>
                    </Link>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">Тест реакции</h1>
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
                            <p><strong>Цель:</strong> Нажмите кнопку, когда круг станет зелёным.</p>
                            <p><strong>Управление:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Клавиша <kbd className="px-2 py-1 bg-gray-100 rounded">Пробел</kbd> — реакция</li>
                                <li>Или клик по синей кнопке</li>
                            </ul>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Успейте нажать пока круг зелёный</li>
                                <li>Не нажимайте до сигнала (фальстарт)</li>
                                <li>Реагируйте как можно быстрее</li>
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

                    {/* Settings - Hidden when locked or running */}
                    {(!isLocked && phase === 'idle') && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <Clock size={18} />
                                Настройки
                            </h3>

                            {/* Exercise Duration */}
                            <div className="mb-4">
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

                            {/* Green Duration */}
                            <div>
                                <label className="text-sm text-gray-500 block mb-2">Время сигнала (сек)</label>
                                <div className="flex items-center justify-between bg-gray-100 rounded-full px-4 py-3">
                                    <button
                                        onClick={() => setGreenDuration(Math.max(500, greenDuration - 500))}
                                        disabled={greenDuration <= 500 || phase !== 'idle'}
                                        className="w-8 h-8 rounded-full disabled:opacity-50 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center"
                                    >
                                        <span className="text-xl font-bold">−</span>
                                    </button>
                                    <span className="font-bold text-gray-800 text-xl">
                                        {(greenDuration / 1000).toFixed(1)}
                                    </span>
                                    <button
                                        onClick={() => setGreenDuration(Math.min(5000, greenDuration + 500))}
                                        disabled={greenDuration >= 5000 || phase !== 'idle'}
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
                                <span className="text-gray-500">Ср. время:</span>
                                <span className="font-bold text-gray-800">{avgReaction} мс</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Мин/Макс:</span>
                                <span className="font-bold text-gray-800">{minReaction}/{maxReaction} мс</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center - Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    {/* Timer Display */}
                    <div className="text-4xl font-mono font-bold text-blue-600 mb-8">
                        {(() => {
                            const displayTime = phase === 'idle' ? exerciseDuration : elapsedTime;
                            return `${Math.floor(displayTime / 60).toString().padStart(2, '0')}:${(displayTime % 60).toString().padStart(2, '0')}`;
                        })()}
                    </div>

                    {/* Indicator Circle */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm mb-8">
                        <div
                            className={`w-48 h-48 md:w-64 md:h-64 rounded-full border-[12px] transition-all duration-200 flex items-center justify-center ${indicatorActive
                                ? 'bg-green-400 border-green-600 shadow-lg shadow-green-200'
                                : 'bg-gray-100 border-gray-300'
                                }`}
                        >
                            {showCheckmark && <span className="text-green-600 text-6xl font-bold">✓</span>}
                            {showCross && <span className="text-red-500 text-6xl font-bold">✕</span>}
                            {!indicatorActive && !showCheckmark && !showCross && (
                                <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain opacity-20" />
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    {phase === 'idle' ? (
                        <div className="flex flex-col items-center gap-6">
                            {isLocked && requiredResult ? (
                                <>
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl shadow-lg inline-block">
                                        <p className="text-sm opacity-90">Цель упражнения:</p>
                                        <p className="text-xl font-bold">{formatRequiredResult(requiredResult, lockedParameters || undefined)}</p>
                                        {typeof lockedParameters?.duration !== 'undefined' && (
                                            <p className="text-sm opacity-90 mt-1">Время: {String(lockedParameters.duration)} сек</p>
                                        )}
                                    </div>
                                    <div className="mt-4 text-gray-500">Нажмите "Начать тест"</div>
                                </>
                            ) : (
                                <button
                                    onClick={startTest}
                                    className="w-48 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-lg shadow-lg transition-all transform active:scale-95"
                                >
                                    НАЧАТЬ ТЕСТ
                                </button>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={handleClick}
                            className={`w-full max-w-md px-8 py-4 rounded-full font-bold text-xl shadow-lg transition-all transform active:scale-95 ${buttonPressed
                                ? "bg-green-500 text-white"
                                : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white"
                                }`}
                        >
                            НАЖАТЬ
                        </button>
                    )}
                </div>

                {/* Right Panel - History */}
                <div className="w-72 bg-white border-l border-gray-200 p-6">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <History size={18} />
                        История попыток
                    </h3>
                    {history.length === 0 ? (
                        <p className="text-gray-400 text-sm">Нет попыток</p>
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
                                    <span className="text-gray-500">Ср. скорость:</span>
                                    <span className="font-bold text-blue-600">{avgReaction} мс</span>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {history.map((log, idx) => (
                                    <div
                                        key={idx}
                                        className={`text-sm px-3 py-2 rounded-lg ${log.outcome === 'hit'
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-red-50 text-red-700'
                                            }`}
                                    >
                                        #{history.length - idx}{' '}
                                        {log.outcome === 'hit' && `✓ ${log.rt} мс`}
                                        {log.outcome === 'miss' && "✕ Пропуск"}
                                        {log.outcome === 'false_start' && "✕ Фальстарт"}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Results Completion Banner - Full Screen */}
            {showResults && (() => {
                // Check if passed based on requiredResult (minValue = max allowed ms)
                const requiredAvgTime = requiredResult?.minValue ? Number(requiredResult.minValue) : null;
                const isPassed = !requiredAvgTime || avgReaction <= requiredAvgTime;

                return (
                    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-white flex items-center justify-center z-50 p-4">
                        <div className="text-center max-w-lg">
                            <div className="text-6xl mb-6">{isPassed ? '🎉' : '⏱️'}</div>
                            <div className={`${isPassed ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'} text-white px-8 py-6 rounded-xl shadow-lg inline-block mb-6`}>
                                <p className="text-2xl font-bold mb-2">
                                    {isPassed
                                        ? (hasNextExercise ? 'Упражнение завершено!' : 'Занятие завершено!')
                                        : 'Не уложились в норматив'}
                                </p>
                                <p className="text-lg opacity-90">
                                    {isPassed
                                        ? (hasNextExercise ? 'Отличная работа! Переходите к следующему упражнению.' : 'Поздравляем! Вы выполнили все упражнения.')
                                        : `Требуется: ≤${requiredAvgTime} мс. Ваш результат: ${avgReaction} мс`}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-left">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-sm text-gray-500">Правильных</div>
                                        <div className="text-2xl font-bold text-green-600">{correct}</div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-sm text-gray-500">Ошибок</div>
                                        <div className="text-2xl font-bold text-red-600">{errors}</div>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-sm text-gray-500">Точность</div>
                                        <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
                                    </div>
                                    <div className={`text-center p-3 ${isPassed ? 'bg-purple-50' : 'bg-orange-50'} rounded-lg`}>
                                        <div className="text-sm text-gray-500">Ср. время</div>
                                        <div className={`text-2xl font-bold ${isPassed ? 'text-purple-600' : 'text-orange-600'}`}>{avgReaction} мс</div>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col gap-3">
                                {isPassed ? (
                                    isLocked ? (
                                        <Link href={getNextPath()}>
                                            <button
                                                onClick={() => lockedCompleteExercise({ correct, errors, accuracy, avgReactionTime: avgReaction }, true)}
                                                className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
                                            >
                                                {hasNextExercise ? 'К следующему упражнению' : 'Вернуться в меню'}
                                                <ArrowRight size={20} />
                                            </button>
                                        </Link>
                                    ) : (
                                        <Link href={backPath}>
                                            <button className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all">
                                                Вернуться в меню
                                            </button>
                                        </Link>
                                    )
                                ) : (
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="w-full px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-lg transition-all"
                                    >
                                        Попробовать ещё раз
                                    </button>
                                )}
                                {isPassed && (
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all"
                                    >
                                        Пройти ещё раз
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
