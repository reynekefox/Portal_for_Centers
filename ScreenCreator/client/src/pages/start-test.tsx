import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Clock, CheckCircle, HelpCircle, X, ArrowRight, Minus, Plus, Square } from "lucide-react";
import { useLessonConfig } from "@/hooks/use-lesson-config";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";

// Constants
type Phase = 'idle' | 'training' | 'test';

export default function Attention66Test() {
    const { config, isLessonMode, timeRemaining, isTimeUp, completeExercise } = useLessonConfig();
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('start-test');

    const [phase, setPhase] = useState<Phase>('idle');
    const [step, setStep] = useState(0);
    const [totalSteps, setTotalSteps] = useState(0);
    const [exerciseCompleted, setExerciseCompleted] = useState(false);

    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [showNumber, setShowNumber] = useState(false);
    const [showYellowCover, setShowYellowCover] = useState(true);
    const [showCheckmark, setShowCheckmark] = useState(false);
    const [showCross, setShowCross] = useState(false);
    const [dotsVisible, setDotsVisible] = useState([false, false, false]);
    const [showDots, setShowDots] = useState(false);

    const [correctClicks, setCorrectClicks] = useState(0);
    const [errors, setErrors] = useState(0);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);

    // Configurable parameters
    const [reactionTimeLimit, setReactionTimeLimit] = useState(1000); // ms
    const [trainingDuration, setTrainingDuration] = useState(0); // seconds, 0 = unlimited (counts up)
    const [trainingTimeLeft, setTrainingTimeLeft] = useState(0); // countdown
    const [elapsedTime, setElapsedTime] = useState(0); // count-up timer for unlimited mode

    const [showStartModal, setShowStartModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showReadyModal, setShowReadyModal] = useState(false);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const canClick = useRef(false);
    const numberShownAt = useRef(0);
    const roundTimeout = useRef<NodeJS.Timeout | null>(null);
    const yellowTimeout = useRef<NodeJS.Timeout | null>(null);
    const trainingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const phaseRef = useRef(phase);
    const stepRef = useRef(0);
    const totalStepsRef = useRef(0);
    const showingFeedback = useRef(false);
    const currentNumberRef = useRef<number | null>(null);

    const trainingSteps = 10;
    const testSteps = 66;

    useEffect(() => { phaseRef.current = phase; }, [phase]);
    useEffect(() => { stepRef.current = step; }, [step]);
    useEffect(() => { totalStepsRef.current = totalSteps; }, [totalSteps]);

    // Handle time up in lesson mode
    useEffect(() => {
        if (isTimeUp && isLessonMode && phase === 'test') {
            handleCompleteExercise();
        }
    }, [isTimeUp, isLessonMode, phase]);

    // Handle timer reaching 0 - show results (only for countdown mode)
    useEffect(() => {
        if (trainingDuration > 0 && trainingTimeLeft === 0 && phase !== 'idle') {
            // Stop all rounds
            if (roundTimeout.current) clearTimeout(roundTimeout.current);
            if (yellowTimeout.current) clearTimeout(yellowTimeout.current);
            if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);
            canClick.current = false;
            // Stop the exercise
            setPhase('idle');
            // Show results
            setShowResultsModal(true);
        }
    }, [trainingTimeLeft, phase, trainingDuration]);

    const handleCompleteExercise = async () => {
        if (!isLessonMode) return;

        const result = {
            correctClicks,
            errors,
            accuracy: totalAttempts > 0 ? Math.round((correctClicks / totalAttempts) * 100) : 0,
            avgReactionTime: reactionTimes.length > 0
                ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length * 1000)
                : 0,
            stepsCompleted: step,
        };

        if (roundTimeout.current) clearTimeout(roundTimeout.current);
        if (yellowTimeout.current) clearTimeout(yellowTimeout.current);

        const success = await completeExercise(result);
        if (success) {
            setExerciseCompleted(true);
        }
    };

    const hideAll = () => {
        setDotsVisible([false, false, false]);
        setShowDots(false);
        setShowNumber(false);
        setShowCheckmark(false);
        setShowCross(false);
    };

    function showDotsCountdown(onComplete: () => void) {
        setShowYellowCover(false);
        setShowDots(true);
        setDotsVisible([false, false, false]);

        let dotIndex = 0;
        const dotInterval = setInterval(() => {
            if (dotIndex < 3) {
                setDotsVisible(prev => {
                    const newDots = [...prev];
                    newDots[dotIndex] = true;
                    return newDots;
                });
                dotIndex++;
            } else {
                clearInterval(dotInterval);
                setTimeout(() => {
                    // CRITICAL: Hide dots BEFORE showing number
                    setShowDots(false);
                    setDotsVisible([false, false, false]);
                    onComplete();
                }, 200);
            }
        }, 250);
    }

    function checkIfPhaseComplete() {
        if (stepRef.current >= totalStepsRef.current) {
            if (phaseRef.current === 'training') {
                // Skip modal, go straight to test
                startMainTest();
            } else {
                // Test complete - stop everything
                if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);
                setPhase('idle');
                setShowResultsModal(true);
            }
        } else {
            runRound();
        }
    }

    function proceedToNext() {
        setShowNumber(false);
        setShowYellowCover(true);
        setStep(prev => {
            const next = prev + 1;
            stepRef.current = next;
            return next;
        });

        setTimeout(() => {
            checkIfPhaseComplete();
        }, 500);
    }

    function showFeedback(isCorrect: boolean) {
        showingFeedback.current = true;
        setShowNumber(false);
        setShowDots(false);  // Ensure dots hidden
        setShowYellowCover(false);

        if (isCorrect) {
            setShowCheckmark(true);
        } else {
            setShowCross(true);
        }

        setStep(prev => {
            const next = prev + 1;
            stepRef.current = next;
            return next;
        });

        setTimeout(() => {
            setShowCheckmark(false);
            setShowCross(false);
            showingFeedback.current = false;
            setShowYellowCover(true);

            setTimeout(() => {
                checkIfPhaseComplete();
            }, 400);
        }, 300);
    }

    function handleTimeout() {
        canClick.current = false;
        if (yellowTimeout.current) clearTimeout(yellowTimeout.current);

        const num = currentNumberRef.current;
        if (num === 3) {
            // Correct - correctly did NOT click on 3 (waited out the timer)
            setCorrectClicks(prev => prev + 1);
            showFeedback(true);
        } else {
            // Error - should have clicked on non-3 number but didn't
            setErrors(prev => prev + 1);
            showFeedback(false);
        }
    }

    function showNumberDisplay() {
        let num: number;
        if (Math.random() < 0.25) {
            num = 3;
        } else {
            const nums = [1, 2, 4, 5, 6, 7, 8, 9];
            num = nums[Math.floor(Math.random() * nums.length)];
        }

        currentNumberRef.current = num;
        setCurrentNumber(num);
        setShowDots(false);  // Ensure dots are hidden
        setShowNumber(true);
        setShowYellowCover(false);

        canClick.current = true;
        numberShownAt.current = performance.now();

        yellowTimeout.current = setTimeout(() => {
            setShowYellowCover(true);
        }, 300);

        roundTimeout.current = setTimeout(() => {
            if (canClick.current) {
                handleTimeout();
            }
        }, reactionTimeLimit);
    }

    function runRound() {
        if (phaseRef.current === 'idle') return;

        canClick.current = false;
        showingFeedback.current = false;
        if (roundTimeout.current) clearTimeout(roundTimeout.current);
        if (yellowTimeout.current) clearTimeout(yellowTimeout.current);

        hideAll();
        showDotsCountdown(showNumberDisplay);
    }

    const handleClick = () => {
        if (!canClick.current || showingFeedback.current) return;

        if (roundTimeout.current) clearTimeout(roundTimeout.current);
        if (yellowTimeout.current) clearTimeout(yellowTimeout.current);
        canClick.current = false;

        const reactionTime = (performance.now() - numberShownAt.current) / 1000;
        const num = currentNumberRef.current;

        if (num === 3) {
            // Error - clicked on 3
            setErrors(prev => prev + 1);
            // Show cross feedback like regular error, then continue
            showFeedback(false);
        } else {
            // Correct - clicked on non-3
            setCorrectClicks(prev => prev + 1);
            setReactionTimes(prev => [...prev, reactionTime]);
            showFeedback(true);
        }
    };

    const startTraining = () => {
        setShowStartModal(false);
        setPhase('training');
        setStep(0);
        stepRef.current = 0;
        setTotalSteps(trainingSteps);
        totalStepsRef.current = trainingSteps;
        setCorrectClicks(0);
        setErrors(0);
        setReactionTimes([]);
        setElapsedTime(0);

        if (trainingDuration > 0) {
            // Countdown mode
            setTrainingTimeLeft(trainingDuration);
            trainingTimerRef.current = setInterval(() => {
                setTrainingTimeLeft(prev => {
                    if (prev <= 1) {
                        if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            // Unlimited mode - count up
            trainingTimerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }

        setTimeout(runRound, 500);
    };

    const restartTraining = () => {
        setShowErrorModal(false);
        setStep(0);
        stepRef.current = 0;
        setCorrectClicks(0);
        setErrors(0);
        setElapsedTime(0);

        // Restart timer
        if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);

        if (trainingDuration > 0) {
            // Countdown mode
            setTrainingTimeLeft(trainingDuration);
            trainingTimerRef.current = setInterval(() => {
                setTrainingTimeLeft(prev => {
                    if (prev <= 1) {
                        if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            // Unlimited mode - count up
            trainingTimerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }

        setTimeout(runRound, 500);
    };

    const repeatTraining = () => {
        setShowReadyModal(false);
        setPhase('training');
        setStep(0);
        stepRef.current = 0;
        setTotalSteps(trainingSteps);
        totalStepsRef.current = trainingSteps;
        setCorrectClicks(0);
        setErrors(0);
        setElapsedTime(0);

        // Restart timer
        if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);

        if (trainingDuration > 0) {
            // Countdown mode
            setTrainingTimeLeft(trainingDuration);
            trainingTimerRef.current = setInterval(() => {
                setTrainingTimeLeft(prev => {
                    if (prev <= 1) {
                        if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            // Unlimited mode - count up
            trainingTimerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }

        setTimeout(runRound, 500);
    };

    const startMainTest = () => {
        setShowReadyModal(false);
        setPhase('test');
        setStep(0);
        stepRef.current = 0;
        setTotalSteps(testSteps);
        totalStepsRef.current = testSteps;
        // Don't reset stats - continue accumulating from training

        // Keep timer running (don't stop it)

        setTimeout(runRound, 500);
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                event.preventDefault();
                handleClick();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            if (roundTimeout.current) clearTimeout(roundTimeout.current);
            if (yellowTimeout.current) clearTimeout(yellowTimeout.current);
            if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);
        };
    }, []);

    // Results calculation (moved before useEffect that uses it)
    const totalAttempts = correctClicks + errors;
    const accuracyPercent = totalAttempts > 0 ? Math.round((correctClicks / totalAttempts) * 100) : 0;
    const avgRT = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length * 1000)
        : 0;

    return (
        <div className="min-h-screen bg-white flex flex-col">
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
                        <h1 className="text-xl font-bold text-gray-800">Start-тест</h1>
                    </div>

                    {/* RIGHT: Timer Display - Absolutely positioned */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        {isLessonMode && (
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                                📚 Занятие
                            </span>
                        )}
                        <div className="bg-gray-100 px-5 py-2.5 rounded-xl">
                            <span className="text-2xl font-bold text-blue-600 font-mono tracking-wider">
                                {trainingDuration > 0
                                    ? `${Math.floor(trainingTimeLeft / 60).toString().padStart(2, '0')}:${(trainingTimeLeft % 60).toString().padStart(2, '0')}`
                                    : `${Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:${(elapsedTime % 60).toString().padStart(2, '0')}`
                                }
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
                                onClick={phase === 'idle' ? startTraining : () => window.location.reload()}
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

                        {/* Training Duration Control - Hidden when locked or running */}
                        {!isLocked && phase === 'idle' && (
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Время</span>
                                <div className="flex items-center rounded-lg border p-1.5 bg-white border-gray-200 h-[42px]">
                                    <button
                                        onClick={() => {
                                            if (trainingDuration === 0) return;
                                            const val = trainingDuration <= 30 ? 0 : trainingDuration - 30;
                                            setTrainingDuration(val);
                                        }}
                                        disabled={trainingDuration === 0}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-14 text-center font-bold text-base text-gray-800">
                                        {trainingDuration === 0 ? '∞' : trainingDuration}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const val = trainingDuration === 0 ? 60 : Math.min(300, trainingDuration + 30);
                                            setTrainingDuration(val);
                                        }}
                                        disabled={trainingDuration >= 300}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Reaction Time Control - Hidden when locked or running */}
                        {!isLocked && phase === 'idle' && (
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Реакция</span>
                                <div className="flex items-center rounded-lg border p-1.5 bg-white border-gray-200 h-[42px]">
                                    <button
                                        onClick={() => setReactionTimeLimit(Math.max(500, reactionTimeLimit - 100))}
                                        disabled={reactionTimeLimit <= 500}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-14 text-center font-bold text-base text-gray-800">
                                        {(reactionTimeLimit / 1000).toFixed(1)}
                                    </span>
                                    <button
                                        onClick={() => setReactionTimeLimit(Math.min(3000, reactionTimeLimit + 100))}
                                        disabled={reactionTimeLimit >= 3000}
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

            {/* Stats Bar */}
            <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Верно:</span>
                    <span className="font-bold text-green-600">{correctClicks}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Ошибки:</span>
                    <span className="font-bold text-red-600">{errors}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Точность:</span>
                    <span className="font-bold text-blue-600">{accuracyPercent}%</span>
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
                            <p><strong>Цель:</strong> Нажмите пробел, когда появится число, кроме цифры 3.</p>
                            <p><strong>Управление:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Клавиша <kbd className="px-2 py-1 bg-gray-100 rounded">Пробел</kbd> — реакция</li>
                            </ul>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Дождитесь появления числа в круге</li>
                                <li><strong className="text-red-600">НЕ нажимайте, если видите цифру 3!</strong></li>
                                <li>Успейте нажать за отведённое время</li>
                                <li>Реагируйте как можно быстрее</li>
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

            {/* Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
                {/* Circle Display */}
                <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                    {/* Yellow Cover */}
                    {showYellowCover && (
                        <div className="absolute inset-2 rounded-full bg-yellow-400" />
                    )}

                    {/* Dots */}
                    {showDots && (
                        <div className="absolute inset-0 flex items-center justify-center gap-3">
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full transition-opacity ${dotsVisible[i] ? 'bg-blue-600 opacity-100' : 'bg-gray-400 opacity-30'
                                        }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Number Display */}
                    {showNumber && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl md:text-8xl font-bold text-blue-600">
                                {currentNumber}
                            </span>
                        </div>
                    )}

                    {/* Feedback */}
                    {showCheckmark && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl text-green-500 font-bold">✓</span>
                        </div>
                    )}
                    {showCross && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl text-red-500 font-bold">✕</span>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <button
                    onClick={phase === 'idle' ? startTraining : handleClick}
                    className="w-48 h-16 md:w-64 md:h-20 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xl shadow-lg transition-all transform active:scale-95"
                >
                    {phase === 'idle' ? 'НАЧАТЬ ТЕСТ' : 'НАЖАТЬ'}
                </button>
            </div>

            {/* Start Modal */}
            {
                showStartModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800">Обучение</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-gray-600">
                                    Нажмите на кнопку как можно скорее, когда увидите число, отличное от числа <strong>3</strong>.
                                </p>
                                <p className="text-gray-600 font-semibold">
                                    Если появится цифра <strong>3</strong> — <strong>НЕ нажимайте!</strong>
                                </p>
                            </div>
                            <div className="border-t border-gray-200 p-6">
                                <button
                                    onClick={startTraining}
                                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Play size={20} /> Начать
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Error Modal */}
            {
                showErrorModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-red-500">Неверный ответ</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-600">
                                    Не нажимайте кнопку, когда увидите цифру <strong>3</strong>.
                                    <br /><br />
                                    Обучение начнётся заново.
                                </p>
                            </div>
                            <div className="border-t border-gray-200 p-6">
                                <button
                                    onClick={restartTraining}
                                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all"
                                >
                                    Начать заново
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Ready Modal */}
            {
                showReadyModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800">Вы готовы начать тест?</h2>
                            </div>
                            <div className="border-t border-gray-200 p-6 flex gap-3">
                                <button
                                    onClick={startMainTest}
                                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-full font-bold hover:bg-gray-300 transition-all"
                                >
                                    Да, начать тест
                                </button>
                                <button
                                    onClick={repeatTraining}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all"
                                >
                                    Нет, попрактиковаться
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Results Modal */}
            {
                showResultsModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-800">Результаты</h2>
                            </div>
                            <div className="p-6 space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Правильных ответов:</span>
                                    <span className="font-bold text-gray-800">{correctClicks} / {testSteps}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Ошибок:</span>
                                    <span className="font-bold text-gray-800">{errors}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Точность:</span>
                                    <span className="font-bold text-gray-800">{accuracyPercent}%</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-600">Среднее время реакции:</span>
                                    <span className="font-bold text-gray-800">{avgRT} мс</span>
                                </div>
                            </div>
                            <div className="border-t border-gray-200 p-6 space-y-3">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-bold transition-all"
                                >
                                    Пройти ещё раз
                                </button>
                                {isLocked && accuracyPercent >= 80 && (
                                    <Link href={getNextPath()}>
                                        <button
                                            onClick={() => lockedCompleteExercise({ correctClicks, errors, accuracyPercent, avgRT }, true)}
                                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg transition-all flex items-center justify-center gap-2"
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
