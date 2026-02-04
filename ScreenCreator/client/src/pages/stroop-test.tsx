import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Square, HelpCircle, X, Settings } from "lucide-react";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";

const STROOP_WORDS = [
  { text: "СИНИЙ", color: "text-red-500" },
  { text: "КРАСНЫЙ", color: "text-green-500" },
  { text: "ЗЕЛЁНЫЙ", color: "text-blue-500" },
  { text: "ЖЁЛТЫЙ", color: "text-yellow-300" },
  { text: "КРАСНЫЙ", color: "text-blue-500" },
  { text: "СИНИЙ", color: "text-green-500" },
  { text: "ЖЁЛТЫЙ", color: "text-red-500" },
  { text: "ЗЕЛЁНЫЙ", color: "text-yellow-300" },
];

const CLAP_COLORS = ["text-red-500", "text-green-500", "text-blue-500", "text-yellow-300", "text-purple-500", "text-pink-500", "text-indigo-500", "text-cyan-500"];

const POSITIONS = [
  { top: "20%", left: "20%" },
  { top: "20%", left: "80%" },
  { top: "50%", left: "50%" },
  { top: "80%", left: "20%" },
  { top: "80%", left: "80%" },
  { top: "35%", left: "65%" },
  { top: "70%", left: "30%" },
  { top: "15%", left: "50%" },
  { top: "85%", left: "50%" },
];

export default function StroopTest() {
  const {
    isLocked,
    requiredResult,
    lockedParameters,
    backPath,
    assignmentId,
    studentId,
    exerciseIndex,
    totalExercises,
    hasNextExercise,
    completeExercise,
    getNextPath
  } = useLockedParams('stroop-test');

  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(null); // null = infinity
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [speed, setSpeed] = useState(0.5);
  const [fontSize, setFontSize] = useState(3);
  const [wordPosition, setWordPosition] = useState({ top: "50%", left: "50%" });
  const [showClaps, setShowClaps] = useState(false);
  const [showDistractors, setShowDistractors] = useState(false);
  const [distractors, setDistractors] = useState<Array<{ id: number, emoji: string, top: string, left: string }>>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const DISTRACTOR_EMOJIS = ['🍎', '🚗', '🏠', '🌟', '🐶', '🌳', '⚽', '🎸', '📚', '✈️', '🌈', '🔥'];

  // Apply locked parameters from assignment
  useEffect(() => {
    if (isLocked && lockedParameters) {
      if (lockedParameters.duration !== undefined) setDuration(Number(lockedParameters.duration)); // duration is already in seconds
      if (lockedParameters.speed !== undefined) setSpeed(Number(lockedParameters.speed));
      if (lockedParameters.fontSize !== undefined) setFontSize(Number(lockedParameters.fontSize));
      if (lockedParameters.showClaps !== undefined) setShowClaps(Boolean(lockedParameters.showClaps));
      if (lockedParameters.showDistractors !== undefined) setShowDistractors(Boolean(lockedParameters.showDistractors));
    }
  }, [isLocked, lockedParameters]);

  // Generate random position for word
  const generateRandomPosition = (currentPos?: { top: string; left: string }) => {
    let newPos;
    do {
      newPos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
    } while (currentPos && newPos.top === currentPos.top && newPos.left === currentPos.left);
    return newPos;
  };

  // Timer effect - counts down in locked mode, up in free mode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        if (isLocked && duration !== null) {
          // Countdown mode
          setTime((prevTime) => Math.max(0, prevTime - 1));
        } else {
          // Count up mode
          setTime((prevTime) => prevTime + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isLocked, duration]);

  // Completion detection effect - trigger when countdown reaches 0
  useEffect(() => {
    // In locked mode: time counts down, trigger at 0
    // In free mode: time counts up, trigger at duration
    const isComplete = isLocked && duration !== null
      ? time <= 0 && duration > 0  // countdown reached 0
      : duration !== null && time >= duration;  // count up reached duration

    if (isRunning && isComplete) {
      setIsRunning(false);
      setIsCompleted(true);
      setCurrentWord(null);

      // Submit result to API if locked
      if (isLocked && assignmentId && studentId !== null) {
        fetch(`/api/assignments/${assignmentId}/results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseIndex,
            studentId,
            result: {
              completedDuration: duration,
              wordsShown: currentWordIndex
            },
            passed: true
          })
        }).catch(e => console.error('Failed to submit result:', e));
      }
    }
  }, [time, duration, isRunning, isLocked, assignmentId, studentId, exerciseIndex, currentWordIndex]);

  // Word display effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      const wordIndex = currentWordIndex % STROOP_WORDS.length;
      const isClap = showClaps && Math.random() < 0.15;
      const displayText = isClap ? "ХЛОПОК" : STROOP_WORDS[wordIndex].text;
      setCurrentWord(displayText);
      setWordPosition((prevPos) => generateRandomPosition(prevPos));

      const intervalMs = 1000 / speed;

      interval = setInterval(() => {
        setCurrentWordIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          const wordIndex = nextIndex % STROOP_WORDS.length;
          const isClap = showClaps && Math.random() < 0.15;
          const displayText = isClap ? "ХЛОПОК" : STROOP_WORDS[wordIndex].text;
          setCurrentWord(displayText);
          setWordPosition((prevPos) => generateRandomPosition(prevPos));
          return nextIndex;
        });
      }, intervalMs);
    }
    return () => clearInterval(interval);
  }, [isRunning, speed, showClaps]);

  // Distractor effect - random positions with collision detection
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const generateNonOverlappingPosition = (existing: typeof distractors) => {
      const minDistance = 15; // minimum distance in percentage
      let attempts = 0;
      let top: number, left: number;

      do {
        top = 10 + Math.random() * 75;
        left = 10 + Math.random() * 80;
        attempts++;

        const overlaps = existing.some(d => {
          const dTop = parseFloat(d.top);
          const dLeft = parseFloat(d.left);
          const distance = Math.sqrt(Math.pow(top - dTop, 2) + Math.pow(left - dLeft, 2));
          return distance < minDistance;
        });

        if (!overlaps) break;
      } while (attempts < 20);

      return { top: `${top}%`, left: `${left}%` };
    };

    if (isRunning && showDistractors) {
      interval = setInterval(() => {
        setDistractors(prev => {
          const pos = generateNonOverlappingPosition(prev);
          const newDistractor = {
            id: Date.now(),
            emoji: DISTRACTOR_EMOJIS[Math.floor(Math.random() * DISTRACTOR_EMOJIS.length)],
            top: pos.top,
            left: pos.left
          };
          return [...prev.slice(-3), newDistractor];
        });
      }, 1000 + Math.random() * 500);
    } else {
      setDistractors([]);
    }
    return () => clearInterval(interval);
  }, [isRunning, showDistractors]);

  const handleStart = () => {
    // For locked countdown mode, start from duration
    if (isLocked && duration !== null) {
      setTime(duration);
    } else {
      setTime(0);
    }
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTime(0);
    setCurrentWord(null);
  };

  const formatTime = (totalSeconds: number) => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const getCurrentWordColor = () => {
    if (currentWord === "ХЛОПОК") {
      const clapColorIndex = currentWordIndex % CLAP_COLORS.length;
      return CLAP_COLORS[clapColorIndex];
    }
    const wordIndex = currentWordIndex % STROOP_WORDS.length;
    return STROOP_WORDS[wordIndex].color;
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
            <h1 className="text-xl font-bold text-gray-800">Тест Струпа</h1>
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
        {/* Left Sidebar - Settings */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
          {/* Start/Stop Button */}
          <button
            onClick={isRunning ? handleStop : handleStart}
            className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${isRunning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
          >
            {isRunning ? <Square size={18} /> : <Play size={18} />}
            {isRunning ? 'Остановить' : 'Начать тест'}
          </button>

          {/* Timer Display */}
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-blue-600">
              {formatTime(time)}
            </div>
          </div>

          {/* Settings - hidden when from assignment */}
          {!isLocked && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings size={16} className="text-gray-500" />
                <span className="font-medium text-gray-700">Настройки</span>
              </div>

              {/* Speed Control */}
              <div className="mb-4">
                <label className="text-sm text-gray-500 block mb-2 text-center">Скорость</label>
                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                  <button
                    onClick={() => setSpeed(Math.max(0.1, speed - (speed > 0.5 ? 0.5 : 0.1)))}
                    disabled={isRunning || speed <= 0.1}
                    className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                  >−</button>
                  <span className="font-bold text-xl text-gray-800 min-w-[3rem] text-center">{speed.toFixed(1)}</span>
                  <button
                    onClick={() => setSpeed(Math.min(5, speed + (speed < 0.5 ? 0.1 : 0.5)))}
                    disabled={isRunning || speed >= 5}
                    className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                  >+</button>
                </div>
              </div>

              {/* Duration Control */}
              <div className="mb-4">
                <label className="text-sm text-gray-500 block mb-2 text-center">Продолжительность</label>
                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                  <button
                    onClick={() => setDuration(prev => prev === null ? 120 : Math.max(30, prev - 30))}
                    disabled={isRunning}
                    className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                  >−</button>
                  <span className="font-bold text-xl text-gray-800 min-w-[3rem] text-center">
                    {duration === null ? <span className="text-2xl">∞</span> : formatTime(duration)}
                  </span>
                  <button
                    onClick={() => setDuration(prev => {
                      if (prev === null) return 120; // start from 2 min
                      if (prev >= 600) return null; // max reached, go to infinity
                      return prev + 30;
                    })}
                    disabled={isRunning}
                    className="w-10 h-10 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                  >+</button>
                </div>
              </div>

              {/* Font Size Control */}
              <div className="mb-4">
                <label className="text-sm text-gray-500 block mb-2 text-center">Шрифт</label>
                <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 px-1 py-1">
                  <button
                    onClick={() => setFontSize(Math.max(1, fontSize - 0.5))}
                    disabled={isRunning || fontSize <= 1}
                    className="w-10 h-10 flex items-center justify-center text-lg text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                  >A−</button>
                  <span className="font-bold text-xl text-gray-800 min-w-[3rem] text-center">{fontSize.toFixed(1)}</span>
                  <button
                    onClick={() => setFontSize(Math.min(10, fontSize + 0.5))}
                    disabled={isRunning || fontSize >= 10}
                    className="w-10 h-10 flex items-center justify-center text-lg text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-all"
                  >A+</button>
                </div>
              </div>

              {/* Claps Toggle */}
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-gray-500">Хлопки</label>
                <button
                  onClick={() => setShowClaps(!showClaps)}
                  disabled={isRunning}
                  className={`w-10 h-5 rounded-full transition-all ${showClaps ? 'bg-orange-500' : 'bg-gray-300'} disabled:opacity-50`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${showClaps ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Distractors Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-500">Помехи</label>
                <button
                  onClick={() => setShowDistractors(!showDistractors)}
                  disabled={isRunning}
                  className={`w-10 h-5 rounded-full transition-all ${showDistractors ? 'bg-purple-500' : 'bg-gray-300'} disabled:opacity-50`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${showDistractors ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center - Game Area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-white">
          {/* Background Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
            <img src="/logo.png" alt="Logo" className="w-1/3 max-w-md object-contain" />
          </div>

          {/* Distractors */}
          {distractors.map((d) => (
            <div
              key={d.id}
              style={{
                position: "absolute",
                top: d.top,
                left: d.left,
                transform: "translate(-50%, -50%)",
                fontSize: "8rem",
                opacity: 0.7,
                pointerEvents: "none",
                animation: "fadeIn 0.3s ease-out"
              }}
            >
              {d.emoji}
            </div>
          ))}

          {currentWord ? (
            <div
              style={{
                position: "absolute",
                top: wordPosition.top,
                left: wordPosition.left,
                transform: "translate(-50%, -50%)",
                transition: "all 0.1s ease-out",
                fontSize: `${fontSize * 1.4}rem`,
                maxWidth: "70vw",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "clip",
              }}
              className={`font-bold ${getCurrentWordColor()}`}
            >
              {currentWord}
            </div>
          ) : isCompleted ? (
            /* Completion banner - shown for all modes */
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-6 rounded-xl shadow-lg inline-block">
                <p className="text-2xl font-bold mb-2">
                  {isLocked && hasNextExercise ? 'Упражнение завершено!' : 'Тест завершён!'}
                </p>
                <p className="text-lg opacity-90">
                  Время: {formatTime(duration || time)}
                </p>
              </div>
              <div className="mt-6">
                {isLocked ? (
                  <Link href={getNextPath()}>
                    <button
                      onClick={() => completeExercise({ time: duration || time }, true)}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all"
                    >
                      {hasNextExercise ? 'К следующему упражнению →' : 'Готово ✓'}
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setIsCompleted(false);
                      setTime(0);
                    }}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition-all"
                  >
                    Начать заново
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
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
                  <div className="text-6xl mb-4">🎨</div>
                  <div className="text-xl text-gray-500">
                    Нажмите "Начать тест"
                  </div>
                </>
              )}
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
              <p><strong>Цель:</strong> Называть цвет слова, а не читать само слово.</p>
              <p><strong>Пример:</strong> Если написано <span className="text-red-500 font-bold">СИНИЙ</span>, нужно сказать "Красный".</p>
              <p><strong>Режим "Хлопки":</strong> При появлении слова "ХЛОПОК" нужно хлопнуть в ладоши.</p>
              <p><strong>Настройки:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Скорость — как быстро меняются слова</li>
                <li>Размер шрифта — размер слов на экране</li>
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
