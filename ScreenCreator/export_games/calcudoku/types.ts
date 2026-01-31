export type Operation = '+' | '-' | '*' | '/' | 'none';

export interface CellPosition {
    row: number;
    col: number;
}

export interface Cage {
    id: number;
    cells: CellPosition[]; // List of cells in this cage
    target: number;
    operation: Operation;
}

export interface CellData {
    row: number;
    col: number;
    value: number | null; // User's input
    solution: number;     // Correct value from Latin Square
    cageId: number;
    isError: boolean;     // Visual flag for validation
}

export interface PuzzleData {
    size: number;
    cells: CellData[][];
    cages: Cage[];
}
