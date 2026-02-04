import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";

type GameState = 'intro' | 'preview' | 'input' | 'result';

interface AnimalPosition {
    animal: string;
    position: number; // 0-11 index
    id: string;
}

interface UserAnswer {
    position: number;
    animal: string | null;
}

const ANIMALS = [
    { id: 'fox', name: 'Лиса', image: '/animals/fox.png' },
    { id: 'badger', name: 'Барсук', image: '/animals/badger.png' },
    { id: 'bear', name: 'Медведь', image: '/animals/bear.png' },
    { id: 'squirrel', name: 'Белка', image: '/animals/squirrel.png' },
    { id: 'hedgehog', name: 'Ёжик', image: '/animals/hedgehog.png' },
    { id: 'grouse', name: 'Глухарь', image: '/animals/grouse.png' },
    { id: 'boar', name: 'Кабан', image: '/animals/boar.png' },
    { id: 'moose', name: 'Лось', image: '/animals/moose.png' },
    { id: 'hare', name: 'Заяц', image: '/animals/hare.png' },
    { id: 'lynx', name: 'Рысь', image: '/animals/lynx.png' },
    { id: 'owl', name: 'Сова', image: '/animals/owl.png' },
    { id: 'wolf', name: 'Волк', image: '/animals/wolf.png' },
];

export default function MagicForest() {
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('magic-forest');

    const [level, setLevel] = useState(1);
    const [gameState, setGameState] = useState<GameState>('intro');
    const [sequence, setSequence] = useState<AnimalPosition[]>([]);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
    const [showAnimalModal, setShowAnimalModal] = useState(false);
    const [score, setScore] = useState(0);
    const [showAnimalNames, setShowAnimalNames] = useState(false);
    const [previewDuration, setPreviewDuration] = useState(4);

    const getAnimalsCountForLevel = (lvl: number) => {
        return Math.min(3 + lvl - 1, 12); // Level 1: 3 animals, Level 2: 4, etc.
    };

    const startLevel = () => {
        const animalsCount = getAnimalsCountForLevel(level);

        // Grid positions are just indices 0-11
        const allPositions = Array.from({ length: 12 }, (_, i) => i);
        const shuffledPositions = [...allPositions].sort(() => Math.random() - 0.5);
        const selectedPositions = shuffledPositions.slice(0, animalsCount);

        // Select random animals
        const shuffledAnimals = [...ANIMALS].sort(() => Math.random() - 0.5);
        const selectedAnimals = shuffledAnimals.slice(0, animalsCount);

        // Create sequence
        const newSequence: AnimalPosition[] = selectedPositions.map((pos, idx) => ({
            animal: selectedAnimals[idx].id,
            position: pos,
            id: `${selectedAnimals[idx].id}-${pos}`
        }));

        setSequence(newSequence);
        setUserAnswers([]); // Start with no answers
        setCurrentPreviewIndex(0);
        setGameState('preview');
    };

    // Preview animation
    useEffect(() => {
        if (gameState === 'preview' && currentPreviewIndex < sequence.length) {
            const timer = setTimeout(() => {
                setCurrentPreviewIndex(currentPreviewIndex + 1);
            }, previewDuration * 1000);

            return () => clearTimeout(timer);
        } else if (gameState === 'preview' && currentPreviewIndex >= sequence.length) {
            // All previewed, go to input
            setTimeout(() => {
                setGameState('input');
            }, 500);
        }
    }, [gameState, currentPreviewIndex, sequence.length, previewDuration]);

    const handlePositionClick = (position: number) => {
        if (gameState !== 'input') return;

        setSelectedPosition(position);
        setShowAnimalModal(true);
    };

    const handleAnimalSelect = (animalId: string) => {
        if (selectedPosition === null) return;

        // Remove existing answer for this position if exists
        const otherAnswers = userAnswers.filter(a => a.position !== selectedPosition);
        // Add new answer
        const newAnswers = [...otherAnswers, { position: selectedPosition, animal: animalId }];

        setUserAnswers(newAnswers);
        setShowAnimalModal(false);
        setSelectedPosition(null);
    };

    const submitAnswers = () => {
        // Only check if user has selected enough animals
        if (userAnswers.length < sequence.length) {
            const remaining = sequence.length - userAnswers.length;
            if (!confirm(`Вы отметили не всех животных. Осталось: ${remaining}. Вы уверены что хотите завершить?`)) {
                return;
            }
        }

        // Check correctness
        let correct = 0;
        // Check each expected sequence item
        sequence.forEach(item => {
            // Find if user put the correct animal in the correct position
            const userAnswer = userAnswers.find(a => a.position === item.position);
            if (userAnswer && userAnswer.animal === item.animal) {
                correct++;
            }
        });

        setScore(correct);
        setGameState('result');
    };

    const nextLevel = () => {
        if (score === sequence.length) {
            setLevel(Math.min(level + 1, 10));
        }
        setGameState('intro');
        setScore(0);
    };

    const restartLevel = () => {
        setGameState('intro');
        setScore(0);
    };

    const getAnimalById = (id: string | null) => id ? ANIMALS.find(a => a.id === id) : undefined;

    // Helper to render the grid content based on state
    const renderGridCell = (index: number) => {

        // PREVIEW STATE
        if (gameState === 'preview') {
            const currentItem = sequence[currentPreviewIndex];
            // Only show if it matches current item being previewed
            if (currentItem && currentItem.position === index) {
                const animal = getAnimalById(currentItem.animal);
                return (
                    <div className="w-full h-full flex items-center justify-center animate-in fade-in zoom-in duration-300">
                        <div className="relative">
                            <img
                                src={animal?.image}
                                alt={animal?.name}
                                className="w-40 h-40 object-contain"
                            />
                            {showAnimalNames && (
                                <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-bold text-black drop-shadow-md">
                                    {animal?.name}
                                </p>
                            )}
                        </div>
                    </div>
                );
            }
            // Otherwise, show empty space (no frame)
            return <div className="w-full h-full" />;
        }

        // INPUT STATE
        if (gameState === 'input') {
            const answer = userAnswers.find(a => a.position === index);
            const animal = getAnimalById(answer?.animal || null);

            return (
                <div
                    onClick={() => handlePositionClick(index)}
                    className={`
                        w-full h-full rounded-2xl border-2 transition-all cursor-pointer
                        flex items-center justify-center relative
                        ${answer
                            ? 'border-green-400 bg-white/20'
                            : 'border-white/20 bg-white/10 hover:bg-white/20 hover:border-white/40'}
                    `}
                >
                    {animal ? (
                        <>
                            <img
                                src={animal.image}
                                alt={animal.name}
                                className="w-32 h-32 object-contain"
                            />
                            {showAnimalNames && (
                                <p className="absolute bottom-2 font-bold text-sm text-black drop-shadow-md">
                                    {animal.name}
                                </p>
                            )}
                        </>
                    ) : (
                        <span className="text-white/30 text-4xl">?</span>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <div
            className="min-h-screen flex flex-col relative"
            style={{
                backgroundImage: 'url(/magic-forest-bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20" />

            {/* Back Button */}
            <div className="absolute top-6 left-6 z-[100]">
                <Link href={backPath}>
                    <button className="p-2 hover:bg-white/20 bg-white/10 backdrop-blur-sm rounded-full transition-all hover:scale-110 active:scale-95">
                        <ArrowLeft size={24} className="text-white" />
                    </button>
                </Link>
            </div>

            {/* Title */}
            <div className="relative z-10 text-center pt-6 pb-2 min-h-[120px]">
                <h1 className="text-5xl font-bold text-white drop-shadow-lg">Волшебный лес</h1>
                <p className="text-2xl text-white/90 mt-2">Уровень {level}</p>

                {gameState === 'preview' && (
                    <div className="mt-4 bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow-lg inline-block">
                        <p className="text-xl font-bold text-gray-800">
                            Запомните, где появляются животные
                        </p>
                    </div>
                )}
                {gameState === 'input' && (
                    <div className="mt-4 bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow-lg inline-block">
                        <p className="text-xl font-bold text-gray-800">
                            Найдите {sequence.length} животных
                        </p>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center relative z-10 px-6 py-4">

                {/* Intro State */}
                {gameState === 'intro' && (
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-12 shadow-2xl max-w-2xl text-center">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">
                            Добро пожаловать в наш волшебный лес!
                        </h2>
                        <p className="text-xl text-gray-700 mb-4">
                            Тренировка зрительной памяти. Запоминайте местоположение животных.
                        </p>
                        <p className="text-lg text-gray-600 mb-6">
                            Уровень {level}: {getAnimalsCountForLevel(level)} {getAnimalsCountForLevel(level) >= 2 && getAnimalsCountForLevel(level) <= 4 ? 'зверя' : 'зверей'}.
                        </p>

                        {/* Settings - Hidden when locked */}
                        {!isLocked && (
                            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200 space-y-4">
                                <label className="flex items-center justify-center gap-3 cursor-pointer">
                                    <span className="text-gray-700 font-medium">Показывать названия</span>
                                    <button
                                        type="button"
                                        onClick={() => setShowAnimalNames(!showAnimalNames)}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${showAnimalNames ? 'bg-green-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ${showAnimalNames ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </label>

                                <div className="flex items-center justify-center gap-4">
                                    <span className="text-gray-700 font-medium">Время показа животного:</span>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewDuration(Math.max(1, previewDuration - 1))}
                                        className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-bold transition-all"
                                    >
                                        −
                                    </button>
                                    <span className="text-xl font-bold text-gray-800 w-12 text-center">{previewDuration}сек</span>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewDuration(Math.min(10, previewDuration + 1))}
                                        className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-bold transition-all"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={startLevel}
                            className="px-12 py-4 bg-green-500 text-white text-xl rounded-full font-bold hover:bg-green-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Начать
                        </button>

                        {/* Level selection - Hidden when locked */}
                        {!isLocked && (
                            <div className="mt-6 flex gap-2 justify-center flex-wrap">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => (
                                    <button
                                        key={lvl}
                                        onClick={() => setLevel(lvl)}
                                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${level === lvl
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Game Grid (Preview & Input states) */}
                {(gameState === 'preview' || gameState === 'input') && (
                    <div className="w-full max-w-4xl aspect-[4/3] max-h-[70vh]">
                        <div className="grid grid-cols-4 grid-rows-3 gap-6 w-full h-full p-6">
                            {Array.from({ length: 12 }).map((_, index) => (
                                <div key={index} className="relative">
                                    {renderGridCell(index)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Submit Button (Input only) */}
                {gameState === 'input' && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                        <button
                            onClick={submitAnswers}
                            className={`
                                px-10 py-4 text-white text-xl rounded-full font-bold shadow-lg transition-all
                                ${userAnswers.length === sequence.length
                                    ? 'bg-green-500 hover:bg-green-600 hover:shadow-xl hover:scale-105'
                                    : 'bg-blue-500/80 hover:bg-blue-500'}
                             `}
                        >
                            Готово ({userAnswers.length}/{sequence.length})
                        </button>
                    </div>
                )}

                {/* Result State */}
                {gameState === 'result' && (
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl max-w-3xl w-full text-center">
                        <h2 className="text-4xl font-bold mb-4">
                            {score === sequence.length ? (
                                <span className="text-green-600">🎉 Великолепно!</span>
                            ) : (
                                <span className="text-orange-600">Результат</span>
                            )}
                        </h2>
                        <p className="text-xl text-gray-700 mb-6">
                            Вы нашли <span className="font-bold text-blue-600">{score}</span> из {sequence.length}
                        </p>

                        <div className="grid grid-cols-6 gap-2 mb-6">
                            {/* Render Logic for Result is slightly more complex if we want to show grid context, 
                                but usually a summary list is better for clarity on what was missed.
                                Let's list the *Sequence* and show User's choice next to it.
                            */}
                            {sequence.map((item, idx) => {
                                const answer = userAnswers.find(a => a.position === item.position);
                                const isCorrect = answer?.animal === item.animal;
                                const animal = getAnimalById(item.animal);

                                return (
                                    <div key={idx} className={`p-2 rounded border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                        <div className="text-xs text-gray-500 mb-1">Позиция {item.position + 1}</div>
                                        <img src={animal?.image} className="w-20 h-20 object-contain mx-auto" />
                                        {!isCorrect && (
                                            <div className="mt-1 pt-1 border-t border-gray-200">
                                                <span className="text-xs text-red-500">
                                                    {answer ? 'Ошибка' : 'Пусто'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-4 justify-center flex-wrap">
                            {score === sequence.length && level < 10 && !isLocked && (
                                <button
                                    onClick={nextLevel}
                                    className="px-8 py-3 bg-green-500 text-white text-lg rounded-full font-bold hover:bg-green-600 transition-all shadow-lg"
                                >
                                    Уровень {level + 1}
                                </button>
                            )}
                            <button
                                onClick={restartLevel}
                                className="px-8 py-3 bg-blue-500 text-white text-lg rounded-full font-bold hover:bg-indigo-600 transition-all shadow-lg"
                            >
                                Переиграть
                            </button>
                            {/* Next Exercise Button - only when locked and passed */}
                            {isLocked && score === sequence.length && (
                                <Link href={getNextPath()}>
                                    <button
                                        onClick={() => lockedCompleteExercise({ score, total: sequence.length, level }, true)}
                                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white text-lg rounded-full font-bold shadow-lg transition-all flex items-center gap-2"
                                    >
                                        {hasNextExercise ? 'К следующему упражнению →' : 'Готово ✓'}
                                        <ArrowRight size={18} />
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Animal Selection Modal */}
            {showAnimalModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-4xl w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">
                                Выберите животное
                            </h3>
                            <button
                                onClick={() => {
                                    // Clearing selection logic if needed, or just close
                                    const newAnswers = userAnswers.filter(a => a.position !== selectedPosition);
                                    setUserAnswers(newAnswers);
                                    setShowAnimalModal(false);
                                    setSelectedPosition(null);
                                }}
                                className="text-red-500 font-semibold hover:bg-red-50 px-3 py-1 rounded transition-colors"
                            >
                                Очистить клетку
                            </button>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                            {ANIMALS.map(animal => (
                                <button
                                    key={animal.id}
                                    onClick={() => handleAnimalSelect(animal.id)}
                                    className="p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-2 group"
                                >
                                    <img
                                        src={animal.image}
                                        alt={animal.name}
                                        className="w-16 h-16 object-contain group-hover:scale-110 transition-transform"
                                    />
                                    {showAnimalNames && (
                                        <p className="text-xs font-semibold text-gray-600 group-hover:text-blue-600">
                                            {animal.name}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setShowAnimalModal(false);
                                setSelectedPosition(null);
                            }}
                            className="mt-8 px-8 py-2 bg-gray-100 text-gray-600 rounded-full font-semibold hover:bg-gray-200 transition-all mx-auto block"
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
