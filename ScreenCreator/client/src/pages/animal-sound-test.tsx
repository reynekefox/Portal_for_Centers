import { motion } from "framer-motion";
import { ArrowLeft, Play, RotateCcw, Volume2, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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

// Master list of animals that we have BOTH Sound and Image for
// Verified images: bear, bee, bird, butterfly, cat, chicken, cow, crow, dolphin, dog, duck, eagle, elephant, fish, fox, frog, giraffe, goat, horse, lion, monkey, mouse, owl, penguin, pig, rabbit, rooster, sheep, snake, spider, tiger, turtle, whale, wolf, zebra
// (Plus others like beetle/insects if we map them, but let's stick to these core 35 for now).
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
    // { word: "Рыба", id: "fish", image: "fish.png" }, // Fish sound is bubble? verify later.
    { word: "Лиса", id: "fox", image: "fox.png" },
    { word: "Лягушка", id: "frog", image: "frog.png" },
    { word: "Жираф", id: "giraffe", image: "giraffe.png" },
    { word: "Козёл", id: "goat", image: "goat.png" },
    { word: "Лошадь", id: "horse", image: "horse.png" },
    { word: "Лев", id: "lion", image: "lion.png" },
    { word: "Обезьяна", id: "monkey", image: "monkey.png" },
    { word: "Мышь", id: "mouse", image: "mouse.png" },
    { word: "Сова", id: "owl", image: "owl.png" },
    { word: "Пингвин", id: "penguin", image: "penguin.png" },
    { word: "Свинья", id: "pig", image: "pig.png" },
    { word: "Кролик", id: "rabbit", image: "rabbit.png" },
    { word: "Петух", id: "rooster", image: "rooster.png" },
    { word: "Овца", id: "sheep", image: "sheep.png" },
    { word: "Змея", id: "snake", image: "snake.png" },
    { word: "Паук", id: "spider", image: "spider.png" },
    { word: "Тигр", id: "tiger", image: "tiger.png" },
    { word: "Черепаха", id: "turtle", image: "turtle.png" },
    { word: "Кит", id: "whale", image: "whale.png" },
    { word: "Волк", id: "wolf", image: "wolf.png" },
    { word: "Зебра", id: "zebra", image: "zebra.png" },
];


export default function AnimalSoundTest() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentRound, setCurrentRound] = useState<{ target: AnimalItem; options: AnimalItem[] } | null>(null);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [showResults, setShowResults] = useState(false);

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

    // Game Logic: Start
    const startGame = () => {
        setIsPlaying(true);
        setScore({ correct: 0, total: 0 });
        setTimeElapsed(0);
        setShowResults(false);
        nextRound();
    };

    const stopGame = () => {
        setIsPlaying(false);
        setShowResults(true);
    };

    const nextRound = () => {
        setFeedback(null);

        // Pick target
        const target = animals[Math.floor(Math.random() * animals.length)];

        // Pick 5 distractors (unique)
        let options = [target];
        while (options.length < 6) {
            const random = animals[Math.floor(Math.random() * animals.length)];
            if (!options.find(o => o.id === random.id)) {
                options.push(random);
            }
        }

        // Shuffle options
        options = options.sort(() => Math.random() - 0.5);

        setCurrentRound({ target, options });

        // Play sound immediately after a small delay
        setTimeout(() => playAnimalSound(target.id), 500);
    };

    const playAnimalSound = (animalId: string) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        // Try basic path - make sure to use valid converted files
        const baseAudio = `/auditory-test/audio/animals/${animalId}.mp3`;

        const audio = new Audio(baseAudio);
        audioRef.current = audio;
        audio.play().catch(e => console.error("Sound play failed", e));
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
            // Use simple browser beep or visual only if audio lib missing
            // Or try to play correct.mp3 if we had it
            setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
            setTimeout(() => nextRound(), 1000);
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

    // Format time mm:ss
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4">
            {/* Header */}
            <div className="mx-auto max-w-6xl flex items-center justify-between mb-6">
                <Link href="/">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        На главную
                    </Button>
                </Link>
                <div className="flex items-center gap-4 bg-white px-6 py-2 rounded-full shadow-sm border">
                    <span className="text-lg font-bold text-slate-700">
                        {formatTime(timeElapsed)}
                    </span>
                </div>
            </div>

            <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
                {/* Left Sidebar: Controls & Stats */}
                <Card className="p-6 flex flex-col items-center justify-center gap-6 col-span-1 h-full bg-white shadow-xl border-slate-100">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-slate-800">Угадай звук</h2>
                        <p className="text-slate-500">Послушай и выбери животное</p>
                    </div>

                    <div className="w-full flex justify-center py-8">
                        {!isPlaying ? (
                            <Button onClick={startGame} size="lg" className="w-48 h-16 text-xl rounded-2xl bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200 transition-all hover:scale-105 active:scale-95">
                                <Play className="mr-3 h-8 w-8" fill="currentColor" />
                                Начать
                            </Button>
                        ) : (
                            <Button onClick={stopGame} size="lg" variant="destructive" className="w-48 h-16 text-xl rounded-2xl shadow-lg shadow-red-200 transition-all hover:scale-105 active:scale-95">
                                <Square className="mr-3 h-6 w-6" fill="currentColor" />
                                Стоп
                            </Button>
                        )}
                    </div>

                    {isPlaying && (
                        <div className="space-y-4 w-full px-4">
                            <Button onClick={repeatSound} variant="outline" className="w-full h-14 text-lg rounded-xl border-2 border-indigo-100 hover:bg-indigo-50 text-indigo-600">
                                <Volume2 className="mr-2 h-6 w-6" />
                                Повторить звук
                            </Button>

                            <div className="pt-4 border-t w-full">
                                <div className="flex justify-between text-m font-medium text-slate-600 mb-1">
                                    <span>Верно:</span>
                                    <span className="text-green-600">{score.correct}</span>
                                </div>
                                <div className="flex justify-between text-m font-medium text-slate-600">
                                    <span>Всего:</span>
                                    <span>{score.total}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Center: Game Area (6 Cards) */}
                <div className="col-span-1 md:col-span-3 h-full">
                    {isPlaying && currentRound ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full">
                            {currentRound.options.map((animal, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={idx + animal.id} // reliable key
                                    className="h-full"
                                >
                                    <Card
                                        onClick={() => multihandleChoice(animal)}
                                        className={cn(
                                            "h-full flex flex-col items-center justify-center p-4 cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-indigo-200 active:scale-95 bg-white rounded-3xl group",
                                            feedback === 'correct' && animal.id === currentRound.target.id && "bg-green-50 border-green-500 scale-105",
                                            feedback === 'incorrect' && "shake-animation" // Add css class if desired, or simple visual feedback
                                        )}
                                    >
                                        <div className="relative w-full aspect-square flex items-center justify-center mb-4">
                                            <img
                                                src={`/vocabulary/${animal.image}`}
                                                alt={animal.word}
                                                className="object-contain max-h-[80%] max-w-[80%] drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </div>
                                        <span className="text-xl font-bold text-slate-700 group-hover:text-indigo-600">{animal.word}</span>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                            <div className="text-center text-slate-400">
                                <p className="text-lg">Нажми "Начать" для старта игры</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Dialog */}
            <Dialog open={showResults} onOpenChange={setShowResults}>
                <DialogContent className="sm:max-w-md text-center">

                    <DialogHeader>
                        <DialogTitle className="text-3xl text-center mb-2">🎉 Отличная работа!</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="text-6xl font-bold text-indigo-600">{score.correct}</div>
                        <div className="text-gray-500">верных ответов из {score.total}</div>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <div className="text-sm text-slate-500">Время</div>
                                <div className="text-xl font-bold">{formatTime(timeElapsed)}</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <div className="text-sm text-slate-500">Точность</div>
                                <div className="text-xl font-bold">
                                    {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-center gap-2">
                        <Button variant="outline" onClick={() => setShowResults(false)} className="rounded-xl">
                            Закрыть
                        </Button>
                        <Button onClick={startGame} className="rounded-xl bg-green-500 hover:bg-green-600">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Играть снова
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );

    function multihandleChoice(animal: AnimalItem) {
        handleChoice(animal);
    }
}
