import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, RefreshCw, Trophy, Play, Settings, HelpCircle, X, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLockedParams, formatRequiredResult } from "@/hooks/useLockedParams";
import { RequiredResultBanner } from "@/components/RequiredResultBanner";

interface Cell {
  id: string;
  value: number;
}

type Mode = 'single' | 'series';
type GameState = 'idle' | 'playing' | 'finished';

export default function CountingGame() {
  const {
    isLocked,
    requiredResult,
    lockedParameters,
    backPath,
    completeExercise: completeLockedExercise,
    hasNextExercise,
    getNextPath
  } = useLockedParams('counting-game');

  const [gameState, setGameState] = useState<GameState>('idle');
  const [time, setTime] = useState(0);
  /* State */
  const [gridConfig, setGridConfig] = useState<{ rows: number; cols: number; label: string }>({ rows: 3, cols: 3, label: "3x3" });
  const [mode, setMode] = useState<Mode>('single');
  const [table, setTable] = useState<Cell[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<{ time: string; penalty: number; score: number }[]>([]);
  const [endReason, setEndReason] = useState<'cleared' | 'stopped' | 'deadlock' | 'timeout' | null>(null);
  const [duration, setDuration] = useState<number | null>(null); // Time limit in seconds

  // Apply locked parameters from assignment
  useEffect(() => {
    if (isLocked && lockedParameters) {
      if (lockedParameters.mode !== undefined) setMode(lockedParameters.mode as Mode);
      if (lockedParameters.gridConfig !== undefined) {
        const config = lockedParameters.gridConfig as string;
        if (config === '3x3') setGridConfig({ rows: 3, cols: 3, label: '3x3' });
        else if (config === '3x4') setGridConfig({ rows: 3, cols: 4, label: '3x4' });
        else if (config === '4x4') setGridConfig({ rows: 4, cols: 4, label: '4x4' });
      }
      if (lockedParameters.duration !== undefined) setDuration(Number(lockedParameters.duration));
    }
  }, [isLocked, lockedParameters]);

  // Generate Table
  const generateTable = () => {
    const totalSlots = gridConfig.rows * gridConfig.cols;
    const effectiveCells = Math.floor(totalSlots / 3) * 3;
    const tripletCount = effectiveCells / 3;
    let newTable: Cell[] = [];

    const maxSum = mode === 'single' ? 10 : 50;
    const minNum = 1;

    for (let i = 0; i < tripletCount; i++) {
      let x, y, z;
      if (mode === 'single') {
        // Range 1-10: Z in [2, 10]
        z = Math.floor(Math.random() * 9) + 2; // 2..10
        x = Math.floor(Math.random() * (z - 1)) + 1; // 1..(z-1)
        y = z - x;
      } else {
        // Series: 10 to 50 (Two-digit numbers)
        // X, Y, Z >= 10.
        // Min Z = 10 + 10 = 20.
        // Max Z = 50.
        const minVal = 10;
        const maxVal = 50;

        // Z must be at least minVal + minVal = 20
        z = Math.floor(Math.random() * (maxVal - (minVal * 2) + 1)) + (minVal * 2); // 20..50

        // X must be at least minVal (10)
        // And X must leave at least minVal for Y -> X <= Z - minVal
        const maxX = z - minVal;
        x = Math.floor(Math.random() * (maxX - minVal + 1)) + minVal;
        y = z - x;
      }

      newTable.push({ id: `t${i}-1`, value: x });
      newTable.push({ id: `t${i}-2`, value: y });
      newTable.push({ id: `t${i}-3`, value: z });
    }

    // Shuffle
    for (let i = newTable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTable[i], newTable[j]] = [newTable[j], newTable[i]];
    }

    setTable(newTable);

  };

  const handleStart = () => {
    generateTable();
    setGameState('playing');
    // In locked mode with duration, start from duration (countdown)
    // Also check lockedParameters directly in case state hasn't updated yet
    const effectiveDuration = duration ?? (lockedParameters?.duration ? Number(lockedParameters.duration) : null);
    if (isLocked && effectiveDuration !== null) {
      setTime(effectiveDuration);
      setDuration(effectiveDuration); // Ensure state is synced
    } else {
      setTime(0);
    }
    setSelected([]);
  };



  const handleClaimPoints = () => {
    if (gameState !== 'playing') return;
    finishGame();
  };

  const finishGame = (overrideRemaining?: number, reason: 'cleared' | 'stopped' | 'deadlock' = 'stopped') => {
    setGameState('finished');
    setEndReason(reason);
    const remainingCount = overrideRemaining !== undefined ? overrideRemaining : table.length;
    // "Claim points... receive 10 additional seconds for each remaining number".
    const remainingPenalty = remainingCount * 10;
    const finalScoreTime = time + remainingPenalty;

    const record = {
      time: formatTime(time),
      penalty: remainingPenalty,
      score: finalScoreTime
    };
    setAttempts(prev => [...prev, record]);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTime(t => {
          if (isLocked && duration !== null) {
            // Countdown mode
            const newTime = t - 1;
            if (newTime <= 0) {
              setGameState('finished');
              setEndReason('timeout');
              const remainingCount = table.length;
              const remainingPenalty = remainingCount * 10;
              const finalScoreTime = duration + remainingPenalty;
              setAttempts(prev => [...prev, {
                time: formatTime(duration),
                penalty: remainingPenalty,
                score: finalScoreTime
              }]);
              return 0;
            }
            return newTime;
          } else {
            // Count up mode
            return t + 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, isLocked, duration, table.length]);

  const hasValidMoves = (cells: Cell[]): boolean => {
    if (cells.length < 3) return false;

    // Check all combinations of 3 cells
    for (let i = 0; i < cells.length - 2; i++) {
      for (let j = i + 1; j < cells.length - 1; j++) {
        for (let k = j + 1; k < cells.length; k++) {
          const v1 = cells[i].value;
          const v2 = cells[j].value;
          const v3 = cells[k].value;

          // Check if any form A + B = C
          if ((v1 + v2 === v3) || (v1 + v3 === v2) || (v2 + v3 === v1)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const handleCellClick = (id: string, value: number) => {
    if (gameState !== 'playing') return;

    // Toggle selection if already selected?
    if (selected.includes(id)) {
      setSelected(prev => prev.filter(sid => sid !== id));
      return;
    }

    const newSelected = [...selected, id];

    // Max 3 selected
    if (newSelected.length > 3) {
      // Maybe just replace the last one or do nothing?
      // Let's do nothing or maybe reset selection to just this one?
      // Better UX: select up to 3. If you click 4th, maybe ignore or clear others?
      // Let's just allow clicking up to 3.
      return;
    }

    setSelected(newSelected);

    if (newSelected.length === 3) {
      // Check sum
      const cell1 = table.find(c => c.id === newSelected[0]);
      const cell2 = table.find(c => c.id === newSelected[1]);
      const cell3 = table.find(c => c.id === newSelected[2]);

      if (cell1 && cell2 && cell3) {
        const v1 = cell1.value;
        const v2 = cell2.value;
        const v3 = cell3.value;

        // Check all permutations: X+Y=Z
        const valid =
          (v1 + v2 === v3) ||
          (v1 + v3 === v2) ||
          (v2 + v3 === v1);

        if (valid) {
          // Success! Remove from table
          setTimeout(() => {
            const updatedTable = table.filter(c => !newSelected.includes(c.id));
            setTable(updatedTable);
            setSelected([]);

            // Check win condition (all cleared)
            if (table.length - 3 === 0) {
              finishGame(0, 'cleared');
            } else {
              // Check for deadlock
              if (!hasValidMoves(updatedTable)) {
                // Auto-finish with remaining penalty
                setTimeout(() => {
                  finishGame(updatedTable.length, 'deadlock');
                }, 500);
              }
            }
          }, 300); // Short delay to show selection
        } else {
          // Invalid
          setTimeout(() => {
            setSelected([]);
          }, 500); // Show Error
        }
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  /* State for Rules Modal */
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white p-6 relative">
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <Link href={backPath}>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
        </Link>
      </div>

      {/* Help Button (Top Right) */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowRules(true)}
          className="p-2 hover:bg-gray-100 rounded-full transition-all"
          title="Правила игры"
        >
          <HelpCircle size={48} className="text-gray-600" />
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 flex items-center justify-center gap-2">
          Считалка
        </h1>
        <p className="text-gray-500 mt-2">Развивает навыки счёта и поле зрения</p>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
              <h2 className="text-2xl font-bold text-gray-800">Как играть?</h2>
              <button
                onClick={() => setShowRules(false)}
                className="p-2 hover:bg-white rounded-full transition-all shadow-sm active:scale-95 text-gray-500 hover:text-gray-800"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[70vh] space-y-6 text-gray-700">
              <section>
                <h3 className="text-lg font-bold text-blue-600 mb-2 flex items-center gap-2">
                  <Play size={18} className="fill-blue-600" />
                  Правила
                </h3>
                <p className="text-base leading-relaxed">
                  Ваша цель — <strong>полностью очистить поле</strong> от чисел.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Найдите <strong>три числа</strong>, где сумма двух равна третьему (А + Б = В).</li>
                  <li>Пример: <strong>2 + 3 = 5</strong> или <strong>10 + 4 = 14</strong>.</li>
                  <li>Нажмите на них в любом порядке. Если верно — они исчезнут.</li>
                </ul>
              </section>

              <div className="h-px bg-gray-100" />

              <section>
                <h3 className="text-lg font-bold text-green-600 mb-3 flex items-center gap-2">
                  <Trophy size={18} />
                  Стратегия победы
                </h3>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <strong className="block text-green-800 mb-1">1. Начинайте с больших чисел</strong>
                    <p className="text-sm">Их сложнее всего убрать. Если видите <strong>20</strong>, сразу ищите 10+10 или 5+15. Убирайте их первыми.</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <strong className="block text-blue-800 mb-1">2. Берегите "универсальные" числа</strong>
                    <p className="text-sm">Единицы (1) и двойки (2) самые полезные. Не тратьте их бездумно в начале, приберегите их, чтобы "добить" сложные числа в конце.</p>
                  </div>


                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
              <button
                onClick={() => setShowRules(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]"
              >
                Понятно, поехали! 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-8 justify-center flex-1 items-start max-w-[1400px] mx-auto w-full">
        {/* Left Controls */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-6 p-6 bg-gray-50 rounded-2xl h-fit">
          <div className="text-center">
            <div className="text-5xl font-mono font-black text-blue-600 mb-2">
              {formatTime(time)}
            </div>
          </div>

          <div className="space-y-3">
            {gameState !== 'playing' ? (
              <button
                onClick={handleStart}
                className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Play size={18} fill="currentColor" /> Начать тест
              </button>
            ) : (
              <button
                onClick={handleClaimPoints}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold shadow transition-all flex items-center justify-center gap-2"
              >
                <Square size={18} fill="currentColor" /> Стоп
              </button>
            )}
          </div>

          {/* Settings - Hidden when locked */}
          {!isLocked && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                  <button
                    className={cn("flex-1 py-1.5 text-sm font-bold rounded-md transition-all", mode === 'single' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-gray-50")}
                    onClick={() => setMode('single')}
                    disabled={gameState === 'playing'}
                  >
                    1-10
                  </button>
                  <button
                    className={cn("flex-1 py-1.5 text-sm font-bold rounded-md transition-all", mode === 'series' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-gray-50")}
                    onClick={() => setMode('series')}
                    disabled={gameState === 'playing'}
                  >
                    1-50
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Размер поля</label>
                <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                  {[
                    { rows: 3, cols: 3, label: "3x3" },
                    { rows: 3, cols: 4, label: "3x4" },
                    { rows: 4, cols: 4, label: "4x4" }
                  ].map((conf) => (
                    <button
                      key={conf.label}
                      className={cn(
                        "flex-1 py-1.5 text-sm font-bold rounded-md transition-all",
                        gridConfig.label === conf.label
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-500 hover:bg-gray-50",
                        gameState === 'playing' && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => setGridConfig(conf)}
                      disabled={gameState === 'playing'}
                    >
                      {conf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="flex-1 flex justify-center items-center min-h-[500px]">
          {gameState === 'finished' ? (
            <div className="text-center text-gray-400">
              <div className="bg-green-50 p-8 rounded-3xl border-2 border-green-200 max-w-md mx-auto">
                <Trophy className="w-16 h-16 text-green-500 mx-auto mb-4" />
                {endReason === 'deadlock' ? (
                  <>
                    <h2 className="text-3xl font-bold text-orange-600 mb-2">Ходов больше нет!</h2>
                    <p className="text-orange-800 mb-4">
                      Тупик. Игра остановлена автоматически.
                    </p>
                  </>
                ) : endReason === 'timeout' ? (
                  <>
                    <h2 className="text-3xl font-bold text-red-600 mb-2">Время вышло!</h2>
                    <p className="text-red-700 mb-4">
                      Не удалось очистить поле за отведённое время.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-green-800 mb-2">
                      {isLocked && hasNextExercise ? 'Упражнение завершено!' : 'Игра окончена!'}
                    </h2>
                    <p className="text-green-700 mb-4">
                      {table.length === 0 ? "Идеально! Стол полностью очищен." : `Осталось чисел: ${table.length}`}
                    </p>
                  </>
                )}
                <div className="text-4xl font-mono font-bold text-green-900">
                  {formatTime(attempts[attempts.length - 1]?.score || 0)}
                </div>
                <p className="text-green-600 mt-2 text-sm">
                  (Время: {attempts[attempts.length - 1]?.time} + Штраф: {attempts[attempts.length - 1]?.penalty}с)
                </p>
                {isLocked ? (
                  <Link href={hasNextExercise ? getNextPath() : '/student-dashboard'}>
                    <button
                      onClick={() => {
                        // Submit result - passed only if table was cleared (not timeout or deadlock)
                        const lastAttempt = attempts[attempts.length - 1];
                        const passed = endReason === 'cleared';
                        completeLockedExercise({
                          time: lastAttempt?.score || time,
                          formatted: lastAttempt?.time || formatTime(time),
                          penalty: lastAttempt?.penalty || 0,
                          completed: passed
                        }, passed);
                      }}
                      className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mx-auto"
                    >
                      {hasNextExercise ? 'К следующему упражнению' : 'Завершить занятие'}
                      <ArrowRight size={20} />
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={handleStart}
                    className="mt-6 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mx-auto"
                  >
                    <RefreshCw size={20} />
                    Ещё раз
                  </button>
                )}
              </div>
            </div>
          ) : table.length > 0 ? (
            <div
              className={cn(
                "grid transition-all duration-300 gap-3",
              )}
              style={{
                gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
                width: gridConfig.cols * 100 + 'px', // Approximate width based on cols
                maxWidth: '100%'
              }}
            >
              {table.map(cell => (
                <button
                  key={cell.id}
                  onClick={() => handleCellClick(cell.id, cell.value)}
                  className={cn(
                    "aspect-square rounded-xl text-3xl font-black transition-all shadow-sm border-2 flex items-center justify-center hover:scale-105 active:scale-95",
                    selected.includes(cell.id)
                      ? "bg-blue-600 text-white border-blue-700 scale-105 shadow-md"
                      : "bg-white text-gray-800 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  )}
                >
                  {mode === 'series' && cell.value < 10 ? `0${cell.value}` : cell.value}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p>Нажмите "Начать тест", чтобы играть</p>
            </div>
          )}
        </div>

        {/* History */}
        <div className="w-64 flex-shrink-0 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 h-fit max-h-[600px] overflow-y-auto">
          <h3 className="font-bold text-gray-800 mb-4 px-2">История попыток</h3>
          <div className="space-y-2">
            {attempts.map((att, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center text-sm">
                <span className="text-gray-500">#{i + 1}</span>
                <div className="text-right">
                  <span className="block font-extrabold text-gray-800">{formatTime(att.score)}</span>
                  {att.penalty > 0 && (
                    <span className="text-xs text-red-500">+{att.penalty}с штр.</span>
                  )}
                </div>
              </div>
            ))}
            {attempts.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Пока нет результатов</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
