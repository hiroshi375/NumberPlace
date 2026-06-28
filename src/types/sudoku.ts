export type SudokuBoard = number[][];

export type MemoBoard = number[][][];

export type CellStatus =
    "normal" | "selected" | "related" | "sameNumber" | "wrong";
