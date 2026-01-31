import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, Clock, CheckCircle, HelpCircle, X, ArrowRight } from "lucide-react";
import { useLessonConfig } from "@/hooks/use-lesson-config";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";
import { RequiredResultBanner } from "@/components/RequiredResultBanner";

const TRIALS_PRACTICE = 6;
const TRIALS_MAIN = 60;
const DEFAULT_RESPONSE_WINDOW_MS = 800;
const INTER_TRIAL_MS = 1500;

type Phase = "idle" | "practice" | "main";
type CircleState = "idle" | "active" | "error";

interface TrialLog {
  trial: number;
  phase: string;
  target: string | null;
  clicked: string | null;
  outcome: string;
  rt: number | null;
  timestamp: number;
}

export default function AttentionTest() {
  const { config, isLessonMode, timeRemaining, isTimeUp, completeExercise: lessonCompleteExercise } = useLessonConfig();
  const { isLocked, requiredResult, lockedParameters, backPath, completeExercise: lockedCompleteExercise, hasNextExercise, getNextPath } = useLockedParams('attention-test');

  const [phase, setPhase] = useState<Phase>("idle");
  const [trialIndex, setTrialIndex] = useState(0);
  const [totalTrials, setTotalTrials] = useState(0);
  const [leftState, setLeftState] = useState<CircleState>("idle");
  const [rightState, setRightState] = useState<CircleState>("idle");
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [commissions, setCommissions] = useState(0);
  const [rts, setRts] = useState<number[]>([]);
  const [history, setHistory] = useState<TrialLog[]>([]);

  const [showHint, setShowHint] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [pressedButton, setPressedButton] = useState<"left" | "right" | null>(null);

  // Configurable settings
  const [reactionTimeLimit, setReactionTimeLimit] = useState(DEFAULT_RESPONSE_WINDOW_MS);
  const [exerciseDuration, setExerciseDuration] = useState(0); // 0 = infinite (count up)
  const [elapsedTime, setElapsedTime] = useState(0); // seconds
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const trialStartTimeRef = useRef(0);
  const trialTimeoutRef = useRef<number | null>(null);
  const interTrialTimeoutRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const activeSideRef = useRef<"left" | "right" | null>(null);
  const waitingRef = useRef(false);
  const phaseRef = useRef<Phase>("idle");
  const trialIndexRef = useRef(0);
  const totalTrialsRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (trialTimeoutRef.current) {
      clearTimeout(trialTimeoutRef.current);
      trialTimeoutRef.current = null;
    }
    if (interTrialTimeoutRef.current) {
      clearTimeout(interTrialTimeoutRef.current);
      interTrialTimeoutRef.current = null;
    }
  }, []);

  const logTrial = useCallback((outcome: string, clickedSide: string | null, rt: number | null) => {
    setHistory(prev => [
      ...prev,
      {
        trial: trialIndexRef.current,
        phase: phaseRef.current,
        target: activeSideRef.current,
        clicked: clickedSide,
        outcome,
        rt: rt ? Math.round(rt) : null,
        timestamp: Date.now()
      }
    ]);
  }, []);

  const finishPhase = useCallback(() => {
    setShowResults(true);
  }, []);

  const runTrial = useCallback(() => {
    if (pausedRef.current) return;

    if (trialIndexRef.current >= totalTrialsRef.current) {
      finishPhase();
      return;
    }

    setLeftState("idle");
    setRightState("idle");
    activeSideRef.current = null;
    waitingRef.current = false;

    interTrialTimeoutRef.current = window.setTimeout(() => {
      const side: "left" | "right" = Math.random() < 0.5 ? "left" : "right";
      activeSideRef.current = side;
      trialStartTimeRef.current = performance.now();
      waitingRef.current = true;

      if (side === "left") {
        setLeftState("active");
      } else {
        setRightState("active");
      }

      trialTimeoutRef.current = window.setTimeout(() => {
        if (waitingRef.current) {
          waitingRef.current = false;

          if (activeSideRef.current === "left") {
            setLeftState("error");
          } else {
            setRightState("error");
          }

          setMisses(prev => prev + 1);
          logTrial("miss_too_slow", null, null);
          setTimeout(() => nextTrial(), 500);
        }
      }, reactionTimeLimit);
    }, INTER_TRIAL_MS);
  }, [finishPhase, logTrial]);

  const nextTrial = useCallback(() => {
    trialIndexRef.current += 1;
    setTrialIndex(trialIndexRef.current);
    runTrial();
  }, [runTrial]);

  const handleInput = useCallback((side: "left" | "right") => {
    if (pausedRef.current) return;

    const now = performance.now();
    const rt = now - trialStartTimeRef.current;

    if (!waitingRef.current && activeSideRef.current === null) {
      return;
    }

    if (!waitingRef.current && activeSideRef.current !== null) {
      setCommissions(prev => prev + 1);
      logTrial("commission_red", side, null);
      return;
    }

    if (waitingRef.current) {
      waitingRef.current = false;
      clearTimers();

      if (side === activeSideRef.current) {
        setHits(prev => prev + 1);
        setRts(prev => [...prev, rt]);
        logTrial("hit", side, rt);
        nextTrial();
      } else {
        setCommissions(prev => prev + 1);
        logTrial("click_wrong_side", side, rt);
        if (side === "left") {
          setLeftState("error");
        } else {
          setRightState("error");
        }
        setTimeout(() => nextTrial(), 300);
      }
    }
  }, [clearTimers, logTrial, nextTrial]);



  const startTest = () => {
    setShowResults(false);

    phaseRef.current = "main";
    trialIndexRef.current = 0;
    totalTrialsRef.current = TRIALS_MAIN;

    setPhase("main");
    setTrialIndex(0);
    setTotalTrials(TRIALS_MAIN);
    setHits(0);
    setMisses(0);
    setCommissions(0);
    setRts([]);
    setHistory([]);

    // Start timer
    if (exerciseDuration > 0) {
      setElapsedTime(exerciseDuration);
    } else {
      setElapsedTime(0);
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(prev => {
        if (exerciseDuration > 0) {
          // Countdown
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setShowResults(true);
            return 0;
          }
          return prev - 1;
        } else {
          // Count up
          return prev + 1;
        }
      });
    }, 1000);

    pausedRef.current = false;
    activeSideRef.current = null;
    waitingRef.current = false;

    runTrial();
  };



  const exportResults = (format: "json" | "csv") => {
    let content = "";
    let type = "";
    let filename = `attention_test_results_${new Date().toISOString().slice(0, 10)}`;

    if (format === "json") {
      content = JSON.stringify(history, null, 2);
      type = "application/json";
      filename += ".json";
    } else {
      const headers = ["Trial", "Phase", "Target", "Clicked", "Outcome", "RT(ms)", "Timestamp"];
      content = headers.join(",") + "\n";
      content += history
        .map(row => [
          row.trial,
          row.phase,
          row.target,
          row.clicked || "",
          row.outcome,
          row.rt || "",
          new Date(row.timestamp).toISOString()
        ].join(","))
        .join("\n");
      type = "text/csv";
      filename += ".csv";
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      clearTimers();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [clearTimers]);

  // Keyboard event listener for A and D keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === "idle") return;

      const key = e.key.toLowerCase();
      if (key === "a") {
        setPressedButton("left");
        handleInput("left");
      } else if (key === "d") {
        setPressedButton("right");
        handleInput("right");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "a" || key === "d") {
        setPressedButton(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [phase, handleInput]);

  // Handle time up in lesson mode
  useEffect(() => {
    if (isTimeUp && isLessonMode && phase === "main") {
      handleCompleteExercise();
    }
  }, [isTimeUp, isLessonMode, phase]);

  const handleCompleteExercise = async () => {
    if (!isLessonMode) return;

    clearTimers();
    const result = {
      hits,
      misses,
      commissions,
      accuracy: totalEvents === 0 ? 0 : Math.round((hits / totalEvents) * 100),
      avgReactionTime: rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0,
      trialsCompleted: trialIndex,
    };

    const success = await (isLocked ? lockedCompleteExercise(result, true) : lessonCompleteExercise(result));
    if (success) {
      setExerciseCompleted(true);
    }
  };

  const totalEvents = hits + misses + commissions;
  const accuracy = totalEvents === 0 ? 0 : Math.round((hits / totalEvents) * 100);
  const avgRt = rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;

  const getCircleClasses = (state: CircleState) => {
    const base = "w-32 h-32 md:w-40 md:h-40 rounded-full border-8 cursor-pointer transition-all duration-150 flex items-center justify-center";
    if (state === "active") return `${base} bg-yellow-400 border-yellow-500 shadow-lg shadow-yellow-200`;
    if (state === "error") return `${base} bg-red-500 border-red-600 shadow-lg shadow-red-200`;
    return `${base} bg-gray-200 border-gray-300 hover:bg-gray-300`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Exercise Completed Overlay */}
      {exerciseCompleted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Упражнение завершено!</h2>
            <p className="text-gray-600 mb-4">Результаты отправлены</p>
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

      {/* Title Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={backPath}>
              <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all">
                <ArrowLeft size={24} />
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Тест на внимание</h1>
            {isLessonMode && (
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                📚 Занятие
              </span>
            )}
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all"
          >
            <HelpCircle size={24} />
          </button>
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
              <p><strong>Цель:</strong> Нажмите на кружок, который загорелся жёлтым.</p>
              <p><strong>Управление:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Клавиша <kbd className="px-2 py-1 bg-gray-100 rounded">A</kbd> — левый кружок</li>
                <li>Клавиша <kbd className="px-2 py-1 bg-gray-100 rounded">D</kbd> — правый кружок</li>
              </ul>
              <p><strong>Правила:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Успейте нажать за отведённое время</li>
                <li>Не нажимайте на неактивный кружок</li>
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

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex">
        {/* Left Panel - Settings */}
        <div className="w-72 bg-white border-r border-gray-200 p-6 flex flex-col gap-6">
          {/* Start Button */}
          <button
            onClick={phase === "idle" ? startTest : () => window.location.reload()}
            className={`w-full px-6 py-3 text-sm font-bold rounded-full transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${phase !== "idle"
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
          >
            <Play size={18} fill="currentColor" />
            {phase === "idle" ? "Начать тест" : "Стоп"}
          </button>

          {/* Settings Section - Hidden when locked or running */}
          {!isLocked && phase === 'idle' && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Clock size={18} />
                Настройки
              </h3>

              {/* Exercise Duration */}
              <div className="mb-4">
                <label className="text-sm text-gray-500 block mb-2">Время (сек)</label>
                <div className="flex items-center justify-between bg-gray-100 rounded-full px-4 py-3">
                  <button
                    onClick={() => setExerciseDuration(Math.max(0, exerciseDuration - 30))}
                    disabled={exerciseDuration <= 0 || phase !== "idle"}
                    className="w-8 h-8 rounded-full disabled:opacity-50 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center"
                  >
                    <span className="text-xl font-bold">−</span>
                  </button>
                  <span className="font-bold text-gray-800 text-xl">
                    {exerciseDuration === 0 ? "∞" : exerciseDuration}
                  </span>
                  <button
                    onClick={() => setExerciseDuration(exerciseDuration + 30)}
                    disabled={phase !== "idle"}
                    className="w-8 h-8 rounded-full disabled:opacity-50 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center"
                  >
                    <span className="text-xl font-bold">+</span>
                  </button>
                </div>
              </div>

              {/* Reaction Time */}
              <div>
                <label className="text-sm text-gray-500 block mb-2">Скорость (сек)</label>
                <div className="flex items-center justify-between bg-gray-100 rounded-full px-4 py-3">
                  <button
                    onClick={() => setReactionTimeLimit(Math.max(300, reactionTimeLimit - 100))}
                    disabled={reactionTimeLimit <= 300 || phase !== "idle"}
                    className="w-8 h-8 rounded-full disabled:opacity-50 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center"
                  >
                    <span className="text-xl font-bold">−</span>
                  </button>
                  <span className="font-bold text-gray-800 text-xl">
                    {(reactionTimeLimit / 1000).toFixed(1)}
                  </span>
                  <button
                    onClick={() => setReactionTimeLimit(Math.min(2000, reactionTimeLimit + 100))}
                    disabled={reactionTimeLimit >= 2000 || phase !== "idle"}
                    className="w-8 h-8 rounded-full disabled:opacity-50 hover:bg-gray-200 text-gray-600 transition-colors flex items-center justify-center"
                  >
                    <span className="text-xl font-bold">+</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Current Session Stats */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Clock size={18} />
              Текущая сессия
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Верно:</span>
                <span className="font-bold text-green-600">{hits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ошибки:</span>
                <span className="font-bold text-red-500">{commissions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Пропуски:</span>
                <span className="font-bold text-orange-500">{misses}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-gray-500">Точность:</span>
                <span className="font-bold text-blue-600">{accuracy}%</span>
              </div>
              {rts.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Ср. время:</span>
                  <span className="font-bold text-gray-700">{avgRt} мс</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center - Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Timer Display */}
          <div className="text-4xl font-mono font-bold text-blue-600 mb-8">
            {(() => {
              const displayTime = phase === "idle" ? exerciseDuration : elapsedTime;
              return `${Math.floor(displayTime / 60).toString().padStart(2, '0')}:${(displayTime % 60).toString().padStart(2, '0')}`;
            })()}
          </div>

          {/* Game Circles */}
          <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm mb-8">
            <div className="flex items-center justify-center gap-16">
              <div className={getCircleClasses(leftState)} onClick={() => handleInput("left")}>
                {leftState === "error" ? (
                  <span className="text-white text-4xl font-bold">✕</span>
                ) : leftState === "idle" ? (
                  <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain opacity-20" />
                ) : null}
              </div>
              <div className={getCircleClasses(rightState)} onClick={() => handleInput("right")}>
                {rightState === "error" ? (
                  <span className="text-white text-4xl font-bold">✕</span>
                ) : rightState === "idle" ? (
                  <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain opacity-20" />
                ) : null}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {phase === "idle" ? (
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
                <button
                  onClick={startTest}
                  className="w-48 h-14 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg shadow-lg transition-all transform active:scale-95"
                >
                  НАЧАТЬ ТЕСТ
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <button
                onClick={() => handleInput("left")}
                className={`w-24 h-16 rounded-xl font-bold text-xl shadow transition-all transform active:scale-95 border ${pressedButton === "left"
                  ? "bg-green-500 border-green-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 border-gray-200"
                  }`}
              >
                A
              </button>
              <button
                onClick={() => handleInput("right")}
                className={`w-24 h-16 rounded-xl font-bold text-xl shadow transition-all transform active:scale-95 border ${pressedButton === "right"
                  ? "bg-green-500 border-green-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 border-gray-200"
                  }`}
              >
                D
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - History */}
        <div className="w-72 bg-white border-l border-gray-200 p-6">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Clock size={18} />
            История попыток
          </h3>
          {history.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Нет попыток</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {history.slice(-20).reverse().map((log, i) => (
                <div
                  key={i}
                  className={`text-sm px-3 py-2 rounded-lg ${log.outcome === "hit"
                    ? "bg-green-50 text-green-700"
                    : log.outcome.startsWith("miss")
                      ? "bg-orange-50 text-orange-700"
                      : "bg-red-50 text-red-700"
                    }`}
                >
                  <span className="font-medium">#{log.trial}</span>
                  {" "}
                  {log.outcome === "hit" && `✓ ${log.rt}мс`}
                  {log.outcome === "miss_too_slow" && "⏱ Медленно"}
                  {log.outcome === "commission_wrong" && "✕ Неверный круг"}
                  {log.outcome === "commission_nogo" && "✕ Ложное нажатие"}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>



      {/* Results Modal */}
      {showResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Результаты</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Точность:</span>
                <span className="font-bold text-gray-800">{accuracy}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Среднее время реакции:</span>
                <span className="font-bold text-gray-800">{avgRt} мс</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Пропуски:</span>
                <span className="font-bold text-gray-800">{misses}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Ложные нажатия:</span>
                <span className="font-bold text-gray-800">{commissions}</span>
              </div>
            </div>
            <div className="border-t border-gray-200 p-6 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => exportResults("json")}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-full font-bold hover:bg-gray-300 transition-all"
                >
                  Скачать JSON
                </button>
                <button
                  onClick={() => exportResults("csv")}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-full font-bold hover:bg-gray-300 transition-all"
                >
                  Скачать CSV
                </button>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-bold transition-all"
              >
                Пройти ещё раз
              </button>
              {isLocked && (
                <Link href={getNextPath()}>
                  <button
                    onClick={() => {
                      const passed = accuracy >= (requiredResult?.minValue || 0);
                      lockedCompleteExercise({ hits, misses, commissions, accuracy, avgRt }, passed);
                    }}
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
