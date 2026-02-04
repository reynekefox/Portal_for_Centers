import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Plus, Minus, Play, Square } from "lucide-react";
import { RequiredResultBanner } from "@/components/RequiredResultBanner";
import { useLockedParams } from "@/hooks/useLockedParams";

interface Attempt {
  attemptNumber: number;
  time: string;
  mode: 'standard' | 'red-black';
  gridSize: number;
}

type GameMode = 'standard' | 'red-black';
type CellColor = 'black' | 'red';

interface Cell {
  value: number;
  color: CellColor;
  id: string;
}

export default function SchulteTable() {
  const {
    isLocked,
    requiredResult,
    lockedParameters,
    backPath,
    completeExercise: completeLockedExercise,
    hasNextExercise,
    getNextPath
  } = useLockedParams('schulte-table');
  const [, setLocation] = useLocation();

  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const [table, setTable] = useState<Cell[]>([]);
  const [mode, setMode] = useState<GameMode>('standard');

  // Game Logic State
  const [nextNumber, setNextNumber] = useState(1); // For standard mode
  const [nextBlack, setNextBlack] = useState(1);   // For red-black mode
  const [nextRed, setNextRed] = useState(24);      // For red-black mode
  const [currentTurn, setCurrentTurn] = useState<CellColor>('black'); // For red-black mode

  const [completed, setCompleted] = useState<string[]>([]); // Store IDs of completed cells
  const [errorCell, setErrorCell] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  // Settings
  const [useLeadingZeros, setUseLeadingZeros] = useState(false);
  const [useTempHighlight, setUseTempHighlight] = useState(false);
  const [useShuffle, setUseShuffle] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [gridSize, setGridSize] = useState<number>(5);
  const [step, setStep] = useState(1);

  // Temporary highlight state
  const [tempHighlighted, setTempHighlighted] = useState<Set<string>>(new Set());

  // Apply locked parameters from assignment
  useEffect(() => {
    if (isLocked && lockedParameters) {
      if (lockedParameters.gridSize !== undefined) setGridSize(Number(lockedParameters.gridSize));
      if (lockedParameters.step !== undefined) setStep(Number(lockedParameters.step));
      if (lockedParameters.isGorbov !== undefined) setMode(lockedParameters.isGorbov ? 'red-black' : 'standard');
      if (lockedParameters.useLeadingZeros !== undefined) setUseLeadingZeros(Boolean(lockedParameters.useLeadingZeros));
      if (lockedParameters.useTempHighlight !== undefined) setUseTempHighlight(Boolean(lockedParameters.useTempHighlight));
      if (lockedParameters.useShuffle !== undefined) setUseShuffle(Boolean(lockedParameters.useShuffle));
      if (lockedParameters.showHint !== undefined) setShowHint(Boolean(lockedParameters.showHint));
    }
  }, [isLocked, lockedParameters]);

  // Handler for completing exercise
  const handleCompleteExercise = async () => {
    if (!isLocked) return;

    const timeInSeconds = minutes * 60 + seconds;
    const passed = timeInSeconds <= (requiredResult?.minValue || Infinity);

    // Complete and navigate
    await completeLockedExercise({ time: timeInSeconds, formatted: formatTime(minutes, seconds) }, passed);

    if (hasNextExercise) {
      setLocation(getNextPath());
    } else {
      setLocation(backPath);
    }
  };

  const generateTable = () => {
    let cells: Cell[] = [];
    const totalNumbers = gridSize * gridSize;

    if (mode === 'standard') {
      const numbers = Array.from({ length: totalNumbers }, (_, i) => 1 + i * step);
      // Shuffle
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }
      cells = numbers.map(num => ({
        value: num,
        color: 'black',
        id: `s-${num}`
      }));
      setNextNumber(1);
    } else {
      // Red-Black Mode Logic
      // Even (e.g. 16): 8 Black, 8 Red
      // Odd (e.g. 25): 12 Black, 13 Red (Red has 1 more)

      const redCount = Math.floor(totalNumbers / 2);
      const blackCount = Math.ceil(totalNumbers / 2);

      const blackNumbers = Array.from({ length: blackCount }, (_, i) => 1 + i * step);
      const redNumbers = Array.from({ length: redCount }, (_, i) => 1 + i * step);

      const blackCells: Cell[] = blackNumbers.map(n => ({ value: n, color: 'black', id: `b-${n}` }));
      const redCells: Cell[] = redNumbers.map(n => ({ value: n, color: 'red', id: `r-${n}` }));

      cells = [...blackCells, ...redCells];

      // Shuffle
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
      }

      setNextBlack(1);
      setNextRed(1 + (redCount - 1) * step);
      setCurrentTurn('black');
    }

    setTable(cells);
    setCompleted([]);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
        const totalSeconds = time + 1;
        setMinutes(Math.floor(totalSeconds / 60));
        setSeconds(totalSeconds % 60);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, time]);

  const handleStart = () => {
    generateTable();
    setIsRunning(true);
    setTime(0);
    setMinutes(0);
    setSeconds(0);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTable([]);
    setCompleted([]);
    setTime(0);
    setMinutes(0);
    setSeconds(0);
  };

  const shuffleTable = (currentTable: Cell[]) => {
    const newTable = [...currentTable];
    for (let i = newTable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTable[i], newTable[j]] = [newTable[j], newTable[i]];
    }
    setTable(newTable);
  };

  const handleCellClick = (cell: Cell) => {
    if (!isRunning || !table.length) return;

    let isCorrect = false;
    let isGameFinished = false;

    if (mode === 'standard') {
      if (cell.value === nextNumber) {
        isCorrect = true;
        setNextNumber(nextNumber + step);
        if (cell.value === 1 + (gridSize * gridSize - 1) * step) {
          isGameFinished = true;
        }
      }
    } else {
      // Red-Black Mode
      // Sequence: Black 1 -> Red Max -> Black 2 -> Red Max-1 ...
      const totalNumbers = gridSize * gridSize;
      const blackCount = Math.ceil(totalNumbers / 2);
      const redCount = Math.floor(totalNumbers / 2);
      const maxBlack = 1 + (blackCount - 1) * step;

      if (currentTurn === 'black') {
        if (cell.color === 'black' && cell.value === nextBlack) {
          isCorrect = true;
          setNextBlack(nextBlack + step);
          setCurrentTurn('red');

          if (nextBlack === maxBlack && blackCount > redCount) {
            isGameFinished = true;
          }
        }
      } else {
        // Red turn
        if (cell.color === 'red' && cell.value === nextRed) {
          isCorrect = true;
          setNextRed(nextRed - step);
          setCurrentTurn('black');

          if (nextRed === 1 && blackCount === redCount) {
            isGameFinished = true;
          }
        }
      }
    }

    if (isCorrect) {
      setCompleted([...completed, cell.id]);

      // Handle Temp Highlight
      if (useTempHighlight) {
        const newTemp = new Set(tempHighlighted);
        newTemp.add(cell.id);
        setTempHighlighted(newTemp);

        setTimeout(() => {
          setTempHighlighted(prev => {
            const next = new Set(prev);
            next.delete(cell.id);
            return next;
          });
        }, 2000);
      }

      // Handle Shuffle
      if (useShuffle && !isGameFinished) {
        shuffleTable(table);
      }

      if (isGameFinished) {
        setIsRunning(false);
        const attemptTime = formatTime(minutes, seconds);
        setAttempts([...attempts, {
          attemptNumber: attempts.length + 1,
          time: attemptTime,
          mode,
          gridSize
        }]);

        // Auto-submit result for locked exercises
        if (isLocked) {
          const timeInSeconds = minutes * 60 + seconds;
          const passed = timeInSeconds <= (requiredResult?.minValue || Infinity);
          completeLockedExercise({ time: timeInSeconds, formatted: attemptTime }, passed);
        }
      }
    } else {
      // Wrong click
      setErrorCell(cell.id);
      setTimeout(() => setErrorCell(null), 500);
    }
  };

  const formatTime = (min: number, sec: number) => {
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

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

      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold text-gray-800">
          {mode === 'standard' ? 'Таблица Шульте' : 'Шульте-Горбов'}
        </h1>
      </div>

      {/* Required Result Banner - shows goal or success with next button */}
      <RequiredResultBanner
        requiredResult={requiredResult}
        isLocked={isLocked}
        isCompleted={!isRunning && completed.length > 0 && completed.length === table.length}
        isSuccess={(minutes * 60 + seconds) <= (requiredResult?.minValue || Infinity)}
        completionTime={formatTime(minutes, seconds)}
        actualValue={minutes * 60 + seconds}
        hasNextExercise={hasNextExercise}
        onComplete={handleCompleteExercise}
        nextPath={getNextPath()}
      />

      {/* Moved Settings Row - Hidden when locked */}
      {!isLocked && (
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2 cursor-pointer group" title="Добавить нули (01, 02...)">
              <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${useLeadingZeros ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <input
                  type="checkbox"
                  checked={useLeadingZeros}
                  onChange={(e) => setUseLeadingZeros(e.target.checked)}
                  className="sr-only"
                />
                <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full shadow transition-transform duration-200 ease-in-out ${useLeadingZeros ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600 transition-colors">01..</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group" title="Подсветка исчезает через 2 секунды">
              <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${useTempHighlight ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <input
                  type="checkbox"
                  checked={useTempHighlight}
                  onChange={(e) => setUseTempHighlight(e.target.checked)}
                  className="sr-only"
                />
                <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full shadow transition-transform duration-200 ease-in-out ${useTempHighlight ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600 transition-colors">Исчез.</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group" title="Перемешивать цифры после каждого клика">
              <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${useShuffle ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <input
                  type="checkbox"
                  checked={useShuffle}
                  onChange={(e) => setUseShuffle(e.target.checked)}
                  className="sr-only"
                />
                <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full shadow transition-transform duration-200 ease-in-out ${useShuffle ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600 transition-colors">Микс</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group" title="Скрыть подсказку">
              <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${showHint ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <input
                  type="checkbox"
                  checked={showHint}
                  onChange={(e) => setShowHint(e.target.checked)}
                  className="sr-only"
                />
                <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full shadow transition-transform duration-200 ease-in-out ${showHint ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600 transition-colors">Скрыть</span>
            </label>
          </div>

          {/* Instruction Text */}
          <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 mb-2 text-center max-w-md">
            {mode === 'standard' ? (
              <span>
                Находите числа от <span className="font-bold text-gray-900">1</span> до <span className="font-bold text-gray-900">{1 + (gridSize * gridSize - 1) * step}</span> в порядке возрастания.
              </span>
            ) : (
              <span>
                Чередуйте: <span className="font-bold text-black">Черные 1 → {1 + (Math.ceil((gridSize * gridSize) / 2) - 1) * step}</span> и <span className="font-bold text-blue-600">Синие {1 + (Math.floor((gridSize * gridSize) / 2) - 1) * step} → 1</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-8 justify-center flex-1 items-start">
        {/* Left Side - Controls */}
        <div className="w-48 flex flex-col items-center gap-6">
          <div className="text-4xl font-bold text-blue-600 font-mono text-center">
            {formatTime(minutes, seconds)}
          </div>

          <div className="flex flex-col gap-3 w-full">
            {/* Toggle Start/Stop Button */}
            <button
              onClick={isRunning ? handleStop : handleStart}
              className={`px-6 py-2 text-sm font-bold rounded-full transition-all shadow-md hover:shadow-lg w-full flex items-center justify-center gap-2 ${isRunning
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
            >
              {isRunning ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              {isRunning ? "Стоп" : "Начать тест"}
            </button>
          </div>

          {/* Step Setting - Hidden when locked */}
          {!isLocked && (
            <>
              <div className="w-full">
                <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 text-center mb-1">Шаг</div>
                <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1.5 w-full">
                  <button
                    onClick={() => setStep(Math.max(0, step - 1))}
                    className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors text-gray-600"
                    disabled={isRunning}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="flex-1 text-center font-bold text-gray-800 text-base">{step}</span>
                  <button
                    onClick={() => setStep(step + 1)}
                    className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors text-gray-600"
                    disabled={isRunning}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex flex-col gap-2 w-full mt-4">
                <div className="flex flex-col gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => {
                      if (!isRunning) {
                        setMode('standard');
                        setGridSize(5); // Default for standard
                        setTable([]);
                      }
                    }}
                    disabled={isRunning}
                    className={`px-3 py-2 rounded-md text-sm font-bold transition-all ${mode === 'standard'
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-700 hover:bg-gray-200"
                      } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Шульте
                  </button>
                  <button
                    onClick={() => {
                      if (!isRunning) {
                        setMode('red-black');
                        setGridSize(5); // Default for Gorbov
                        setTable([]);
                      }
                    }}
                    disabled={isRunning}
                    className={`px-3 py-2 rounded-md text-sm font-bold transition-all ${mode === 'red-black'
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-700 hover:bg-gray-200"
                      } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Шульте-Горбов
                  </button>
                </div>
              </div>

              {/* Grid Size Settings */}
              <div className="flex flex-col gap-2 w-full">
                <span className="text-sm font-semibold text-gray-600 text-center">Размер поля</span>
                <div className="flex justify-center gap-2 bg-gray-100 p-1 rounded-lg flex-wrap">
                  {(mode === 'standard' ? [3, 4, 5] : [4, 5, 6, 7]).map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        if (!isRunning) {
                          setGridSize(size);
                          setTable([]);
                        }
                      }}
                      disabled={isRunning}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${gridSize === size
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                        } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Center - Table Area */}
        <div className="flex flex-col items-center gap-6">
          {/* Predefined Table Field */}
          <div
            className={`border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 relative overflow-hidden transition-all duration-300 p-6`}
            style={{
              width: 'fit-content',
              height: 'fit-content',
              minWidth: '400px',
              minHeight: '400px'
            }}
          >
            {/* Background Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
              <img src="/logo.png" alt="Logo" className="w-1/2 object-contain" />
            </div>

            <div
              className={`grid ${gridSize >= 6 ? 'gap-2' : 'gap-6'} w-full h-full content-center justify-center`}
              style={{
                gridTemplateColumns: `repeat(${gridSize}, auto)`
              }}
            >
              {table.length > 0 ? (
                table.map((cell) => (
                  <button
                    key={cell.id}
                    onClick={() => handleCellClick(cell)}
                    className={`
                      rounded-lg font-bold transition-all border-2 flex items-center justify-center
                      ${gridSize >= 6 ? 'text-2xl' : 'text-xl'}
                      ${(useTempHighlight ? tempHighlighted.has(cell.id) : completed.includes(cell.id))
                        ? (mode === 'red-black'
                          ? (cell.color === 'red' ? "bg-blue-500 text-white border-blue-600" : "bg-gray-800 text-white border-gray-900")
                          : "bg-blue-400 text-white border-blue-500")
                        : errorCell === cell.id
                          ? "bg-red-500 text-white border-red-600 animate-pulse"
                          : `bg-white border-gray-300 hover:bg-gray-50 cursor-pointer ${cell.color === 'red' ? 'text-blue-600 border-blue-200' : 'text-gray-900 border-gray-200'
                          }`
                      }
                    `}
                    style={{
                      width: gridSize >= 6 ? '4rem' : '3.5rem',
                      height: gridSize >= 6 ? '4rem' : '3.5rem'
                    }}
                  >
                    {useLeadingZeros ? String(cell.value).padStart(2, '0') : cell.value}
                  </button>
                ))
              ) : (
                Array.from({ length: gridSize * gridSize }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border-2 border-gray-100 bg-white`}
                    style={{
                      width: gridSize >= 6 ? '4rem' : '3.5rem',
                      height: gridSize >= 6 ? '4rem' : '3.5rem'
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Status */}
          {!showHint && (
            <div className="text-xl font-semibold text-gray-800">
              {mode === 'standard' ? (
                <>Ищите: <span className="text-blue-600 text-2xl">{nextNumber}</span></>
              ) : (
                <>
                  Ищите:
                  <span className={`text-2xl ml-2 ${currentTurn === 'black' ? 'text-black' : 'text-blue-600'}`}>
                    {currentTurn === 'black' ? nextBlack : nextRed}
                  </span>
                  <span className="text-sm text-gray-400 ml-2">
                    ({currentTurn === 'black' ? 'Черный' : 'Синий'})
                  </span>
                </>
              )}
            </div>
          )}


        </div>

        {/* Right Side - Attempts History */}
        <div className="w-48 flex flex-col gap-2">
          <h3 className="text-lg font-bold text-gray-800 text-center">История</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {attempts.map((attempt) => (
              <div
                key={attempt.attemptNumber}
                className="bg-blue-50 p-2 rounded text-sm border border-blue-200 flex flex-col px-3"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">
                    #{attempt.attemptNumber}
                  </span>
                  <span className="text-blue-600 font-bold font-mono">
                    {attempt.time}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {attempt.gridSize}x{attempt.gridSize}
                  </span>
                  <span className="text-xs text-gray-500 text-right">
                    {attempt.mode === 'standard' ? 'Шульте' : 'Шульте-Горбов'}
                  </span>
                </div>
              </div>
            ))}
            {attempts.length === 0 && (
              <p className="text-gray-400 text-center text-xs">Нет результатов</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
