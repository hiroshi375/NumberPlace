import type { MemoBoard, SudokuBoard } from "../types/sudoku";

export function createEmptyMemoBoard(): MemoBoard {
    return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));
}

export function parseBoardJson(json: string): SudokuBoard {
    const parsed = JSON.parse(json);

    if (!Array.isArray(parsed) || parsed.length !== 9) {
        throw new Error("盤面JSONは9行である必要があります。");
    }

    for (const row of parsed) {
        if (!Array.isArray(row) || row.length !== 9) {
            throw new Error("盤面JSONは9×9である必要があります。");
        }

        for (const value of row) {
            if (typeof value !== "number" || value < 0 || value > 9) {
                throw new Error("盤面の値は0〜9の数値である必要があります。");
            }
        }
    }

    return parsed;
}

export function cloneBoard(board: SudokuBoard): SudokuBoard {
    return board.map((row) => [...row]);
}

export function isGivenCell(puzzle: SudokuBoard, row: number, col: number) {
    return puzzle[row][col] !== 0;
}

export function isBoardCleared(board: SudokuBoard, solution: SudokuBoard) {
    return board.every((row, rowIndex) =>
        row.every((value, colIndex) => value === solution[rowIndex][colIndex]),
    );
}

export function countFilledCells(board: SudokuBoard, puzzle: SudokuBoard) {
    let count = 0;

    for (let row = 0; row < 9; row += 1) {
        for (let col = 0; col < 9; col += 1) {
            if (puzzle[row][col] === 0 && board[row][col] !== 0) {
                count += 1;
            }
        }
    }

    return count;
}

export function getGivensCount(puzzle: SudokuBoard) {
    return puzzle.flat().filter((value) => value !== 0).length;
}

export function createInitialBoardFromPuzzle(puzzle: SudokuBoard): SudokuBoard {
    return cloneBoard(puzzle);
}
