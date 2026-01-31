import { useState, useEffect, useMemo } from "react";
import { X, Timer, CheckCircle, AlertCircle } from "lucide-react";

interface MunsterbergTestProps {
    isOpen: boolean;
    onClose: () => void;
}

const WORDS_TO_FIND = [
    "СОЛНЦЕ", "РАЙОН", "НОВОСТЬ", "ФАКТ", "ЭКЗАМЕН",
    "НАРОД", "ПОЕЗД", "ГРИБ", "ШУТКА", "ТЕОРИЯ"
];

const GRID_SIZE = 20; // 20x20 grid
const GAME_DURATION = 120; // 2 minutes

export default function MunsterbergTest({ isOpen, onClose }: MunsterbergTestProps) {
    const [grid, setGrid] = useState<string[][]>([]);
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [gameActive, setGameActive] = useState(false);
    const [gameFinished, setGameFinished] = useState(false);
    const [score, setScore] = useState(0);

    // Generate grid on mount or reset
    useEffect(() => {
        if (isOpen) {
            generateGrid();
            setGameActive(true);
            setGameFinished(false);
            setTimeLeft(GAME_DURATION);
            setFoundWords(new Set());
            setSelectedCells(new Set());
            setScore(0);
        }
    }, [isOpen]);

    // Timer
    useEffect(() => {
        if (!gameActive || gameFinished) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    finishGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameActive, gameFinished]);

    const generateGrid = () => {
        const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
        const letters = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";

        // Place words
        const placedWords: string[] = [];

        // Simple placement logic (horizontal only for simplicity in this version, can be expanded)
        WORDS_TO_FIND.forEach(word => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * GRID_SIZE);
                const col = Math.floor(Math.random() * (GRID_SIZE - word.length));

                // Check if space is free
                let canPlace = true;
                for (let i = 0; i < word.length; i++) {
                    if (newGrid[row][col + i] !== '') {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    for (let i = 0; i < word.length; i++) {
                        newGrid[row][col + i] = word[i];
                    }
                    placed = true;
                    placedWords.push(word);
                }
                attempts++;
            }
        });

        // Fill remaining with random letters
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (newGrid[i][j] === '') {
                    newGrid[i][j] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }

        setGrid(newGrid);
    };

    const toggleCell = (row: number, col: number) => {
        if (!gameActive || gameFinished) return;

        const key = `${row}-${col}`;
        const newSelected = new Set(selectedCells);

        if (newSelected.has(key)) {
            newSelected.delete(key);
        } else {
            newSelected.add(key);
        }

        setSelectedCells(newSelected);
        checkSelection(newSelected);
    };

    const checkSelection = (currentSelection: Set<string>) => {
        // Convert selection to sorted list of cells
        const cells = Array.from(currentSelection).map(key => {
            const [r, c] = key.split('-').map(Number);
            return { r, c, char: grid[r][c] };
        }).sort((a, b) => a.r === b.r ? a.c - b.c : a.r - b.r);

        // Check if selected cells form any of the target words
        // This is a simplified check: assumes user selects contiguous cells for a word
        // We construct the string from selected cells and check if it matches any word

        // Group by row to find horizontal words
        const byRow: Record<number, typeof cells> = {};
        cells.forEach(cell => {
            if (!byRow[cell.r]) byRow[cell.r] = [];
            byRow[cell.r].push(cell);
        });

        Object.values(byRow).forEach(rowCells => {
            // Check contiguous sequences
            let currentWord = "";
            let currentKeys: string[] = [];

            for (let i = 0; i < rowCells.length; i++) {
                const cell = rowCells[i];

                // If not contiguous with previous, reset
                if (i > 0 && rowCells[i].c !== rowCells[i - 1].c + 1) {
                    currentWord = "";
                    currentKeys = [];
                }

                currentWord += cell.char;
                currentKeys.push(`${cell.r}-${cell.c}`);

                if (WORDS_TO_FIND.includes(currentWord) && !foundWords.has(currentWord)) {
                    // Word found!
                    const newFound = new Set(foundWords);
                    newFound.add(currentWord);
                    setFoundWords(newFound);
                    setScore(prev => prev + 1);

                    // Clear selection for these cells to allow finding others without clutter? 
                    // Or keep them highlighted differently? Let's keep them selected but maybe change style.
                    // For now, just keep them selected.

                    // Optional: Auto-clear selection of the found word so user can pick next?
                    // Let's leave them selected as "found" indicator.
                }
            }
        });
    };

    const finishGame = () => {
        setGameActive(false);
        setGameFinished(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Тест Мюнстенберга</h2>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-lg ${timeLeft < 30 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            <Timer size={20} />
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Game Area */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Grid */}
                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
                        <div
                            className="grid gap-1 bg-white p-2 rounded-lg shadow-sm border border-gray-200 select-none"
                            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(20px, 1fr))` }}
                        >
                            {grid.map((row, r) => (
                                row.map((char, c) => {
                                    const key = `${r}-${c}`;
                                    const isSelected = selectedCells.has(key);
                                    // Check if this cell belongs to a found word (complex to track exactly which cells, 
                                    // for now just use selection state, maybe add 'isFound' later if needed for green color)

                                    return (
                                        <div
                                            key={key}
                                            onMouseDown={() => toggleCell(r, c)}
                                            className={`
                        w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-sm md:text-base font-bold cursor-pointer rounded transition-colors
                        ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-blue-100 text-gray-700'}
                      `}
                                        >
                                            {char}
                                        </div>
                                    );
                                })
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-full md:w-64 bg-white border-l border-gray-200 p-6 flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Задание</h3>
                            <p className="text-sm text-gray-600">
                                Найдите спрятанные слова среди букв. Выделяйте буквы, нажимая на них.
                            </p>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Слова ({foundWords.size}/{WORDS_TO_FIND.length})</h3>
                            <div className="space-y-2">
                                {WORDS_TO_FIND.map(word => (
                                    <div
                                        key={word}
                                        className={`flex items-center gap-2 p-2 rounded ${foundWords.has(word) ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}
                                    >
                                        {foundWords.has(word) ? <CheckCircle size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                                        <span className={foundWords.has(word) ? 'font-bold line-through' : ''}>{word}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {gameFinished && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <h4 className="font-bold text-blue-900 mb-2">Результат</h4>
                                <p className="text-3xl font-bold text-blue-600 mb-2">{score} / {WORDS_TO_FIND.length}</p>
                                <p className="text-sm text-blue-800">
                                    {score === WORDS_TO_FIND.length ? "Отличная работа! Вы нашли все слова." : "Хорошая попытка! Попробуйте еще раз."}
                                </p>
                                <button
                                    onClick={() => {
                                        generateGrid();
                                        setGameActive(true);
                                        setGameFinished(false);
                                        setTimeLeft(GAME_DURATION);
                                        setFoundWords(new Set());
                                        setSelectedCells(new Set());
                                        setScore(0);
                                    }}
                                    className="w-full mt-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                                >
                                    Начать заново
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
