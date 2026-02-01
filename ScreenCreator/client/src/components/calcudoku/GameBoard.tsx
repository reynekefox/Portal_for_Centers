import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'wouter';
import Cell from './Cell';
import RadialMenu from './RadialMenu';
import { CageGenerator } from '@/lib/calcudoku/generator';
import type { PuzzleData, CellPosition, Operation } from '@/lib/calcudoku/types';
import { Play, Square } from 'lucide-react';

interface Score {
    date: string;
    time: number;
    size: number;
    paused?: boolean;
}

interface RequiredResult {
    type: string;
    minValue?: number;
}

interface GameBoardProps {
    size: number;
    ops: Operation[];
    onWin?: () => void;
    onBack: () => void;
    isLocked?: boolean;
    timeLimit?: number;
    requiredResult?: RequiredResult | null;
    onComplete?: (result: Record<string, unknown>, passed: boolean) => Promise<void>;
    hasNextExercise?: boolean;
    getNextPath?: () => string;
}

export default function GameBoard({ size, ops, onWin, onBack, isLocked = false, timeLimit, requiredResult, onComplete, hasNextExercise, getNextPath }: GameBoardProps) {
    const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
    const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
    const [isWon, setIsWon] = useState(false);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [error, setError] = useState('');
    const [errorDetails, setErrorDetails] = useState('');
    const [timeElapsed, setTimeElapsed] = useState(isLocked && timeLimit ? timeLimit : 0);
    const [isPaused, setIsPaused] = useState(false);
    const [hasUsedPause, setHasUsedPause] = useState(false);
    const [topScores, setTopScores] = useState<Score[]>([]);
    const timerInterval = useRef<number | null>(null);

    // Countdown mode for locked exercises
    const isCountdownMode = isLocked && timeLimit && timeLimit > 0;

    const startTimer = useCallback(() => {
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
        }
        setIsPaused(false);

        if (isCountdownMode) {
            // Countdown timer
            timerInterval.current = window.setInterval(() => {
                setTimeElapsed(prev => {
                    if (prev <= 1) {
                        if (timerInterval.current) clearInterval(timerInterval.current);
                        setIsTimeUp(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            // Count up timer
            timerInterval.current = window.setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        }
    }, [isCountdownMode]);

    const stopTimer = useCallback(() => {
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
    }, []);

    const togglePause = useCallback(() => {
        if (isWon) return;

        if (isPaused) {
            startTimer();
        } else {
            stopTimer();
            setIsPaused(true);
            setHasUsedPause(true);
            setSelectedCell(null);
        }
    }, [isWon, isPaused, startTimer, stopTimer]);

    const formatTime = useCallback((seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, []);

    const saveScore = useCallback(() => {
        const score: Score = {
            date: new Date().toLocaleDateString('ru-RU'),
            time: timeElapsed,
            size: size,
            paused: hasUsedPause
        };

        const key = `calcudoku_scores_${size}`;
        const existing: Score[] = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(score);

        existing.sort((a, b) => a.time - b.time);
        const top5 = existing.slice(0, 5);
        localStorage.setItem(key, JSON.stringify(top5));
        setTopScores(top5);
    }, [timeElapsed, size, hasUsedPause]);

    const validateBoard = useCallback(() => {
        if (!puzzle) return;

        const newPuzzle = { ...puzzle };

        // Reset errors
        for (let r = 0; r < newPuzzle.size; r++) {
            for (let c = 0; c < newPuzzle.size; c++) {
                newPuzzle.cells[r][c].isError = false;
            }
        }

        // Check row/col duplicates
        const puzzleSize = newPuzzle.size;
        for (let i = 0; i < puzzleSize; i++) {
            const rowVals = new Map<number, number[]>();
            const colVals = new Map<number, number[]>();

            for (let j = 0; j < puzzleSize; j++) {
                // Row
                const rVal = newPuzzle.cells[i][j].value;
                if (rVal) {
                    if (!rowVals.has(rVal)) rowVals.set(rVal, []);
                    rowVals.get(rVal)!.push(j);
                }
                // Col
                const cVal = newPuzzle.cells[j][i].value;
                if (cVal) {
                    if (!colVals.has(cVal)) colVals.set(cVal, []);
                    colVals.get(cVal)!.push(j);
                }
            }

            // Mark duplicates
            rowVals.forEach((indices) => {
                if (indices.length > 1) indices.forEach(idx => newPuzzle.cells[i][idx].isError = true);
            });
            colVals.forEach((indices) => {
                if (indices.length > 1) indices.forEach(idx => newPuzzle.cells[idx][i].isError = true);
            });
        }

        setPuzzle(newPuzzle);
    }, [puzzle]);

    const checkWinCondition = useCallback(() => {
        if (!puzzle) return;

        let isFull = true;
        let isCorrect = true;

        for (let r = 0; r < puzzle.size; r++) {
            for (let c = 0; c < puzzle.size; c++) {
                const cell = puzzle.cells[r][c];
                if (!cell.value) {
                    isFull = false;
                    break;
                }
            }
        }

        if (isFull) {
            validateBoard();

            // Check cage math
            for (const cage of puzzle.cages) {
                const values = cage.cells.map(p => puzzle.cells[p.row][p.col].value!);
                let currentResult = 0;
                const sorted = [...values].sort((a, b) => b - a);

                switch (cage.operation) {
                    case '+': currentResult = values.reduce((a, b) => a + b, 0); break;
                    case '*': currentResult = values.reduce((a, b) => a * b, 1); break;
                    case '-': currentResult = sorted[0] - sorted[1]; break;
                    case '/': currentResult = sorted[0] / sorted[1]; break;
                    case 'none': currentResult = values[0]; break;
                }

                if (currentResult !== cage.target) {
                    isCorrect = false;
                }
            }

            for (let r = 0; r < puzzle.size; r++) {
                for (let c = 0; c < puzzle.size; c++) {
                    if (puzzle.cells[r][c].isError) isCorrect = false;
                }
            }

            if (isCorrect) {
                setIsWon(true);
                stopTimer();
                saveScore();
                onWin?.();

                // Submit result for locked mode
                if (isLocked && onComplete) {
                    const elapsedTime = isCountdownMode ? (timeLimit! - timeElapsed) : timeElapsed;
                    const passed = !requiredResult?.minValue || elapsedTime <= requiredResult.minValue;
                    onComplete({ completed: true, time: elapsedTime, size }, passed);
                }
            }
        }
    }, [puzzle, validateBoard, stopTimer, saveScore, onWin, isLocked, onComplete, isCountdownMode, timeLimit, timeElapsed, requiredResult, size]);

    const initGame = useCallback(() => {
        try {
            setError('');
            setIsWon(false);
            setIsTimeUp(false);
            // Set initial time based on mode
            setTimeElapsed(isCountdownMode ? timeLimit! : 0);
            console.log('Generating puzzle...', size, ops);
            const generator = new CageGenerator(size, ops);
            setPuzzle(generator.generate());
            setSelectedCell(null);
            setHasUsedPause(false);
            setIsPaused(false);
            startTimer();
        } catch (e: any) {
            console.error('Game Gen Error:', e);
            setError('Failed to generate puzzle.');
            setErrorDetails(e.message + '\n' + (e.stack || ''));
        }
    }, [size, ops, startTimer, isCountdownMode, timeLimit]);

    useEffect(() => {
        initGame();

        // Load scores from localStorage
        const key = `calcudoku_scores_${size}`;
        const saved: Score[] = JSON.parse(localStorage.getItem(key) || '[]');
        setTopScores(saved);

        return () => stopTimer();
    }, [initGame, stopTimer, size]);

    const handleInput = useCallback((num: number | null) => {
        if (!selectedCell || !puzzle) return;
        const { row, col } = selectedCell;

        const newPuzzle = { ...puzzle };
        newPuzzle.cells[row][col].value = num;
        setPuzzle(newPuzzle);

        setSelectedCell(null);

        // Delay validation slightly to allow state to update
        setTimeout(() => {
            validateBoard();
            checkWinCondition();
        }, 0);
    }, [selectedCell, puzzle, validateBoard, checkWinCondition]);

    const handleKeydown = useCallback((e: KeyboardEvent) => {
        if (!puzzle) return;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();

            if (!selectedCell) {
                setSelectedCell({ row: 0, col: 0 });
                return;
            }

            let { row, col } = selectedCell;
            const puzzleSize = puzzle.size;

            if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
            if (e.key === 'ArrowDown') row = Math.min(puzzleSize - 1, row + 1);
            if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
            if (e.key === 'ArrowRight') col = Math.min(puzzleSize - 1, col + 1);

            setSelectedCell({ row, col });
            return;
        }

        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 1 && num <= size) {
            if (selectedCell) handleInput(num);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            if (selectedCell) handleInput(null);
        } else if (e.key === 'Escape') {
            setSelectedCell(null);
        }
    }, [puzzle, selectedCell, size, handleInput]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [handleKeydown]);

    const getBorders = useCallback((r: number, c: number) => {
        if (!puzzle) return { top: false, right: false, bottom: false, left: false };
        const currentCage = puzzle.cells[r][c].cageId;
        const puzzleSize = puzzle.size;

        return {
            top: r === 0 || puzzle.cells[r - 1][c].cageId !== currentCage,
            bottom: r === puzzleSize - 1 || puzzle.cells[r + 1][c].cageId !== currentCage,
            left: c === 0 || puzzle.cells[r][c - 1].cageId !== currentCage,
            right: c === puzzleSize - 1 || puzzle.cells[r][c + 1].cageId !== currentCage
        };
    }, [puzzle]);

    const getCageLabel = useCallback((r: number, c: number) => {
        if (!puzzle) return null;
        const cage = puzzle.cages.find(cage => cage.id === puzzle.cells[r][c].cageId);
        if (!cage) return null;

        const sortedCells = [...cage.cells].sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row;
            return a.col - b.col;
        });

        if (sortedCells[0].row === r && sortedCells[0].col === c) {
            return {
                target: cage.target,
                operation: cage.operation,
                isSingle: cage.cells.length === 1
            };
        }
        return null;
    }, [puzzle]);

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 max-w-md">
                <strong className="font-bold">Ошибка!</strong>
                <span className="block sm:inline">{error}</span>
                <pre className="mt-2 text-xs text-left overflow-auto">{errorDetails}</pre>
            </div>
        );
    }

    if (!puzzle) {
        return (
            <div className="text-blue-500 animate-pulse font-bold p-8">
                Генерация пазла (Размер: {size}, Операции: {ops.join(', ')})...
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-white p-6 relative">
            {/* Back Button */}
            <div className="absolute top-6 left-6">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800">Калькудоку</h1>
            </div>

            {/* Main Content */}
            <div className="flex gap-8 justify-center items-start min-h-[600px]">
                {/* Left Side - Timer and Controls */}
                <div className="w-48 flex flex-col items-center gap-6 pt-4">
                    <div className="text-4xl font-bold text-blue-600 font-mono text-center">
                        {formatTime(timeElapsed)}
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                        <button
                            onClick={onBack}
                            className="px-6 py-3 bg-red-500 hover:bg-red-600 shadow-red-200 text-white rounded-full font-bold transition-all shadow-lg flex items-center justify-center gap-2 w-full"
                        >
                            <Square size={20} fill="currentColor" />
                            Стоп
                        </button>
                        <button
                            onClick={togglePause}
                            className={`px-6 py-3 text-white rounded-full font-bold transition-all shadow-lg flex items-center justify-center gap-2 w-full ${isPaused
                                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                                : "bg-cyan-500 hover:bg-cyan-600 shadow-cyan-200"
                                }`}
                        >
                            {isPaused ? <Play size={20} fill="currentColor" /> : <div className="flex gap-1"><div className="w-1.5 h-4 bg-white rounded-sm" /><div className="w-1.5 h-4 bg-white rounded-sm" /></div>}
                            {isPaused ? 'Продолжить' : 'Пауза'}
                        </button>
                    </div>
                </div>

                {/* Center - Game Board */}
                <div className="flex flex-col items-center justify-start">
                    <div
                        className="grid-container relative"
                        style={{
                            gridTemplateColumns: `repeat(${size}, 1fr)`,
                            gridTemplateRows: `repeat(${size}, 1fr)`
                        }}
                    >
                        {/* Pause Overlay */}
                        {isPaused && (
                            <div className="absolute inset-0 z-20 bg-gray-100 flex flex-col items-center justify-center text-gray-500">
                                <div className="text-4xl mb-2">⏸️</div>
                                <div className="font-bold">ПАУЗА</div>
                                <button onClick={togglePause} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-full font-bold shadow hover:bg-blue-600 transition-colors">
                                    Продолжить
                                </button>
                            </div>
                        )}

                        {puzzle.cells.map((row, r) =>
                            row.map((cell, c) => (
                                <Cell
                                    key={`${r}-${c}`}
                                    cell={cell}
                                    isActive={selectedCell?.row === r && selectedCell?.col === c}
                                    borders={getBorders(r, c)}
                                    cageLabel={getCageLabel(r, c)}
                                    onSelect={() => setSelectedCell({ row: r, col: c })}
                                />
                            ))
                        )}

                        {/* Radial Menu Overlay */}
                        {selectedCell && (
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    top: `calc(${selectedCell.row} * (100% / ${size}))`,
                                    left: `calc(${selectedCell.col} * (100% / ${size}))`,
                                    width: `calc(100% / ${size})`,
                                    height: `calc(100% / ${size})`
                                }}
                            >
                                <RadialMenu
                                    size={size}
                                    onInput={handleInput}
                                    onClear={() => handleInput(null)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side - Results History */}
                <div className="w-48 flex flex-col gap-2 pt-4">
                    <h3 className="text-lg font-bold text-gray-800 text-center">История</h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {topScores.map((score, idx) => (
                            <div
                                key={idx}
                                className="bg-blue-50 p-2 rounded text-sm border border-blue-200 flex flex-col px-3"
                            >
                                <div className="flex justify-between items-center w-full">
                                    <span className="font-semibold text-gray-700">
                                        #{idx + 1}
                                    </span>
                                    <span className="text-blue-600 font-bold font-mono">
                                        {formatTime(score.time)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-500">
                                        {score.size}x{score.size}
                                    </span>
                                    <span className="text-xs text-gray-500 text-right">
                                        {score.date}
                                        {score.paused && <span className="ml-1" title="С паузой">⏸️</span>}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {topScores.length === 0 && (
                            <p className="text-gray-400 text-center text-xs">Нет результатов</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Click backdrop to close menu */}
            {selectedCell && (
                <div onClick={() => setSelectedCell(null)} className="fixed inset-0 z-0 bg-transparent" style={{ cursor: 'default' }} />
            )}

            {/* WIN MODAL - Different for locked vs free mode */}
            {isWon && (
                isLocked ? (
                    /* Locked mode: unified completion overlay */
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🎉</div>
                            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-6 rounded-xl shadow-lg inline-block">
                                <p className="text-2xl font-bold mb-2">
                                    {hasNextExercise ? 'Упражнение завершено!' : 'Занятие завершено!'}
                                </p>
                                <p className="text-lg opacity-90">
                                    {hasNextExercise ? 'Отличная работа! Переходите к следующему упражнению.' : 'Поздравляем! Вы выполнили все упражнения.'}
                                </p>
                            </div>
                            <div className="mt-6">
                                <Link href={getNextPath ? getNextPath() : '/student-dashboard'}>
                                    <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-all">
                                        {hasNextExercise ? 'К следующему упражнению →' : 'Готово ✓'}
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Free mode: standard win modal */
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
                        <div className="relative bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center transform transition-all scale-100 animate-in fade-in zoom-in duration-300">
                            <button
                                onClick={() => setIsWon(false)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">Победа!</h2>
                            <p className="text-gray-500 mb-6">Ваше время: <span className="font-bold text-blue-600 font-mono">{formatTime(timeElapsed)}</span></p>

                            <div className="flex gap-4">
                                <button
                                    onClick={onBack}
                                    className="px-6 py-2 rounded-full border-2 border-gray-300 font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                >
                                    Меню
                                </button>
                                <button
                                    onClick={initGame}
                                    className="px-6 py-2 rounded-full bg-blue-500 font-bold text-white hover:bg-blue-600 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                >
                                    Ещё раз
                                </button>
                            </div>
                        </div>
                    </div>
                )
            )}

            {/* TIME UP MODAL - Shown when time runs out in locked mode */}
            {isTimeUp && !isWon && isLocked && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
                    <div className="text-center">
                        <div className="text-6xl mb-4">⏰</div>
                        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-6 rounded-xl shadow-lg inline-block">
                            <p className="text-2xl font-bold mb-2">Время вышло!</p>
                            <p className="text-lg opacity-90">
                                К сожалению, вы не успели решить головоломку.
                            </p>
                        </div>
                        <div className="mt-6 flex gap-4 justify-center">
                            <button
                                onClick={() => {
                                    // Submit failed result
                                    if (onComplete) {
                                        onComplete({ completed: false, time: timeLimit, size }, false);
                                    }
                                }}
                                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-full shadow-lg transition-all"
                            >
                                {hasNextExercise ? 'К следующему упражнению' : 'Готово'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsTimeUp(false);
                                    initGame();
                                }}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-all"
                            >
                                Попробовать снова
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .grid-container {
          display: grid;
          width: 500px;
          height: 500px;
          border: 2px solid #000;
          position: relative;
          z-index: 10;
          background: white;
        }
      `}</style>
        </div>
    );
}
