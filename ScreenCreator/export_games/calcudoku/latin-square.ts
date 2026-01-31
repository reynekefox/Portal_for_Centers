export class LatinSquareGenerator {
    size: number;
    grid: number[][];

    constructor(size: number) {
        this.size = size;
        this.grid = Array(size).fill(0).map(() => Array(size).fill(0));
    }

    generate(): number[][] {
        this.fillGrid(0, 0);
        return this.grid;
    }

    private fillGrid(row: number, col: number): boolean {
        if (row === this.size) return true;

        const nextRow = col === this.size - 1 ? row + 1 : row;
        const nextCol = col === this.size - 1 ? 0 : col + 1;

        // Shuffle numbers 1 to size for randomness
        const numbers = this.shuffle(Array.from({ length: this.size }, (_, i) => i + 1));

        for (const num of numbers) {
            if (this.isValid(row, col, num)) {
                this.grid[row][col] = num;
                if (this.fillGrid(nextRow, nextCol)) return true;
                this.grid[row][col] = 0; // Backtrack
            }
        }

        return false;
    }

    private isValid(row: number, col: number, num: number): boolean {
        // Check row
        for (let c = 0; c < this.size; c++) {
            if (this.grid[row][c] === num) return false;
        }
        // Check column
        for (let r = 0; r < this.size; r++) {
            if (this.grid[r][col] === num) return false;
        }
        return true;
    }

    private shuffle(array: number[]): number[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
