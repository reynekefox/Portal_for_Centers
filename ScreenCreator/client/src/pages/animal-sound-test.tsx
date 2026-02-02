import { motion } from "framer-motion";
import { ArrowLeft, Play, RotateCcw, Volume2, Square, HelpCircle, X, CheckCircle, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLockedParams } from "@/hooks/useLockedParams";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

// Define the Animal type
interface AnimalItem {
    word: string; // Russian name
    id: string;   // English ID for matching file names
    image: string; // Filename in /vocabulary/
}

// Master list of animals
const animals: AnimalItem[] = [
    { word: "Медведь", id: "bear", image: "bear.png" },
    { word: "Пчела", id: "bee", image: "bee.png" },
    { word: "Птица", id: "bird", image: "bird.png" },
    { word: "Бабочка", id: "butterfly", image: "butterfly.png" },
    { word: "Кошка", id: "cat", image: "cat.png" },
    { word: "Курица", id: "chicken", image: "chicken.png" },
    { word: "Корова", id: "cow", image: "cow.png" },
    { word: "Ворона", id: "crow", image: "crow.png" },
    { word: "Дельфин", id: "dolphin", image: "dolphin.png" },
    { word: "Собака", id: "dog", image: "dog.png" },
    { word: "Утка", id: "duck", image: "duck.png" },
    { word: "Орел", id: "eagle", image: "eagle.png" },
    { word: "Слон", id: "elephant", image: "elephant.png" },
    { word: "Лиса", id: "fox", image: "fox.png" },
    { word: "Лягушка", id: "frog", image: "frog.png" },
    { word: "Козёл", id: "goat", image: "goat.png" },
    { word: "Лошадь", id: "horse", image: "horse.png" },
    { word: "Лев", id: "lion", image: "lion.png" },
    { word: "Обезьяна", id: "monkey", image: "monkey.png" },
    { word: "Мышь", id: "mouse", image: "mouse.png" },
    { word: "Сова", id: "owl", image: "owl.png" },
    { word: "Свинья", id: "pig", image: "pig.png" },
    { word: "Петух", id: "rooster", image: "rooster.png" },
    { word: "Овца", id: "sheep", image: "sheep.png" },
    { word: "Змея", id: "snake", image: "snake.png" },
    { word: "Тигр", id: "tiger", image: "tiger.png" },
    { word: "Кит", id: "whale", image: "whale.png" },
    { word: "Волк", id: "wolf", image: "wolf.png" },
    { word: "Зебра", id: "zebra", image: "zebra.png" },
];

export default function AnimalSoundTest() {
    const [, setLocation] = useLocation();
    const { isLocked, lockedParameters, requiredResult, backPath, completeExercise, getNextPath } = useLockedParams('animal-sound-test');

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentRound, setCurrentRound] = useState<{ target: AnimalItem; options: AnimalItem[] } | null>(null);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [hideName, setHideName] = useState(false);

    // Apply locked parameters
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.hideName !== undefined) {
                setHideName(lockedParameters.hideName as boolean);
            }
        }
    }, [isLocked, lockedParameters]);

    const timerRef = useRef<NodeJS.Timeout>();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();

    // Timer logic
    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setTimeElapsed((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying]);

    // Game Logic
    const startGame = () => {
        setIsPlaying(true);
        setScore({ correct: 0, total: 0 });
        setTimeElapsed(0);
        setShowResults(false);
        nextRound();
    };

    const stopGame = async () => {
        setIsPlaying(false);
        setShowResults(true);

        // Submit result for locked assignment
        if (isLocked) {
            const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
            const minAccuracy = requiredResult?.minValue || 70;
            const passed = accuracy >= minAccuracy;
            await completeExercise({
                correct: score.correct,
                total: score.total,
                accuracy,
                timeElapsed
            }, passed);
        }
    };

    const nextRound = () => {
        setFeedback(null);
        const target = animals[Math.floor(Math.random() * animals.length)];
        let options = [target];
        while (options.length < 6) {
            const random = animals[Math.floor(Math.random() * animals.length)];
            if (!options.find(o => o.id === random.id)) {
                options.push(random);
            }
        }
        options = options.sort(() => Math.random() - 0.5);
        setCurrentRound({ target, options });
        setTimeout(() => playAnimalSound(target.id), 500);
    };

    const playAnimalSound = (animalId: string) => {
        const baseAudio = `/auditory-test/audio/animals/${animalId}.mp3`;
        console.log(`[AudioDebug] Attempting to play: ${baseAudio}`);

        if (!audioRef.current) {
            audioRef.current = new Audio();
        }

        const audio = audioRef.current;

        // Pause and reset
        audio.pause();
        audio.currentTime = 0;
        audio.src = baseAudio;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log("[AudioDebug] Playback started successfully");
                })
                .catch(error => {
                    console.error("[AudioDebug] Playback failed:", error);
                    // Avoid spamming toasts, just log to console
                });
        }
    };

    const repeatSound = () => {
        if (currentRound) {
            playAnimalSound(currentRound.target.id);
        }
    };

    const handleChoice = (animal: AnimalItem) => {
        if (!currentRound) return;
        const isCorrect = animal.id === currentRound.target.id;

        if (isCorrect) {
            setFeedback("correct");
            setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
            setTimeout(() => nextRound(), 800);
        } else {
            setFeedback("incorrect");
            setScore(prev => ({ ...prev, total: prev.total + 1 }));
            toast({
                title: "Попробуй еще раз!",
                variant: "destructive",
                duration: 1000
            });
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header - Matches Visual Memory Test */}
            <div className="bg-white border-b border-gray-200 py-4 px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={backPath}>
                            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <ArrowLeft size={24} />
                            </button>
                        </Link>
                        <h1 className="text-xl font-bold text-gray-800">Звуки Животных</h1>
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
                        onClick={isPlaying ? stopGame : startGame}
                        className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${!isPlaying
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                    >
                        {!isPlaying ? <Play size={18} /> : <Square size={18} />}
                        {!isPlaying ? 'Начать тест' : 'Остановить'}
                    </button>

                    {/* Settings - only show when NOT locked */}
                    {!isLocked && (
                        <div className="bg-gray-50 rounded-xl p-4 mt-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock size={16} className="text-gray-500" />
                                <span className="font-medium text-gray-700">Настройки</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-500">Скрыть названия</label>
                                <button
                                    onClick={() => setHideName(!hideName)}
                                    className={`w-10 h-5 rounded-full transition-all ${hideName ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${hideName ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Repeat Sound Button */}
                    {isPlaying && (
                        <button
                            onClick={repeatSound}
                            className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-indigo-200 mt-auto"
                        >
                            <Volume2 size={20} />
                            Повторить
                        </button>
                    )}
                </div>

                {/* Center: Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
                    {isPlaying && currentRound ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl h-full max-h-[600px]">
                            {currentRound.options.map((animal, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={idx + animal.id} // reliable key
                                    className="h-full"
                                >
                                    <div
                                        onClick={() => handleChoice(animal)}
                                        className={cn(
                                            "h-full w-full bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center p-4 active:scale-95",
                                            feedback === 'correct' && animal.id === currentRound.target.id && "bg-green-50 border-green-500 scale-105 ring-2 ring-green-200",
                                            feedback === 'incorrect' && "shake-animation border-red-200 bg-red-50"
                                        )}
                                    >
                                        <div className="flex-1 flex items-center justify-center w-full relative">
                                            <img
                                                src={`/vocabulary/${animal.image}`}
                                                alt={animal.word}
                                                className="object-contain max-h-[140px] max-w-full drop-shadow-sm"
                                            />
                                        </div>
                                        {!hideName && (
                                            <span className="text-lg font-bold text-gray-700 mt-2">{animal.word}</span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="w-64 h-64 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-white mx-auto">
                                <span className="text-6xl">🎧</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Угадай звук</h2>
                                <p className="text-gray-500 mt-2">Нажмите "Начать тест", послушайте звук и выберите животное.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Stats */}
                <div className="w-64 bg-white border-l border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-700">Результаты</span>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <span className="text-sm text-gray-500 block mb-1">Верно</span>
                            <span className="text-3xl font-bold text-green-600">{score.correct}</span>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <span className="text-sm text-gray-500 block mb-1">Всего</span>
                            <span className="text-2xl font-bold text-gray-700">{score.total}</span>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <span className="text-sm text-gray-500 block mb-1">Точность</span>
                            <span className={`text-2xl font-bold ${score.total > 0 && (score.correct / score.total) > 0.8 ? 'text-green-600' : 'text-orange-500'}`}>
                                {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Dialog */}
            <Dialog open={showResults} onOpenChange={setShowResults}>
                <DialogContent className="sm:max-w-md text-center">
                    <DialogHeader>
                        <DialogTitle className="text-3xl text-center mb-2">🎉 Результат</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="text-6xl font-bold text-blue-600">{score.correct}</div>
                        <div className="text-gray-500">верных ответов из {score.total}</div>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <div className="text-sm text-gray-500">Время</div>
                                <div className="text-xl font-bold text-gray-800">{formatTime(timeElapsed)}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <div className="text-sm text-gray-500">Точность</div>
                                <div className="text-xl font-bold text-gray-800">
                                    {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-center gap-2">
                        {isLocked ? (
                            <Button
                                onClick={() => setLocation(getNextPath())}
                                className="rounded-full px-6 bg-blue-600 hover:bg-blue-700"
                            >
                                Продолжить
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setShowResults(false)} className="rounded-full px-6">
                                    Закрыть
                                </Button>
                                <Button onClick={startGame} className="rounded-full px-6 bg-blue-600 hover:bg-blue-700">
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Ещё раз
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                            <p><strong>Цель:</strong> Определить животное по звуку.</p>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Нажмите "Начать тест", чтобы услышать звук.</li>
                                <li>Выберите подходящее животное из 6 картинок.</li>
                                <li>Если не расслышали, нажмите "Повторить".</li>
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
        </div>
    );
}
