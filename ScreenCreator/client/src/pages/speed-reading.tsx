import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Plus, Minus, Play, Square, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { getWordsByLength } from "@/data/russian-words";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";

interface Attempt {
    attemptNumber: number;
    letterCount: number;
    displayTime: number;
    wordsShown: number;
}

const RUSSIAN_VOWELS = ['а', 'е', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я', 'А', 'Е', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я'];

const getHighlightIndex = (word: string): number => {
    const len = word.length;

    if (len % 2 === 1) {
        // Odd: center letter
        return Math.floor(len / 2);
    } else {
        // Even: nearest vowel to center
        const center = len / 2;
        let closestVowelIndex = -1;
        let closestDistance = Infinity;

        for (let i = 0; i < len; i++) {
            if (RUSSIAN_VOWELS.includes(word[i])) {
                const distance = Math.abs(i - center);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestVowelIndex = i;
                }
            }
        }

        return closestVowelIndex >= 0 ? closestVowelIndex : Math.floor(center - 0.5);
    }
};

export default function SpeedReading() {
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('speed-reading');

    // Settings
    const [letterCount, setLetterCount] = useState(5);
    const [displayTime, setDisplayTime] = useState(0.5); // seconds
    const [fontSize, setFontSize] = useState(6); // rem
    const [exerciseDuration, setExerciseDuration] = useState(0); // seconds, 0 = unlimited (counts up)

    // Game state
    const [isRunning, setIsRunning] = useState(false);
    const [currentWord, setCurrentWord] = useState("");
    const [wordIndex, setWordIndex] = useState(0);
    const [words, setWords] = useState<string[]>([]);
    const [wordsShown, setWordsShown] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0); // For count-up timer when unlimited
    const [exerciseCompleted, setExerciseCompleted] = useState(false);

    // We keep track of attempts internally even if not showing a list to keep logic
    const [attempts, setAttempts] = useState<Attempt[]>([]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // Load words when letter count changes
    useEffect(() => {
        // Always random mode as per previous iterations
        const wordList = getWordsByLength(letterCount);
        const shuffled = [...wordList].sort(() => Math.random() - 0.5);
        setWords(shuffled);
        setWordIndex(0);
    }, [letterCount]);

    // Show next word
    const showNextWord = useCallback(() => {
        if (words.length === 0) return;

        const nextIndex = (wordIndex + 1) % words.length;
        setWordIndex(nextIndex);
        setCurrentWord(words[nextIndex]);
        setWordsShown(prev => prev + 1);
    }, [words, wordIndex]);

    // Start game
    const handleStart = () => {
        if (words.length === 0) return;

        setIsRunning(true);
        setWordIndex(0);
        setCurrentWord(words[0]);
        setWordsShown(1);
        setElapsedTime(0);

        timerRef.current = setInterval(() => {
            showNextWord();
        }, displayTime * 1000);

        // Start countdown if duration is set, otherwise count up
        if (exerciseDuration > 0) {
            setTimeRemaining(exerciseDuration);
            countdownRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleTimeUp();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            // Unlimited mode - count up
            countdownRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
    };

    // Handle time up
    const handleTimeUp = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
        setIsRunning(false);

        // Complete exercise if locked
        if (isLocked) {
            handleCompleteExercise();
        }
    };

    // Complete exercise for locked mode
    const handleCompleteExercise = async () => {
        const result = {
            wordsShown,
            letterCount,
            displayTime,
        };
        await lockedCompleteExercise(result, true);
        setExerciseCompleted(true);
    };

    // Stop game
    const handleStop = () => {
        setIsRunning(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
        // Save attempt
        if (wordsShown > 0) {
            setAttempts(prev => [...prev, {
                attemptNumber: prev.length + 1,
                letterCount,
                displayTime,
                wordsShown
            }]);
        }
        setCurrentWord("");
        setWordsShown(0);
        setTimeRemaining(0);
    };

    // Apply locked parameters
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.duration !== undefined) {
                setExerciseDuration(Number(lockedParameters.duration));
            }
            if (lockedParameters.letterCount !== undefined) {
                setLetterCount(Number(lockedParameters.letterCount));
            }
            if (lockedParameters.displayTime !== undefined) {
                setDisplayTime(Number(lockedParameters.displayTime));
            }
        }
    }, [isLocked, lockedParameters]);

    // Update timer when displayTime changes while running
    useEffect(() => {
        if (isRunning && timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                showNextWord();
            }, displayTime * 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [displayTime, isRunning, showNextWord]);

    return (
        <div className="min-h-screen flex flex-col relative bg-white">
            {/* Exercise Completed Overlay */}
            {exerciseCompleted && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Упражнение завершено!</h2>
                        <p className="text-gray-600 mb-4">Показано слов: {wordsShown}</p>
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

            {/* Top Control Bar */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0 z-10 shadow-sm transition-colors duration-300 relative">
                <div className="flex items-center justify-center h-full relative">

                    {/* LEFT: Back Button and Title - Absolutely positioned */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        <Link href={backPath}>
                            <button className="p-2 rounded-full transition-all hover:bg-gray-100 text-gray-500" data-testid="button-back">
                                <ArrowLeft size={24} />
                            </button>
                        </Link>
                        <h1 className="text-xl font-bold text-gray-800">Турбочтение</h1>
                    </div>

                    {/* RIGHT: Timer Display - Absolutely positioned */}
                    {isRunning && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-100 px-5 py-2.5 rounded-xl">
                            <span className="text-2xl font-bold text-blue-600 font-mono tracking-wider">
                                {exerciseDuration > 0
                                    ? `${Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:${(timeRemaining % 60).toString().padStart(2, '0')}`
                                    : `${Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:${(elapsedTime % 60).toString().padStart(2, '0')}`
                                }
                            </span>
                        </div>
                    )}

                    {/* CENTERED GROUP: Controls & Settings */}
                    <div className="flex items-end gap-6">
                        {/* Toggle Start/Stop Button */}
                        <div className="flex flex-col gap-1 items-center">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                                Управление
                            </span>
                            <button
                                onClick={isRunning ? handleStop : handleStart}
                                disabled={words.length === 0}
                                className={`h-[42px] px-6 text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none flex items-center justify-center gap-2 ${isRunning
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                data-testid="button-toggle-reading"
                            >
                                {isRunning ? (
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

                        {/* Letter Count Control - Hidden when locked */}
                        {!isLocked && !isRunning && (
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Букв</span>
                                <div className="flex items-center rounded-lg border p-1.5 bg-white border-gray-200 h-[42px]">
                                    <button
                                        onClick={() => setLetterCount(Math.max(3, letterCount - 1))}
                                        disabled={letterCount <= 3}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-14 text-center font-bold text-base text-gray-800">
                                        {letterCount}
                                    </span>
                                    <button
                                        onClick={() => setLetterCount(Math.min(8, letterCount + 1))}
                                        disabled={letterCount >= 8}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Speed Control - Hidden when locked */}
                        {!isLocked && !isRunning && (
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Скорость</span>
                                <div className="flex items-center rounded-lg border p-1.5 bg-white border-gray-200 h-[42px]">
                                    <button
                                        onClick={() => setDisplayTime(Math.max(0.1, Math.round((displayTime - 0.1) * 10) / 10))}
                                        disabled={displayTime <= 0.1}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-14 text-center font-bold text-base text-gray-800">
                                        {displayTime}
                                    </span>
                                    <button
                                        onClick={() => setDisplayTime(Math.min(3, Math.round((displayTime + 0.1) * 10) / 10))}
                                        disabled={displayTime >= 3}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Font Control - Hidden when locked */}
                        {!isLocked && !isRunning && (
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Шрифт</span>
                                <div className="flex items-center rounded-lg border p-1.5 bg-white border-gray-200 h-[42px]">
                                    <button
                                        onClick={() => setFontSize(Math.max(2, fontSize - 1))}
                                        disabled={fontSize <= 2}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <div className="text-xs font-bold">A-</div>
                                    </button>
                                    <span className="w-14 text-center font-bold text-base text-gray-800">
                                        {fontSize}
                                    </span>
                                    <button
                                        onClick={() => setFontSize(Math.min(15, fontSize + 1))}
                                        disabled={fontSize >= 15}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <div className="text-xs font-bold">A+</div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Duration Control - Hidden when locked */}
                        {!isLocked && !isRunning && (
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Время (сек)</span>
                                <div className="flex items-center rounded-lg border p-1.5 bg-white border-gray-200 h-[42px]">
                                    <button
                                        onClick={() => setExerciseDuration(Math.max(0, exerciseDuration - 30))}
                                        disabled={exerciseDuration <= 0}
                                        className="p-2 rounded disabled:opacity-50 transition-colors hover:bg-gray-100 text-gray-600"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-14 text-center font-bold text-base text-gray-800">
                                        {exerciseDuration === 0 ? '∞' : exerciseDuration}
                                    </span>
                                    <button
                                        onClick={() => setExerciseDuration(exerciseDuration + 30)}
                                        disabled={exerciseDuration >= 600}
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

            {/* Main Content - Large word display area */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-white">
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.16] pointer-events-none select-none">
                    <img src="/logo.png" alt="Logo" className="w-1/3 max-w-md object-contain" />
                </div>

                {currentWord && (() => {
                    const highlightIndex = getHighlightIndex(currentWord);
                    const before = currentWord.slice(0, highlightIndex);
                    const highlighted = currentWord[highlightIndex];
                    const after = currentWord.slice(highlightIndex + 1);

                    return (
                        <div
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transform: `translateY(-50%) translateX(calc(-50% - ${highlightIndex}ch + 1.5ch))`,
                                fontSize: `${fontSize}rem`,
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                lineHeight: 1,
                            }}
                            className="text-gray-900 z-10"
                        >
                            <span>{before}</span>
                            <span className="text-red-600">{highlighted}</span>
                            <span>{after}</span>
                        </div>
                    );
                })()}
                {!currentWord && (
                    isLocked && !isRunning ? (
                        /* Locked mode: show goal banner centered */
                        <div className="text-center">
                            <div className="text-6xl mb-4">🎯</div>
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl shadow-lg inline-block">
                                <p className="text-sm opacity-90">Цель упражнения:</p>
                                <p className="text-xl font-bold">Тренировка скоростного чтения</p>
                                <p className="text-sm opacity-90 mt-2">Время: {Math.floor(exerciseDuration / 60)}:{(exerciseDuration % 60).toString().padStart(2, '0')} ({exerciseDuration} сек)</p>
                            </div>
                            <div className="mt-4 text-gray-500">Нажмите "Начать"</div>
                        </div>
                    ) : (
                        <div className="text-3xl font-medium text-gray-500">
                            {isRunning ? "Загрузка..." : "Нажмите Начать"}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
