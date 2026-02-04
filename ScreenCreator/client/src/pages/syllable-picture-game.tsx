import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, HelpCircle, X, Square, Settings, ArrowRight, RotateCcw, Trophy, Volume2 } from "lucide-react";
import { useLockedParams } from "@/hooks/useLockedParams";
import { WORD_DICTIONARY, getDistractors, getWordsBySyllableCount, WordEntry } from "@/lib/word-dictionary";

type Phase = 'idle' | 'speaking' | 'choosing' | 'correct' | 'wrong' | 'finished';

interface GameRecord {
    rounds: number;
    accuracy: number;
    avgReactionTime: number;
    timestamp: Date;
}

interface RoundResult {
    word: string;
    correct: boolean;
    reactionTime: number;
}

export default function SyllablePictureGame() {
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('syllable-picture');

    // Settings
    const [rounds, setRounds] = useState(5);
    const [syllableCount, setSyllableCount] = useState<2 | 3 | 4>(2);

    // Game state
    const [phase, setPhase] = useState<Phase>('idle');
    const [currentRound, setCurrentRound] = useState(0);
    const [currentWord, setCurrentWord] = useState<WordEntry | null>(null);
    const [options, setOptions] = useState<WordEntry[]>([]);
    const [currentSyllableIndex, setCurrentSyllableIndex] = useState(0);

    // Results
    const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
    const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);

    // Refs
    const reactionStartRef = useRef<number>(0);
    const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Modals
    const [showHelp, setShowHelp] = useState(false);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
            if (speakingTimeoutRef.current) {
                clearTimeout(speakingTimeoutRef.current);
            }
        };
    }, []);

    // Apply locked parameters
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.rounds !== undefined) setRounds(Number(lockedParameters.rounds));
            if (lockedParameters.syllableCount !== undefined) setSyllableCount(Number(lockedParameters.syllableCount) as 2 | 3 | 4);
        }
    }, [isLocked, lockedParameters]);

    // Filter words by syllable count
    const getFilteredWords = (): WordEntry[] => {
        return getWordsBySyllableCount(syllableCount);
    };

    // Phonetic corrections for Web Speech API pronunciation issues
    const getPhoneticText = (syllable: string): string => {
        const corrections: Record<string, string> = {
            'ПО': 'пoо',  // Stress the 'О' sound
            'БО': 'боо',
            'ВО': 'воо',
            'ГО': 'гоо',
            'ДО': 'доо',
            'ЗО': 'зоо',
            'КО': 'коо',
            'ЛО': 'лоо',
            'МО': 'моо',
            'НО': 'ноо',
            'РО': 'роо',
            'СО': 'соо',
            'ТО': 'тоо',
            'РЫ': 'рыы',  // Extend Ы sound
            'ГУ': 'гуу',  // Extend У sound
        };
        return corrections[syllable.toUpperCase()] || syllable.toLowerCase();
    };

    // Play syllable audio from pre-generated MP3 files
    const speakSyllable = (syllable: string): Promise<void> => {
        return new Promise((resolve) => {
            const audio = new Audio(`/syllables/${syllable.toLowerCase()}.mp3`);
            audio.onended = () => resolve();
            audio.onerror = () => {
                // Fallback to speech synthesis if MP3 not found
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const phoneticText = getPhoneticText(syllable);
                    const utterance = new SpeechSynthesisUtterance(phoneticText);
                    utterance.lang = 'ru-RU';
                    utterance.rate = 0.7;
                    utterance.onend = () => resolve();
                    utterance.onerror = () => resolve();
                    window.speechSynthesis.speak(utterance);
                } else {
                    resolve();
                }
            };
            audio.play().catch(() => resolve());
        });
    };

    // Speak word syllable by syllable
    const speakWordBySyllables = async (word: WordEntry) => {
        setPhase('speaking');
        setCurrentSyllableIndex(0);

        for (let i = 0; i < word.syllables.length; i++) {
            setCurrentSyllableIndex(i);
            await speakSyllable(word.syllables[i]);
            // Wait 1 second between syllables
            if (i < word.syllables.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Wait a moment then show options
        await new Promise(resolve => setTimeout(resolve, 500));
        setPhase('choosing');
        reactionStartRef.current = Date.now();
    };

    // Start a new round
    const startRound = () => {
        const filteredWords = getFilteredWords();
        if (filteredWords.length === 0) {
            // Fallback to all words if no words match
            const allWords = WORD_DICTIONARY;
            const word = allWords[Math.floor(Math.random() * allWords.length)];
            setCurrentWord(word);
            const distractors = getDistractors(word, 3);
            const allOptions = [word, ...distractors].sort(() => Math.random() - 0.5);
            setOptions(allOptions);
            speakWordBySyllables(word);
            return;
        }

        // Pick a random word
        const word = filteredWords[Math.floor(Math.random() * filteredWords.length)];
        setCurrentWord(word);

        // Get 3 distractors
        const distractors = getDistractors(word, 3);

        // Shuffle options
        const allOptions = [word, ...distractors].sort(() => Math.random() - 0.5);
        setOptions(allOptions);

        // Speak the word
        speakWordBySyllables(word);
    };

    // Handle option click
    const handleOptionClick = (selectedWord: WordEntry) => {
        if (phase !== 'choosing' || !currentWord) return;

        const reactionTime = Date.now() - reactionStartRef.current;
        const isCorrect = selectedWord.word === currentWord.word;

        const result: RoundResult = {
            word: currentWord.word,
            correct: isCorrect,
            reactionTime
        };
        setRoundResults(prev => [...prev, result]);

        if (isCorrect) {
            setPhase('correct');
            // Speak the word whole
            const utterance = new SpeechSynthesisUtterance(currentWord.word.toLowerCase());
            utterance.lang = 'ru-RU';
            window.speechSynthesis.speak(utterance);

            setTimeout(() => {
                const nextRound = currentRound + 1;
                if (nextRound >= rounds) {
                    finishGame();
                } else {
                    setCurrentRound(nextRound);
                    startRound();
                }
            }, 1500);
        } else {
            setPhase('wrong');
            setTimeout(() => {
                // Replay the syllables
                if (currentWord) {
                    speakWordBySyllables(currentWord);
                }
            }, 1000);
        }
    };

    // Finish game
    const finishGame = () => {
        const correctCount = roundResults.filter(r => r.correct).length;
        const totalAttempts = roundResults.length;
        const accuracy = totalAttempts > 0 ? Math.round((correctCount / rounds) * 100) : 0;
        const avgReactionTime = correctCount > 0
            ? Math.round(roundResults.filter(r => r.correct).reduce((sum, r) => sum + r.reactionTime, 0) / correctCount)
            : 0;

        const record: GameRecord = {
            rounds,
            accuracy,
            avgReactionTime,
            timestamp: new Date()
        };
        setGameHistory(prev => [...prev, record]);
        setPhase('finished');
    };

    // Start game
    const startGame = () => {
        setCurrentRound(0);
        setRoundResults([]);
        startRound();
    };

    // Stop game
    const stopGame = () => {
        window.speechSynthesis.cancel();
        if (speakingTimeoutRef.current) {
            clearTimeout(speakingTimeoutRef.current);
        }
        setPhase('idle');
        setCurrentWord(null);
        setOptions([]);
        setRoundResults([]);
    };

    // Reset game
    const resetGame = () => {
        stopGame();
    };

    // Calculate stats
    const correctCount = roundResults.filter(r => r.correct).length;
    const accuracy = rounds > 0 ? Math.round((correctCount / rounds) * 100) : 0;
    const avgReactionTime = correctCount > 0
        ? Math.round(roundResults.filter(r => r.correct).reduce((sum, r) => sum + r.reactionTime, 0) / correctCount)
        : 0;

    // Check if passed
    const requiredAccuracy = requiredResult?.minValue ? Number(requiredResult.minValue) : 80;
    const passed = accuracy >= requiredAccuracy;

    const isPlaying = phase !== 'idle' && phase !== 'finished';

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
                        <h1 className="text-xl font-bold text-gray-800">Слоги с картинками</h1>
                    </div>
                    <button
                        onClick={() => setShowHelp(true)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                    >
                        <HelpCircle size={24} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Left Sidebar */}
                <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
                    {/* Start/Stop Button */}
                    <button
                        onClick={isPlaying ? stopGame : startGame}
                        className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${!isPlaying
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                    >
                        {!isPlaying ? <Play size={18} /> : <Square size={18} />}
                        {!isPlaying ? 'Начать игру' : 'Остановить'}
                    </button>

                    {/* Settings */}
                    {!isLocked && !isPlaying && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings size={16} className="text-gray-500" />
                                <span className="font-medium text-gray-700">Настройки</span>
                            </div>

                            {/* Rounds */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2">Количество слов</label>
                                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => setRounds(Math.max(3, rounds - 1))}
                                        disabled={rounds <= 3}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >−</button>
                                    <span className="font-bold text-gray-800">{rounds}</span>
                                    <button
                                        onClick={() => setRounds(Math.min(15, rounds + 1))}
                                        disabled={rounds >= 15}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>

                            {/* Syllable Count */}
                            <div>
                                <label className="text-sm text-gray-500 block mb-2">Число слогов</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSyllableCount(2)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${syllableCount === 2 ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                                    >2</button>
                                    <button
                                        onClick={() => setSyllableCount(3)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${syllableCount === 3 ? 'bg-yellow-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                                    >3</button>
                                    <button
                                        onClick={() => setSyllableCount(4)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${syllableCount === 4 ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                                    >4</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress during game */}
                    {isPlaying && (
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                            <div className="text-sm text-blue-600 mb-1">Слово</div>
                            <div className="text-3xl font-bold text-blue-800">{currentRound + 1} / {rounds}</div>
                        </div>
                    )}
                </div>

                {/* Center - Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    {/* Idle State */}
                    {phase === 'idle' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-64 h-64 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-white">
                                <span className="text-6xl">🖼️</span>
                            </div>
                            <p className="text-gray-500 text-center max-w-md">
                                Слушайте слово по слогам, затем выберите правильную картинку!
                            </p>
                            <button
                                onClick={startGame}
                                className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all"
                            >
                                НАЧАТЬ ИГРУ
                            </button>
                        </div>
                    )}

                    {/* Speaking State */}
                    {phase === 'speaking' && currentWord && (
                        <div className="flex flex-col items-center gap-8">
                            <div className="text-center">
                                <div className="text-2xl text-gray-400 mb-4">Слушайте внимательно...</div>
                                <div className="flex items-center justify-center gap-4">
                                    {currentWord.syllables.map((syllable, idx) => (
                                        <div
                                            key={idx}
                                            className={`text-5xl font-bold transition-all ${idx === currentSyllableIndex
                                                ? 'text-blue-600 scale-125'
                                                : idx < currentSyllableIndex
                                                    ? 'text-gray-400'
                                                    : 'text-gray-300'
                                                }`}
                                        >
                                            {syllable}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Volume2 size={64} className="text-blue-500 animate-pulse" />
                        </div>
                    )}

                    {/* Choosing State */}
                    {(phase === 'choosing' || phase === 'correct' || phase === 'wrong') && (
                        <div className="flex flex-col items-center gap-8">
                            <div className="text-2xl text-gray-600 mb-4">
                                {phase === 'choosing' && 'Выберите картинку:'}
                                {phase === 'correct' && '✅ Правильно!'}
                                {phase === 'wrong' && '❌ Попробуйте ещё раз'}
                            </div>

                            {/* Grid takes 80% of available height, maintains square cards */}
                            <div
                                className="grid grid-cols-2 gap-4"
                                style={{
                                    width: 'min(70vh, 80vw)',
                                    height: 'min(70vh, 80vw)'
                                }}
                            >
                                {options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionClick(option)}
                                        disabled={phase !== 'choosing'}
                                        className={`
                                            aspect-square rounded-2xl overflow-hidden transition-all shadow-lg bg-white
                                            ${phase === 'choosing'
                                                ? 'hover:scale-105 hover:shadow-xl cursor-pointer border-4 border-transparent hover:border-blue-400'
                                                : 'cursor-default'}
                                            ${phase === 'correct' && option.word === currentWord?.word ? 'border-4 border-green-500 ring-4 ring-green-200' : ''}
                                            ${phase === 'wrong' && option.word === currentWord?.word ? 'border-4 border-green-500' : ''}
                                        `}
                                    >
                                        <img
                                            src={`/word-images/${option.image}`}
                                            alt={option.word}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Finished State */}
                    {phase === 'finished' && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                {passed ? (
                                    <div className="bg-green-100 p-6 rounded-full">
                                        <Trophy className="w-20 h-20 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="bg-orange-100 p-6 rounded-full">
                                        <RotateCcw className="w-20 h-20 text-orange-600" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    {passed ? "Отлично!" : "Хорошая попытка!"}
                                </h2>
                                <p className="text-xl text-gray-600">
                                    Точность: <span className="font-bold text-blue-600">{accuracy}%</span>
                                </p>
                                <p className="text-gray-500 mt-2">
                                    {correctCount} из {rounds} слов угадано
                                </p>
                                {avgReactionTime > 0 && (
                                    <p className="text-gray-500">
                                        Среднее время: <span className="font-bold">{avgReactionTime} мс</span>
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all"
                                >
                                    <RotateCcw size={18} className="inline mr-2" />
                                    Ещё раз
                                </button>
                                {isLocked && passed && (
                                    <Link href={getNextPath()}>
                                        <button
                                            onClick={() => {
                                                lockedCompleteExercise({ correctCount, totalAttempts: roundResults.length, accuracy, avgReactionTime }, true);
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
                        <Trophy size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-700">История игр</span>
                    </div>

                    {gameHistory.length === 0 ? (
                        <p className="text-gray-400 text-sm">Нет завершённых игр</p>
                    ) : (
                        <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                            {gameHistory.slice().reverse().map((game, i) => (
                                <div
                                    key={i}
                                    className={`p-4 rounded-xl text-sm border ${game.accuracy >= 80
                                        ? 'bg-green-50 border-green-200'
                                        : game.accuracy >= 60
                                            ? 'bg-yellow-50 border-yellow-200'
                                            : 'bg-red-50 border-red-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-500 text-xs">Игра #{gameHistory.length - i}</span>
                                        <span className={`font-bold text-lg ${game.accuracy >= 80 ? 'text-green-600' :
                                            game.accuracy >= 60 ? 'text-yellow-600' : 'text-red-500'
                                            }`}>
                                            {game.accuracy}%
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Слов:</span>
                                            <span className="font-medium">{game.rounds}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Ср. время:</span>
                                            <span className="font-medium">{game.avgReactionTime} мс</span>
                                        </div>
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
                            <p><strong>Цель:</strong> Тренировка восприятия слогов и связи слова с изображением.</p>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Слово произносится по слогам с паузой в 1 секунду</li>
                                <li>После произнесения появляются 4 картинки</li>
                                <li>Выберите картинку, соответствующую слову</li>
                                <li>При ошибке слово повторяется снова</li>
                            </ul>
                            <p><strong>Число слогов:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>2 слога — мама, папа, коза</li>
                                <li>3 слога — собака, ракета, машина</li>
                                <li>4 слога — велосипед, черепаха</li>
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
        </div>
    );
}
