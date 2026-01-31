import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, CheckCircle, HelpCircle, X, ArrowRight } from "lucide-react";
import { useLessonConfig } from "@/hooks/use-lesson-config";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";
import { Question, testQuestions, getImagePath } from "@/lib/vocabulary";

const russianAlphabet = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";

function generateOptions(correctLetter: string): string[] {
    const options = [correctLetter];
    while (options.length < 4) {
        const randomChar = russianAlphabet.charAt(Math.floor(Math.random() * russianAlphabet.length));
        if (!options.includes(randomChar)) {
            options.push(randomChar);
        }
    }
    return options.sort(() => Math.random() - 0.5);
}

export default function VocabularyTest() {
    const { config, isLessonMode, timeRemaining, isTimeUp, completeExercise } = useLessonConfig();
    const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('vocabulary-test');

    const [phase, setPhase] = useState<'idle' | 'running' | 'results'>('idle');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [wrongAnswers, setWrongAnswers] = useState(0);
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const [isAnswering, setIsAnswering] = useState(true);
    const [exerciseCompleted, setExerciseCompleted] = useState(false);

    // Word count state
    const [wordCount, setWordCount] = useState(20); // default 20 words

    // Modals
    const [showHelp, setShowHelp] = useState(false);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorInfo, setErrorInfo] = useState<{ name: string; correctLetter: string; selectedLetter: string } | null>(null);

    // Shuffled questions
    const shuffledQuestions = useMemo(() => {
        return [...testQuestions].sort(() => Math.random() - 0.5);
    }, []);

    const currentQuestion = shuffledQuestions[currentQuestionIndex];

    const options = useMemo(() => {
        if (currentQuestion) {
            return generateOptions(currentQuestion.correctLetter);
        }
        return [];
    }, [currentQuestion?.id, currentQuestionIndex]);

    // Handle time up
    useEffect(() => {
        if (isTimeUp && isLessonMode && phase === 'running') {
            handleCompleteExercise();
        }
    }, [isTimeUp, isLessonMode, phase]);

    // Apply locked parameters
    useEffect(() => {
        if (isLocked && lockedParameters) {
            if (lockedParameters.wordCount !== undefined) setWordCount(Number(lockedParameters.wordCount));
        }
    }, [isLocked, lockedParameters]);

    const handleCompleteExercise = async () => {
        if (!isLessonMode) return;
        stopTest();

        const result = {
            correctAnswers,
            wrongAnswers,
            accuracy: wordCount > 0 ? Math.round((correctAnswers / wordCount) * 100) : 100,
            questionsCompleted: currentQuestionIndex + 1,
        };

        const success = await completeExercise(result);
        if (success) {
            setExerciseCompleted(true);
        }
    };

    const totalAttempts = correctAnswers + wrongAnswers;
    const accuracy = wordCount > 0 ? Math.round((correctAnswers / wordCount) * 100) : 100;

    const startTest = () => {
        setPhase('running');
        setCurrentQuestionIndex(0);
        setCorrectAnswers(0);
        setWrongAnswers(0);
        setSelectedLetter(null);
        setIsAnswering(true);
    };

    const stopTest = () => {
        setPhase('results');
        setShowResultsModal(true);
    };

    const handleAnswer = (letter: string) => {
        if (!isAnswering || !currentQuestion) return;
        setIsAnswering(false);
        setSelectedLetter(letter);

        const isCorrect = letter === currentQuestion.correctLetter;

        if (isCorrect) {
            setCorrectAnswers(prev => prev + 1);
            setTimeout(nextQuestion, 600);
        } else {
            setWrongAnswers(prev => prev + 1);
            setErrorInfo({
                name: currentQuestion.name,
                correctLetter: currentQuestion.correctLetter,
                selectedLetter: letter
            });
            setShowErrorModal(true);
        }
    };

    const nextQuestion = () => {
        setShowErrorModal(false);
        setSelectedLetter(null);
        setIsAnswering(true);

        const nextIndex = currentQuestionIndex + 1;
        const newTotalAttempts = correctAnswers + wrongAnswers;

        // End when reached word count or ran out of questions
        if (newTotalAttempts >= wordCount || nextIndex >= shuffledQuestions.length) {
            stopTest();
        } else {
            setCurrentQuestionIndex(nextIndex);
        }
    };

    const getButtonClass = (letter: string) => {
        if (!selectedLetter) {
            return 'bg-white border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400';
        }

        if (letter === selectedLetter) {
            if (letter === currentQuestion?.correctLetter) {
                return 'bg-green-500 border-2 border-green-600 text-white';
            } else {
                return 'bg-red-500 border-2 border-red-600 text-white';
            }
        }

        return 'bg-gray-100 border-2 border-gray-200 text-gray-400';
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

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

            {/* Header Bar */}
            <div className="bg-white border-b border-gray-100 py-4 px-6">
                <div className="flex items-center justify-between gap-6">
                    {/* Left section */}
                    <div className="flex items-center gap-4">
                        <Link href={backPath}>
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500">
                                <ArrowLeft size={24} />
                            </button>
                        </Link>
                        <h1 className="text-xl font-bold text-gray-800">Словарный запас</h1>

                        {/* Start/Stop Button */}
                        <button
                            onClick={phase === 'idle' ? startTest : stopTest}
                            className={`px-6 py-2 text-sm font-bold rounded-full transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${phase === 'running'
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                        >
                            <Play size={18} fill="currentColor" />
                            {phase === 'idle' ? 'Начать тест' : phase === 'running' ? 'Стоп' : 'Ещё раз'}
                        </button>

                        {/* Progress Display */}
                        <div className="text-xl font-bold text-blue-600">
                            {totalAttempts} / {wordCount}
                        </div>

                        {/* Word Count Control - Hidden when locked */}
                        {!isLocked && phase === 'idle' && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Слов</span>
                                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1.5">
                                    <button
                                        onClick={() => setWordCount(Math.max(10, wordCount - 10))}
                                        disabled={wordCount <= 10 || phase !== 'idle'}
                                        className="p-2 rounded disabled:opacity-50 hover:bg-gray-100 text-gray-600 transition-colors"
                                    >
                                        <span className="text-lg font-bold">−</span>
                                    </button>
                                    <span className="w-12 text-center font-bold text-gray-800">
                                        {wordCount}
                                    </span>
                                    <button
                                        onClick={() => setWordCount(Math.min(100, wordCount + 10))}
                                        disabled={wordCount >= 100 || phase !== 'idle'}
                                        className="p-2 rounded disabled:opacity-50 hover:bg-gray-100 text-gray-600 transition-colors"
                                    >
                                        <span className="text-lg font-bold">+</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right section */}
                    <div className="flex items-center gap-4">
                        {isLessonMode && (
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                                📚 Занятие
                            </span>
                        )}
                        <button
                            onClick={() => setShowHelp(true)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500"
                        >
                            <HelpCircle size={24} />
                        </button>
                    </div>
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
                            <p><strong>Цель:</strong> Выберите первую букву названия изображённого предмета.</p>
                            <p><strong>Правила:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>На экране появляется картинка</li>
                                <li>Выберите одну из четырёх букв</li>
                                <li>При ошибке будет показан правильный ответ</li>
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
                {phase === 'idle' ? (
                    <>
                        {/* Idle state - show placeholder */}
                        <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-blue-600 flex items-center justify-center bg-yellow-400">
                            <span className="text-6xl">📖</span>
                        </div>
                        <button
                            onClick={startTest}
                            className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-full shadow-lg transition-all transform hover:scale-105"
                        >
                            НАЧАТЬ ТЕСТ
                        </button>
                    </>
                ) : currentQuestion ? (
                    <>
                        {/* Image Display */}
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                            <img
                                src={getImagePath(currentQuestion.image)}
                                alt={currentQuestion.name}
                                className="w-48 h-48 md:w-64 md:h-64 object-contain"
                            />
                        </div>

                        {/* Instructions */}
                        <p className="text-gray-600 text-center text-lg">
                            Выберите первую букву изображённого предмета
                        </p>

                        {/* Letter Options */}
                        <div className="flex gap-4">
                            {options.map(letter => (
                                <button
                                    key={letter}
                                    onClick={() => handleAnswer(letter)}
                                    disabled={!isAnswering}
                                    className={`w-16 h-16 md:w-20 md:h-20 rounded-xl font-bold text-2xl md:text-3xl transition-all ${getButtonClass(letter)}`}
                                >
                                    {letter}
                                </button>
                            ))}
                        </div>
                    </>
                ) : null}
            </div>

            {/* Error Modal */}
            {showErrorModal && errorInfo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-red-500">Неверный ответ</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600">
                                На картинке было изображено <strong>{errorInfo.name}</strong>.
                            </p>
                            <p className="text-gray-600 mt-2">
                                Поскольку слово "{errorInfo.name}" начинается с буквы "<strong>{errorInfo.correctLetter}</strong>", нужно было выбрать "<strong>{errorInfo.correctLetter}</strong>".
                            </p>
                        </div>
                        <div className="border-t border-gray-200 p-6">
                            <button
                                onClick={nextQuestion}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all"
                            >
                                Далее
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Modal */}
            {showResultsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="text-6xl mb-4">{accuracy >= (requiredResult?.minValue ?? 0) ? '🎉' : '📊'}</div>
                        <div className={`${accuracy >= (requiredResult?.minValue ?? 0) ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'} text-white px-8 py-6 rounded-xl shadow-lg inline-block`}>
                            <p className="text-2xl font-bold mb-2">
                                {isLocked && accuracy >= (requiredResult?.minValue ?? 0)
                                    ? (hasNextExercise ? 'Упражнение завершено!' : 'Занятие завершено!')
                                    : 'Результаты теста'}
                            </p>
                            <div className="text-lg opacity-90 space-y-1">
                                <p>Правильных ответов: {correctAnswers} из {wordCount}</p>
                                <p>Точность: {accuracy}%</p>
                            </div>
                        </div>
                        <div className="mt-6">
                            {isLocked && accuracy >= (requiredResult?.minValue ?? 0) ? (
                                <Link href={getNextPath()}>
                                    <button
                                        onClick={() => lockedCompleteExercise({ accuracy, correctAnswers, wrongAnswers }, true)}
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-all"
                                    >
                                        {hasNextExercise ? 'К следующему упражнению →' : 'Готово ✓'}
                                    </button>
                                </Link>
                            ) : isLocked ? (
                                <button
                                    onClick={() => {
                                        setShowResultsModal(false);
                                        setPhase('idle');
                                        setCurrentQuestionIndex(0);
                                        setCorrectAnswers(0);
                                        setWrongAnswers(0);
                                    }}
                                    className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-lg transition-all"
                                >
                                    Попробовать ещё раз
                                </button>
                            ) : (
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-all"
                                >
                                    Пройти ещё раз
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
