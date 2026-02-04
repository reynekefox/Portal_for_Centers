import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, HelpCircle, X, Square, Settings, ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { useLockedParams } from "@/hooks/useLockedParams";

type Phase = 'idle' | 'playing' | 'finished';

// Individual click during current game (not persisted to history)
interface ClickRecord {
    syllable: string;
    correct: boolean;
    reactionTime: number; // ms
}

// Full game session record (persisted to history)
interface GameRecord {
    rounds: number;
    accuracy: number; // %
    avgReactionTime: number; // ms
    errors: number;
    timestamp: Date;
}

// Simple Russian syllables (consonant + vowel)
const SYLLABLES = [
    'БА', 'БО', 'БУ', 'БЫ', 'БИ', 'БЕ',
    'ВА', 'ВО', 'ВУ', 'ВЫ', 'ВИ', 'ВЕ',
    'ГА', 'ГО', 'ГУ', 'ГИ', 'ГЕ',
    'ДА', 'ДО', 'ДУ', 'ДЫ', 'ДИ', 'ДЕ',
    'ЖА', 'ЖО', 'ЖУ', 'ЖИ', 'ЖЕ',
    'ЗА', 'ЗО', 'ЗУ', 'ЗЫ', 'ЗИ', 'ЗЕ',
    'КА', 'КО', 'КУ', 'КИ', 'КЕ',
    'ЛА', 'ЛО', 'ЛУ', 'ЛЫ', 'ЛИ', 'ЛЕ',
    'МА', 'МО', 'МУ', 'МЫ', 'МИ', 'МЕ',
    'НА', 'НО', 'НУ', 'НЫ', 'НИ', 'НЕ',
    'ПА', 'ПО', 'ПУ', 'ПЫ', 'ПИ', 'ПЕ',
    'РА', 'РО', 'РУ', 'РЫ', 'РИ', 'РЕ',
    'СА', 'СО', 'СУ', 'СЫ', 'СИ', 'СЕ',
    'ТА', 'ТО', 'ТУ', 'ТЫ', 'ТИ', 'ТЕ',
    'ФА', 'ФО', 'ФУ', 'ФИ', 'ФЕ',
    'ХА', 'ХО', 'ХУ', 'ХИ', 'ХЕ',
    'ША', 'ШО', 'ШУ', 'ШИ', 'ШЕ',
];

export default function FastSyllables() {
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('fast-syllables');

    // Settings
    const [rounds, setRounds] = useState(3);
    const [shuffle, setShuffle] = useState(false);
    const [gridSize, setGridSize] = useState(9); // Number of syllables per round

    // Grid display order
    const [gridSyllables, setGridSyllables] = useState<string[]>([]);

    // Game state
    const [phase, setPhase] = useState<Phase>('idle');
    const [currentRound, setCurrentRound] = useState(0);
    const [remainingSyllables, setRemainingSyllables] = useState<string[]>([]);
    const [currentSyllable, setCurrentSyllable] = useState<string | null>(null);

    // Current game session clicks (reset each game)
    const [currentClicks, setCurrentClicks] = useState<ClickRecord[]>([]);

    // History of completed game sessions
    const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);

    // Modals
    const [showHelp, setShowHelp] = useState(false);

    // Refs
    const digitStartTimeRef = useRef<number>(0);
    const voicesLoadedRef = useRef<boolean>(false);

    // Error flash state
    const [errorFlashSyllable, setErrorFlashSyllable] = useState<string | null>(null);

    // Get available voices
    const getVoice = (gender: 'male' | 'female'): SpeechSynthesisVoice | null => {
        const voices = window.speechSynthesis.getVoices();
        const russianVoices = voices.filter(v => v.lang.startsWith('ru'));

        if (russianVoices.length === 0) return null;

        // Try to find gender-specific voice
        if (gender === 'female') {
            const femaleVoice = russianVoices.find(v =>
                v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('женский') ||
                v.name.includes('Milena') ||
                v.name.includes('Irina') ||
                v.name.includes('Ирина')
            );
            return femaleVoice || russianVoices[1] || russianVoices[0];
        } else {
            const maleVoice = russianVoices.find(v =>
                v.name.toLowerCase().includes('male') ||
                v.name.toLowerCase().includes('мужской') ||
                v.name.includes('Pavel') ||
                v.name.includes('Павел') ||
                v.name.includes('Dmitri')
            );
            return maleVoice || russianVoices[0];
        }
    };

    // Load voices
    useEffect(() => {
        const loadVoices = () => {
            voicesLoadedRef.current = window.speechSynthesis.getVoices().length > 0;
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // Apply locked parameters
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.rounds !== undefined) setRounds(Number(lockedParameters.rounds));
            if (lockedParameters.shuffle !== undefined) setShuffle(Boolean(lockedParameters.shuffle));
            if (lockedParameters.gridSize !== undefined) setGridSize(Number(lockedParameters.gridSize));
        }
    }, [isLocked, lockedParameters]);

    // Speak a syllable
    const speak = (syllable: string, gender: 'male' | 'female') => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(syllable.toLowerCase());
            utterance.lang = 'ru-RU';
            utterance.rate = 0.8;
            utterance.pitch = gender === 'female' ? 1.3 : 0.8;

            const voice = getVoice(gender);
            if (voice) utterance.voice = voice;

            window.speechSynthesis.speak(utterance);
        }
    };

    // Fisher-Yates shuffle
    const shuffleArray = <T,>(array: T[]): T[] => {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    };

    // Generate random syllables for a round
    const generateRoundSyllables = (): string[] => {
        const shuffled = shuffleArray(SYLLABLES);
        return shuffled.slice(0, gridSize);
    };

    // Start a new round
    const startRound = () => {
        const syllables = generateRoundSyllables();
        const displayOrder = shuffle ? shuffleArray([...syllables]) : syllables;
        setGridSyllables(displayOrder);
        setRemainingSyllables(shuffleArray([...syllables])); // Random order of what to call
        setCurrentSyllable(null);

        // Say the first syllable after a short delay
        setTimeout(() => {
            sayNextSyllable(shuffleArray([...syllables]));
        }, 1000);
    };

    // Say the next syllable
    const sayNextSyllable = (syllables: string[]) => {
        if (syllables.length === 0) {
            // Round complete
            const nextRound = currentRound + 1;
            if (nextRound >= rounds) {
                // All rounds complete - save game session to history
                const correctCount = currentClicks.filter(c => c.correct).length;
                const totalAttempts = currentClicks.length;
                const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
                const avgReactionTime = correctCount > 0
                    ? Math.round(currentClicks.filter(c => c.correct).reduce((sum, c) => sum + c.reactionTime, 0) / correctCount)
                    : 0;

                const gameRecord: GameRecord = {
                    rounds,
                    accuracy,
                    avgReactionTime,
                    errors: totalAttempts - correctCount,
                    timestamp: new Date()
                };
                setGameHistory(prev => [...prev, gameRecord]);

                setPhase('finished');
                window.speechSynthesis.cancel();
            } else {
                // Start next round
                setCurrentRound(nextRound);
                setTimeout(() => {
                    startRound();
                }, 1500);
            }
            return;
        }

        const nextSyllable = syllables[0];
        setCurrentSyllable(nextSyllable);
        setRemainingSyllables(syllables);
        digitStartTimeRef.current = Date.now();
        speak(nextSyllable, 'male'); // Male voice first
    };

    // Handle cell click
    const handleCellClick = (syllable: string) => {
        if (phase !== 'playing' || currentSyllable === null) return;

        const reactionTime = Date.now() - digitStartTimeRef.current;
        const isCorrect = syllable === currentSyllable;

        const record: ClickRecord = {
            syllable: currentSyllable,
            correct: isCorrect,
            reactionTime
        };
        setCurrentClicks(prev => [...prev, record]);

        if (isCorrect) {
            // Female voice repeats the syllable
            speak(syllable, 'female');

            // Remove from remaining and say next
            const newRemaining = remainingSyllables.slice(1);
            setRemainingSyllables(newRemaining);
            setCurrentSyllable(null);

            setTimeout(() => {
                sayNextSyllable(newRemaining);
            }, 1000);
        } else {
            // Wrong answer - flash red and repeat the same syllable with male voice
            setErrorFlashSyllable(syllable);
            setTimeout(() => setErrorFlashSyllable(null), 300);

            setTimeout(() => {
                speak(currentSyllable, 'male');
                digitStartTimeRef.current = Date.now();
            }, 500);
        }
    };

    // Start game
    const startGame = () => {
        setPhase('playing');
        setCurrentRound(0);
        setCurrentClicks([]);
        startRound();
    };

    // Stop game
    const stopGame = () => {
        window.speechSynthesis.cancel();
        setPhase('idle');
        setCurrentSyllable(null);
        setCurrentClicks([]);
        setCurrentRound(0);
    };

    // Reset game
    const resetGame = () => {
        window.speechSynthesis.cancel();
        setPhase('idle');
        setCurrentSyllable(null);
        setCurrentClicks([]);
        setCurrentRound(0);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    // Calculate statistics for current game
    const correctCount = currentClicks.filter(h => h.correct).length;
    const totalAttempts = currentClicks.length;
    const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
    const avgReactionTime = correctCount > 0
        ? Math.round(currentClicks.filter(h => h.correct).reduce((sum, h) => sum + h.reactionTime, 0) / correctCount)
        : 0;

    // Check if passed (for locked mode)
    const requiredAccuracy = requiredResult ? Number(requiredResult) : 80;
    const passed = accuracy >= requiredAccuracy;

    // Grid columns based on size
    const gridCols = gridSize <= 4 ? 2 : gridSize <= 9 ? 3 : 4;

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
                        <h1 className="text-xl font-bold text-gray-800">Быстрые слоги</h1>
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
                        onClick={phase === 'playing' ? stopGame : startGame}
                        className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${phase !== 'playing'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                    >
                        {phase !== 'playing' ? <Play size={18} /> : <Square size={18} />}
                        {phase !== 'playing' ? 'Начать тест' : 'Остановить'}
                    </button>

                    {/* Settings - Hidden when locked or playing */}
                    {!isLocked && phase !== 'playing' && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings size={16} className="text-gray-500" />
                                <span className="font-medium text-gray-700">Настройки</span>
                            </div>

                            {/* Rounds */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2">Количество кругов</label>
                                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => setRounds(Math.max(1, rounds - 1))}
                                        disabled={rounds <= 1}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >−</button>
                                    <span className="font-bold text-gray-800">{rounds}</span>
                                    <button
                                        onClick={() => setRounds(Math.min(10, rounds + 1))}
                                        disabled={rounds >= 10}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>

                            {/* Grid Size */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2">Слогов на экране</label>
                                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => setGridSize(Math.max(4, gridSize - 1))}
                                        disabled={gridSize <= 4}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >−</button>
                                    <span className="font-bold text-gray-800">{gridSize}</span>
                                    <button
                                        onClick={() => setGridSize(Math.min(16, gridSize + 1))}
                                        disabled={gridSize >= 16}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress during game */}
                    {phase === 'playing' && (
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                            <div className="text-sm text-blue-600 mb-1">Круг</div>
                            <div className="text-3xl font-bold text-blue-800">{currentRound + 1} / {rounds}</div>
                            <div className="text-sm text-blue-600 mt-2">Осталось: {remainingSyllables.length}</div>
                        </div>
                    )}
                </div>

                {/* Center - Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    {/* Idle State */}
                    {phase === 'idle' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-64 h-64 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-white">
                                <span className="text-6xl">🔤</span>
                            </div>
                            <p className="text-gray-500 text-center max-w-md">
                                Мужской голос назовёт слог — нажмите его как можно быстрее!<br />
                                После правильного ответа женский голос повторит слог.
                            </p>
                            <button
                                onClick={startGame}
                                className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all"
                            >
                                НАЧАТЬ ТЕСТ
                            </button>
                        </div>
                    )}

                    {/* Playing State */}
                    {phase === 'playing' && (
                        <div className="flex flex-col items-center gap-8">

                            {/* Grid */}
                            <div className={`grid gap-5 justify-center`} style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
                                {gridSyllables.map((syllable, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleCellClick(syllable)}
                                        className={`
                      w-28 h-28 rounded-2xl text-4xl font-bold transition-all
                      ${errorFlashSyllable === syllable
                                                ? 'bg-red-500 border-2 border-red-600 text-white scale-95'
                                                : 'bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:scale-105'}
                      active:scale-95
                      shadow-md hover:shadow-lg
                    `}
                                    >
                                        {syllable}
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
                                <div className="grid grid-cols-3 gap-4 mt-4 mb-4">
                                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                                        <p className="text-sm text-blue-600">Точность</p>
                                        <p className="text-2xl font-bold text-blue-700">{accuracy}%</p>
                                    </div>
                                    <div className="bg-red-50 rounded-xl p-4 text-center">
                                        <p className="text-sm text-red-600">Ошибок</p>
                                        <p className="text-2xl font-bold text-red-700">{totalAttempts - correctCount}</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                                        <p className="text-sm text-purple-600">Реакция</p>
                                        <p className="text-2xl font-bold text-purple-700">{avgReactionTime} мс</p>
                                    </div>
                                </div>
                                <p className="text-gray-500">
                                    {correctCount} правильных из {totalAttempts} попыток за {rounds} круг{rounds > 1 ? 'а' : ''}
                                </p>
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
                                                lockedCompleteExercise({ correctCount, totalAttempts, accuracy, avgReactionTime }, true);
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

                {/* Right Sidebar - Game Session History */}
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
                                            <span>Кругов:</span>
                                            <span className="font-medium">{game.rounds}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Ошибок:</span>
                                            <span className="font-medium text-red-600">{game.errors}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Реакция:</span>
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
                            <p><strong>Цель:</strong> Тренировка слухового восприятия слогов и скорости реакции.</p>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Мужской голос называет слог</li>
                                <li>Нажмите названный слог как можно быстрее</li>
                                <li>После правильного ответа женский голос повторит слог</li>
                                <li>Каждый слог называется ровно 1 раз за круг</li>
                                <li>Можно настроить количество слогов на экране</li>
                            </ul>
                            <p><strong>Совет:</strong> Внимательно слушайте и смотрите на всё поле!</p>
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
