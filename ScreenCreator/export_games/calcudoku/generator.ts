import { LatinSquareGenerator } from './latin-square';
import type { Cage, CellPosition, Operation, PuzzleData, CellData } from './types';

export class CageGenerator {
    size: number;
    grid: number[][]; // The solution grid
    cages: Cage[] = [];
    cellCageMap: number[][] = [];

    allowedOperations: Operation[];

    constructor(size: number, allowedOperations: Operation[] = ['+', '-', '*', '/']) {
        this.size = size;
        this.allowedOperations = allowedOperations;
        const latinSquare = new LatinSquareGenerator(size);
        this.grid = latinSquare.generate();
        this.cellCageMap = Array(size).fill(0).map(() => Array(size).fill(-1));
    }

    generate(): PuzzleData {
        let cageIdCounter = 0;
        const visited = Array(this.size).fill(false).map(() => Array(this.size).fill(false));

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (visited[r][c]) continue;

                // Start a new cage
                const cageCells: CellPosition[] = [];
                const maxCageSize = Math.floor(Math.random() * 4) + 1; // 1 to 4
                const stack: CellPosition[] = [{ row: r, col: c }];

                while (stack.length > 0 && cageCells.length < maxCageSize) {
                    const current = stack.pop()!;
                    if (visited[current.row][current.col]) continue;

                    visited[current.row][current.col] = true;
                    cageCells.push(current);
                    this.cellCageMap[current.row][current.col] = cageIdCounter;

                    // Find unvisited neighbors
                    const neighbors = this.getUnvisitedNeighbors(current.row, current.col, visited);

                    // Shuffle neighbors to add randomness
                    this.shuffle(neighbors);

                    stack.push(...neighbors);
                }

                // Finalize cage
                const cageValues = cageCells.map(pos => this.grid[pos.row][pos.col]);
                const { target, operation } = this.calculateTarget(cageValues);

                this.cages.push({
                    id: cageIdCounter,
                    cells: cageCells,
                    target,
                    operation
                });

                cageIdCounter++;
            }
        }

        // Build the CellData grid
        const cells: CellData[][] = [];
        for (let r = 0; r < this.size; r++) {
            const rowData: CellData[] = [];
            for (let c = 0; c < this.size; c++) {
                rowData.push({
                    row: r,
                    col: c,
                    value: null,
                    solution: this.grid[r][c],
                    cageId: this.cellCageMap[r][c],
                    isError: false
                });
            }
            cells.push(rowData);
        }

        return {
            size: this.size,
            cells,
            cages: this.cages
        };
    }

    private getUnvisitedNeighbors(r: number, c: number, visited: boolean[][]): CellPosition[] {
        const neighbors: CellPosition[] = [];
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size && !visited[nr][nc]) {
                neighbors.push({ row: nr, col: nc });
            }
        }
        return neighbors;
    }

    private calculateTarget(values: number[]): { target: number, operation: Operation } {
        if (values.length === 1) {
            return { target: values[0], operation: 'none' };
        }

        // Identify mathematically valid operations
        const validOps: Operation[] = [];

        // Addition is always valid
        validOps.push('+');

        // Multiplication is always valid (typically for smaller cages or if allowed)
        if (values.length <= 4) validOps.push('*');

        if (values.length === 2) {
            const [a, b] = values;
            // Division
            if (a > b ? a % b === 0 : b % a === 0) validOps.push('/');
            // Subtraction
            validOps.push('-');
        }

        // Intersect validOps with allowedOperations
        const possibleOps = validOps.filter(op => this.allowedOperations.includes(op));

        // Fallback: if intersection is empty (e.g. user selected 'x /' but we have large cage), 
        // we must fallback to something safe that is allowed.
        // If 'x /' only, and cage > 4 cells? We might forcing '*' even if > 4, or avoiding generating large cages?
        // For simplicity: if valid set is empty, fallback to '+'. 
        // Realistically, 'x' should be allowed for any size for hard puzzles, but let's stick to safe defaults.
        // If the user selects ONLY {*, /}, and values.length > 4, 'validOps' didn't include '*'.
        // Let's relax the '*' length constraint if checking intersection.

        if (possibleOps.length === 0) {
            // Emergency fallback - should rarely happen if standard sets used
            if (this.allowedOperations.includes('+')) return this.computeTarget(values, '+');
            if (this.allowedOperations.includes('*')) return this.computeTarget(values, '*');
            return this.computeTarget(values, '+'); // Absolute fallback
        }

        // Pick random operation
        const op = possibleOps[Math.floor(Math.random() * possibleOps.length)];
        return this.computeTarget(values, op);
    }

    private computeTarget(values: number[], op: Operation): { target: number, operation: Operation } {
        let target = 0;
        switch (op) {
            case '+':
                target = values.reduce((sum, v) => sum + v, 0);
                break;
            case '*':
                target = values.reduce((prod, v) => prod * v, 1);
                break;
            case '-':
                // Assumes length 2
                target = Math.abs(values[0] - values[1]);
                break;
            case '/':
                // Assumes length 2 and divisibility
                target = values[0] > values[1] ? values[0] / values[1] : values[1] / values[0];
                break;
        }
        return { target, operation: op };
    }

    private shuffle(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
