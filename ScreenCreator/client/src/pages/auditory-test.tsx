import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Volume2, HelpCircle, X, CheckCircle, Clock, Square, ArrowRight } from "lucide-react";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";
import { RequiredResultBanner } from "@/components/RequiredResultBanner";

interface AuditoryItem {
    word: string;
    audioFile: string;
    image: string;
    category: string;
}

// Items with audio and matching vocabulary images - organized by categories
const allItems: AuditoryItem[] = [
    // Animals (Updated with new assets)
    { word: "кошка", audioFile: "cat.mp3", image: "cat.png", category: "animals" },
    { word: "собака", audioFile: "dog.mp3", image: "dog.png", category: "animals" },
    { word: "птица", audioFile: "bird.mp3", image: "bird.png", category: "animals" },
    { word: "рыба", audioFile: "fish.mp3", image: "fish.png", category: "animals" },
    { word: "лев", audioFile: "lion.mp3", image: "lion.png", category: "animals" },
    { word: "слон", audioFile: "elephant.mp3", image: "elephant.png", category: "animals" },
    { word: "медведь", audioFile: "bear.mp3", image: "bear.png", category: "animals" },
    { word: "корова", audioFile: "cow.mp3", image: "cow.png", category: "animals" },
    { word: "лошадь", audioFile: "horse.mp3", image: "horse.png", category: "animals" },
    { word: "свинья", audioFile: "pig.mp3", image: "pig.png", category: "animals" },
    { word: "овца", audioFile: "sheep.mp3", image: "sheep.png", category: "animals" },
    { word: "кролик", audioFile: "rabbit.mp3", image: "rabbit.png", category: "animals" },
    { word: "обезьяна", audioFile: "monkey.mp3", image: "monkey.png", category: "animals" },
    { word: "тигр", audioFile: "tiger.mp3", image: "tiger.png", category: "animals" },
    { word: "зебра", audioFile: "zebra.mp3", image: "zebra.png", category: "animals" },
    { word: "жираф", audioFile: "giraffe.mp3", image: "giraffe.png", category: "animals" },
    { word: "пингвин", audioFile: "penguin.mp3", image: "penguin.png", category: "animals" },
    { word: "сова", audioFile: "owl.mp3", image: "owl.png", category: "animals" },
    { word: "лягушка", audioFile: "frog.mp3", image: "frog.png", category: "animals" },
    { word: "черепаха", audioFile: "turtle.mp3", image: "turtle.png", category: "animals" },
    { word: "пчела", audioFile: "bee.mp3", image: "bee.png", category: "animals" },
    { word: "бабочка", audioFile: "butterfly.mp3", image: "butterfly.png", category: "animals" },
    { word: "курица", audioFile: "chicken.mp3", image: "chicken.png", category: "animals" },
    { word: "утка", audioFile: "duck.mp3", image: "duck.png", category: "animals" },
    { word: "змея", audioFile: "snake.mp3", image: "snake.png", category: "animals" },
    { word: "паук", audioFile: "spider.mp3", image: "spider.png", category: "animals" },

    // Food (22 items)
    { word: "яблоко", audioFile: "apple.mp3", image: "apple.png", category: "food" },
    { word: "банан", audioFile: "banana.mp3", image: "banana.png", category: "food" },
    { word: "морковь", audioFile: "carrot.mp3", image: "carrot.png", category: "food" },
    { word: "огурец", audioFile: "cucumber.mp3", image: "cucumber.png", category: "food" },
    { word: "виноград", audioFile: "grapes.mp3", image: "grapes.png", category: "food" },
    { word: "лимон", audioFile: "lemon.mp3", image: "lemon.png", category: "food" },
    { word: "апельсин", audioFile: "orange.mp3", image: "orange.png", category: "food" },
    { word: "груша", audioFile: "pear.mp3", image: "pear.png", category: "food" },
    { word: "клубника", audioFile: "strawberry.mp3", image: "strawberry.png", category: "food" },
    { word: "помидор", audioFile: "tomato.mp3", image: "tomato.png", category: "food" },
    { word: "арбуз", audioFile: "watermelon.mp3", image: "watermelon.png", category: "food" },
    { word: "картошка", audioFile: "potato.mp3", image: "potato.png", category: "food" },
    { word: "гриб", audioFile: "mushroom.mp3", image: "mushroom.png", category: "food" },
    { word: "хлеб", audioFile: "bread.mp3", image: "bread.png", category: "food" },
    { word: "торт", audioFile: "cake.mp3", image: "cake.png", category: "food" },
    { word: "сыр", audioFile: "cheese.mp3", image: "cheese.png", category: "food" },
    { word: "яйцо", audioFile: "egg.mp3", image: "egg.png", category: "food" },
    { word: "мороженое", audioFile: "ice_cream.mp3", image: "ice_cream.png", category: "food" },
    { word: "молоко", audioFile: "milk.mp3", image: "milk.png", category: "food" },
    { word: "пицца", audioFile: "pizza.mp3", image: "pizza.png", category: "food" },
    { word: "бургер", audioFile: "burger.mp3", image: "burger.png", category: "food" },
    { word: "сок", audioFile: "juice.mp3", image: "juice.png", category: "food" },

    // Objects (43 items)
    { word: "самолёт", audioFile: "airplane.mp3", image: "airplane.png", category: "objects" },
    { word: "автобус", audioFile: "bus.mp3", image: "bus.png", category: "objects" },
    { word: "машина", audioFile: "car.mp3", image: "car.png", category: "objects" },
    { word: "велосипед", audioFile: "bicycle.mp3", image: "bicycle.png", category: "objects" },
    { word: "корабль", audioFile: "ship.mp3", image: "ship.png", category: "objects" },
    { word: "поезд", audioFile: "train.mp3", image: "train.png", category: "objects" },
    { word: "кровать", audioFile: "bed.mp3", image: "bed.png", category: "objects" },
    { word: "стул", audioFile: "chair.mp3", image: "chair.png", category: "objects" },
    { word: "часы", audioFile: "clock.mp3", image: "clock.png", category: "objects" },
    { word: "компьютер", audioFile: "computer.mp3", image: "computer.png", category: "objects" },
    { word: "чашка", audioFile: "cup.mp3", image: "cup.png", category: "objects" },
    { word: "дверь", audioFile: "door.mp3", image: "door.png", category: "objects" },
    { word: "вилка", audioFile: "fork.mp3", image: "fork.png", category: "objects" },
    { word: "лампа", audioFile: "lamp.mp3", image: "lamp.png", category: "objects" },
    { word: "ключ", audioFile: "key.mp3", image: "key.png", category: "objects" },
    { word: "телефон", audioFile: "phone.mp3", image: "phone.png", category: "objects" },
    { word: "подушка", audioFile: "pillow.mp3", image: "pillow.png", category: "objects" },
    { word: "тарелка", audioFile: "plate.mp3", image: "plate.png", category: "objects" },
    { word: "диван", audioFile: "sofa.mp3", image: "sofa.png", category: "objects" },
    { word: "ложка", audioFile: "spoon.mp3", image: "spoon.png", category: "objects" },
    { word: "стол", audioFile: "table.mp3", image: "table.png", category: "objects" },
    { word: "телевизор", audioFile: "television.mp3", image: "television.png", category: "objects" },
    { word: "зонтик", audioFile: "umbrella.mp3", image: "umbrella.png", category: "objects" },
    { word: "окно", audioFile: "window.mp3", image: "window.png", category: "objects" },
    { word: "книга", audioFile: "book.mp3", image: "book.png", category: "objects" },
    { word: "карандаш", audioFile: "pencil.mp3", image: "pencil.png", category: "objects" },
    { word: "облако", audioFile: "cloud.mp3", image: "cloud.png", category: "objects" },
    { word: "цветок", audioFile: "flower.mp3", image: "flower.png", category: "objects" },
    { word: "дом", audioFile: "house.mp3", image: "house.png", category: "objects" },
    { word: "гора", audioFile: "mountain.mp3", image: "mountain.png", category: "objects" },
    { word: "луна", audioFile: "moon.mp3", image: "moon.png", category: "objects" },
    { word: "дождь", audioFile: "rain.mp3", image: "rain.png", category: "objects" },
    { word: "снеговик", audioFile: "snowman.mp3", image: "snowman.png", category: "objects" },
    { word: "звезда", audioFile: "star.mp3", image: "star.png", category: "objects" },
    { word: "солнце", audioFile: "sun.mp3", image: "sun.png", category: "objects" },
    { word: "дерево", audioFile: "tree.mp3", image: "tree.png", category: "objects" },
    { word: "мяч", audioFile: "ball.mp3", image: "ball.png", category: "objects" },
    { word: "рюкзак", audioFile: "backpack.mp3", image: "backpack.png", category: "objects" },
    { word: "сумка", audioFile: "bag.mp3", image: "bag.png", category: "objects" },
    { word: "ведро", audioFile: "bucket.mp3", image: "bucket.png", category: "objects" },
    { word: "воздушный змей", audioFile: "kite.mp3", image: "kite.png", category: "objects" },
    { word: "замок", audioFile: "lock.mp3", image: "lock.png", category: "objects" },
    { word: "лопата", audioFile: "shovel.mp3", image: "shovel.png", category: "objects" },

    // Clothes (12 items)
    { word: "сапоги", audioFile: "boots.mp3", image: "boots.png", category: "clothes" },
    { word: "платье", audioFile: "dress.mp3", image: "dress.png", category: "clothes" },
    { word: "очки", audioFile: "glasses.mp3", image: "glasses.png", category: "clothes" },
    { word: "перчатки", audioFile: "gloves.mp3", image: "gloves.png", category: "clothes" },
    { word: "шапка", audioFile: "hat.mp3", image: "hat.png", category: "clothes" },
    { word: "куртка", audioFile: "jacket.mp3", image: "jacket.png", category: "clothes" },
    { word: "брюки", audioFile: "pants.mp3", image: "pants.png", category: "clothes" },
    { word: "шарф", audioFile: "scarf.mp3", image: "scarf.png", category: "clothes" },
    { word: "рубашка", audioFile: "shirt.mp3", image: "shirt.png", category: "clothes" },
    { word: "шорты", audioFile: "shorts.mp3", image: "shorts.png", category: "clothes" },
    { word: "юбка", audioFile: "skirt.mp3", image: "skirt.png", category: "clothes" },
    { word: "футболка", audioFile: "tshirt.mp3", image: "tshirt.png", category: "clothes" },
];

const categories = [
    { id: "all", name: "Все" },
    { id: "animals", name: "Животные" },
    { id: "food", name: "Еда" },
    { id: "objects", name: "Предметы" },
    { id: "clothes", name: "Одежда" },
];

const getAudioPath = (file: string) => `/auditory-test/audio/${file}`;
const getImagePath = (file: string) => `/vocabulary/${file}`;

interface TrialResult {
    word: string;
    isCorrect: boolean;
    rtMs: number | null;
}

interface AttemptHistory {
    correct: number;
    total: number;
    accuracy: number;
    avgRt: number;
    timestamp: Date;
}

export default function AuditoryTest() {
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise, hasNextExercise, getNextPath } = useLockedParams('auditory-test');

    const [phase, setPhase] = useState<'idle' | 'playing' | 'choice' | 'results'>('idle');
    const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
    const [shuffledTrials, setShuffledTrials] = useState<AuditoryItem[]>([]);
    const [choices, setChoices] = useState<AuditoryItem[]>([]);
    const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
    const [choicesDisabled, setChoicesDisabled] = useState(false);
    const [answeredWord, setAnsweredWord] = useState<string | null>(null);
    const [waitingForNext, setWaitingForNext] = useState(false);

    const [totalCorrect, setTotalCorrect] = useState(0);
    const [totalWrong, setTotalWrong] = useState(0);
    const [trialResults, setTrialResults] = useState<TrialResult[]>([]);

    // Settings
    const [trialCount, setTrialCount] = useState(20);
    const [responseTime, setResponseTime] = useState(5);
    const [choiceCount, setChoiceCount] = useState(3);
    const [category, setCategory] = useState("all");
    const [showWord, setShowWord] = useState(true);
    const [timerValue, setTimerValue] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    // History
    const [attemptHistory, setAttemptHistory] = useState<AttemptHistory[]>([]);

    // Modals
    const [showHelp, setShowHelp] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const trialStartTimeRef = useRef(0);
    const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

    const currentTrial = shuffledTrials[currentTrialIndex];
    const accuracy = (totalCorrect + totalWrong) > 0
        ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
        : 0;

    // Get filtered items based on category
    const filteredItems = useMemo(() => {
        if (category === "all") return allItems;
        return allItems.filter(item => item.category === category);
    }, [category]);

    // Session stats
    const sessionStats = useMemo(() => {
        const correctTrials = trialResults.filter(t => t.isCorrect && t.rtMs);
        const rtValues = correctTrials.map(t => t.rtMs || 0);
        return {
            avgRt: rtValues.length > 0 ? Math.round(rtValues.reduce((a, b) => a + b, 0) / rtValues.length) : 0,
            minRt: rtValues.length > 0 ? Math.min(...rtValues) : 0,
            maxRt: rtValues.length > 0 ? Math.max(...rtValues) : 0,
        };
    }, [trialResults]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Spacebar to proceed to next trial
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && waitingForNext) {
                e.preventDefault();
                goToNextTrial();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [waitingForNext]);

    const clearTimers = useCallback(() => {
        if (responseTimeoutRef.current) {
            clearInterval(responseTimeoutRef.current);
            responseTimeoutRef.current = null;
        }
        if (elapsedTimerRef.current) {
            clearInterval(elapsedTimerRef.current);
            elapsedTimerRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }, []);

    // Fisher-Yates shuffle
    const shuffleArray = <T,>(array: T[]): T[] => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const startGame = () => {
        const shuffled = shuffleArray(filteredItems);
        const selected = shuffled.slice(0, Math.min(trialCount, shuffled.length));
        setShuffledTrials(selected);

        setCurrentTrialIndex(0);
        setTotalCorrect(0);
        setTotalWrong(0);
        setTrialResults([]);
        setAnsweredWord(null);
        setElapsedTime(0);

        // Start elapsed timer
        elapsedTimerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        playAudioForTrial(selected[0], selected);
    };

    const stopGame = () => {
        clearTimers();
        setPhase('idle');
        setShuffledTrials([]);
        setChoices([]);
        setElapsedTime(0);
    };

    const playAudioForTrial = (trial: AuditoryItem, allTrials: AuditoryItem[]) => {
        setPhase('playing');
        setSelectedChoice(null);
        setChoicesDisabled(false);
        setTimerValue(0);
        setAnsweredWord(null);

        const audio = new Audio(getAudioPath(trial.audioFile));
        audioRef.current = audio;

        audio.addEventListener('ended', () => {
            showChoicesForTrial(trial, allTrials);
        });

        audio.addEventListener('error', () => {
            showChoicesForTrial(trial, allTrials);
        });

        audio.play().catch(() => {
            showChoicesForTrial(trial, allTrials);
        });
    };

    const showChoicesForTrial = (trial: AuditoryItem, allTrials: AuditoryItem[]) => {
        setPhase('choice');

        const otherItems = filteredItems.filter(item => item.word !== trial.word);
        const shuffledOthers = shuffleArray(otherItems);
        const wrongChoices = shuffledOthers.slice(0, choiceCount - 1);
        const allChoices = shuffleArray([trial, ...wrongChoices]);
        setChoices(allChoices);

        trialStartTimeRef.current = performance.now();
        setTimerValue(responseTime);

        let remaining = responseTime;
        responseTimeoutRef.current = setInterval(() => {
            remaining--;
            setTimerValue(remaining);
            if (remaining <= 0) {
                if (responseTimeoutRef.current) clearInterval(responseTimeoutRef.current);
                handleTimeout(trial, allTrials);
            }
        }, 1000);
    };

    const handleTimeout = (trial: AuditoryItem, allTrials: AuditoryItem[]) => {
        setChoicesDisabled(true);
        setSelectedChoice(-1);
        setTotalWrong(prev => prev + 1);
        setTrialResults(prev => [...prev, { word: trial.word, isCorrect: false, rtMs: null }]);
        setAnsweredWord(trial.word);
        setWaitingForNext(true);
    };

    const handleChoice = (index: number) => {
        if (choicesDisabled) return;

        if (responseTimeoutRef.current) clearInterval(responseTimeoutRef.current);
        setChoicesDisabled(true);
        setSelectedChoice(index);

        const rtMs = Math.round(performance.now() - trialStartTimeRef.current);
        const isCorrect = choices[index].word === currentTrial.word;

        if (isCorrect) {
            setTotalCorrect(prev => prev + 1);
        } else {
            setTotalWrong(prev => prev + 1);
        }
        setTrialResults(prev => [...prev, { word: currentTrial.word, isCorrect, rtMs }]);

        setAnsweredWord(currentTrial.word);
        setWaitingForNext(true);
    };

    const goToNextTrial = () => {
        setAnsweredWord(null);
        setWaitingForNext(false);
        const nextIndex = currentTrialIndex + 1;
        if (nextIndex >= shuffledTrials.length) {
            finishTest();
        } else {
            setCurrentTrialIndex(nextIndex);
            playAudioForTrial(shuffledTrials[nextIndex], shuffledTrials);
        }
    };

    const finishTest = () => {
        clearTimers();
        setPhase('results');

        // Save to history
        const correctTrials = trialResults.filter(t => t.isCorrect && t.rtMs);
        const avgRt = correctTrials.length > 0
            ? Math.round(correctTrials.reduce((sum, t) => sum + (t.rtMs || 0), 0) / correctTrials.length)
            : 0;

        setAttemptHistory(prev => [{
            correct: totalCorrect,
            total: trialResults.length,
            accuracy: Math.round((totalCorrect / trialResults.length) * 100),
            avgRt,
            timestamp: new Date()
        }, ...prev].slice(0, 10));
    };

    const replayAudio = () => {
        if (currentTrial && phase === 'choice') {
            const audio = new Audio(getAudioPath(currentTrial.audioFile));
            audio.play().catch(() => { });
        }
    };

    useEffect(() => {
        return () => clearTimers();
    }, [clearTimers]);

    const getChoiceClass = (index: number) => {
        const choice = choices[index];
        if (!choice) return '';

        if (selectedChoice === null) {
            return 'border-4 border-gray-200 hover:border-blue-400 hover:shadow-lg cursor-pointer';
        }

        if (selectedChoice === -1 || index === selectedChoice) {
            if (choice.word === currentTrial?.word) {
                return 'border-4 border-green-500 ring-4 ring-green-200';
            }
            if (index === selectedChoice) {
                return 'border-4 border-red-500 ring-4 ring-red-200';
            }
        }

        if (choice.word === currentTrial?.word) {
            return 'border-4 border-green-500 ring-4 ring-green-200';
        }
        return 'border-4 border-gray-200 opacity-50';
    };

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
                        <h1 className="text-xl font-bold text-gray-800">Понимание на слух</h1>
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
                        disabled={filteredItems.length < choiceCount}
                        className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${phase === 'idle'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                            } disabled:bg-gray-400`}
                    >
                        {phase === 'idle' ? <Play size={18} /> : <Square size={18} />}
                        {phase === 'idle' ? 'Начать тест' : 'Остановить'}
                    </button>

                    {/* Timer - under button */}
                    <div className="text-4xl font-mono font-bold text-blue-600 text-center py-2">
                        {formatTime(elapsedTime)}
                    </div>

                    {/* Settings - Hidden when locked */}
                    {!isLocked && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock size={16} className="text-gray-500" />
                                <span className="font-medium text-gray-700">Настройки</span>
                            </div>

                            {/* Trial Count */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2">Заданий</label>
                                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => setTrialCount(Math.max(5, trialCount - 5))}
                                        disabled={phase !== 'idle' || trialCount <= 5}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >−</button>
                                    <span className="font-bold text-gray-800">{trialCount}</span>
                                    <button
                                        onClick={() => setTrialCount(Math.min(filteredItems.length, trialCount + 5))}
                                        disabled={phase !== 'idle' || trialCount >= filteredItems.length}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>

                            {/* Response Time */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2">Время (сек)</label>
                                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => setResponseTime(Math.max(3, responseTime - 1))}
                                        disabled={phase !== 'idle' || responseTime <= 3}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >−</button>
                                    <span className="font-bold text-gray-800">{responseTime}</span>
                                    <button
                                        onClick={() => setResponseTime(Math.min(30, responseTime + 1))}
                                        disabled={phase !== 'idle' || responseTime >= 30}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>

                            {/* Choice Count */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2">Вариантов</label>
                                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => setChoiceCount(Math.max(3, choiceCount - 1))}
                                        disabled={phase !== 'idle' || choiceCount <= 3}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >−</button>
                                    <span className="font-bold text-gray-800">{choiceCount}</span>
                                    <button
                                        onClick={() => setChoiceCount(Math.min(12, choiceCount + 1))}
                                        disabled={phase !== 'idle' || choiceCount >= 12 || filteredItems.length < choiceCount + 1}
                                        className="p-2 text-gray-500 disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>

                            {/* Category */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-500 block mb-2">Категория</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    disabled={phase !== 'idle'}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm disabled:opacity-50"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Show Word Toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-500">Показать слово</label>
                                <button
                                    onClick={() => setShowWord(!showWord)}
                                    disabled={phase !== 'idle'}
                                    className={`w-10 h-5 rounded-full transition-all ${showWord ? 'bg-indigo-600' : 'bg-gray-300'
                                        } disabled:opacity-50`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${showWord ? 'translate-x-5' : 'translate-x-0.5'
                                        }`} />
                                </button>
                            </div>
                        </div>
                    )}


                </div>

                {/* Center - Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8">


                    {/* Game Content */}
                    {phase === 'idle' && (
                        <div className="flex flex-col items-center gap-6">
                            {isLocked && requiredResult ? (
                                <>
                                    <div className="text-6xl mb-4">🎯</div>
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl shadow-lg inline-block">
                                        <p className="text-sm opacity-90">Цель упражнения:</p>
                                        <p className="text-xl font-bold">{formatRequiredResult(requiredResult, lockedParameters || undefined)}</p>
                                    </div>
                                    <div className="mt-4 text-gray-500">Нажмите "Начать тест"</div>
                                </>
                            ) : (
                                <>
                                    <div className="w-64 h-64 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-white">
                                        <span className="text-6xl">👂</span>
                                    </div>
                                    <button
                                        onClick={startGame}
                                        disabled={filteredItems.length < choiceCount}
                                        className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all disabled:bg-gray-400"
                                    >
                                        НАЧАТЬ ТЕСТ
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {phase === 'playing' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-48 h-48 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                                <Volume2 size={64} className="text-blue-600" />
                            </div>
                            <p className="text-gray-500 text-lg">Слушайте внимательно...</p>
                            <div className="text-sm text-gray-400">
                                Задание {currentTrialIndex + 1} из {shuffledTrials.length}
                            </div>
                        </div>
                    )}

                    {phase === 'choice' && (
                        <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={replayAudio}
                                    disabled={choicesDisabled}
                                    className="p-4 bg-blue-100 rounded-full hover:bg-blue-200 transition-all disabled:opacity-50"
                                >
                                    <Volume2 size={32} className="text-blue-600" />
                                </button>
                                <div className="text-center">
                                    <p className="text-gray-600 text-lg">Выберите картинку</p>
                                    <p className="text-sm text-gray-400">Осталось: {timerValue}с • {currentTrialIndex + 1}/{shuffledTrials.length}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4">
                                {choices.map((choice, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleChoice(index)}
                                        disabled={choicesDisabled}
                                        className={`w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden transition-all bg-white ${getChoiceClass(index)}`}
                                    >
                                        <img
                                            src={getImagePath(choice.image)}
                                            alt=""
                                            className="w-full h-full object-contain p-2"
                                        />
                                    </button>
                                ))}
                            </div>
                            {/* Word display and Next button - below images */}
                            <div className="h-32 flex flex-col items-center justify-center gap-5 mt-4">
                                {answeredWord && (
                                    <>
                                        {showWord && (
                                            <div className="bg-yellow-100 px-6 py-2 rounded-xl">
                                                <span className="text-2xl font-bold text-yellow-800">{answeredWord.charAt(0).toUpperCase() + answeredWord.slice(1)}</span>
                                            </div>
                                        )}
                                        {waitingForNext && (
                                            <button
                                                onClick={goToNextTrial}
                                                className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold rounded-full shadow-lg transition-all transform hover:scale-105"
                                            >
                                                Далее
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {phase === 'results' && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                {accuracy >= 80 ? (
                                    <div className="bg-green-100 p-6 rounded-full">
                                        <CheckCircle className="w-20 h-20 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="bg-orange-100 p-6 rounded-full">
                                        <span className="text-5xl">🎯</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    {accuracy >= 80 ? "Отлично!" : "Хорошая попытка!"}
                                </h2>
                                <p className="text-xl text-gray-600">
                                    Точность: <span className="font-bold text-blue-600">{accuracy}%</span>
                                </p>
                                <p className="text-gray-500">
                                    {totalCorrect} из {trialResults.length} правильно
                                </p>
                            </div>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setPhase('idle')}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all"
                                >
                                    Ещё раз
                                </button>
                                {isLocked && (
                                    <Link href={getNextPath()}>
                                        <button
                                            onClick={() => completeExercise({ accuracy, totalCorrect, totalTrials: trialResults.length }, true)}
                                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg transition-all flex items-center gap-2"
                                        >
                                            {hasNextExercise ? 'Далее' : 'Готово'}
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
                        <span className="font-medium text-gray-700">История попыток</span>
                    </div>

                    {attemptHistory.length === 0 ? (
                        <p className="text-gray-400 text-sm">Нет попыток</p>
                    ) : (
                        <div className="space-y-2">
                            {attemptHistory.map((attempt, i) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-500">Точность</span>
                                        <span className={`font-bold ${attempt.accuracy >= 80 ? 'text-green-600' : 'text-orange-500'}`}>
                                            {attempt.accuracy}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Ср. время</span>
                                        <span className="text-gray-700">{attempt.avgRt} мс</span>
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
                            <p><strong>Цель:</strong> Послушайте слово и выберите соответствующую картинку.</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Вы услышите слово</li>
                                <li>Выберите картинку, которая соответствует слову</li>
                                <li>Нажмите на 🔊 чтобы прослушать ещё раз</li>
                            </ul>
                        </div>
                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700"
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
