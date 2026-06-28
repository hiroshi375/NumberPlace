import { StyleSheet, View } from "react-native";

import type {
    MemoBoard,
    SudokuBoard as SudokuBoardType,
} from "../types/sudoku";
import { isGivenCell } from "../utils/sudoku";
import SudokuCell from "./SudokuCell";

type Props = {
    puzzle: SudokuBoardType;
    board: SudokuBoardType;
    memos: MemoBoard;
    wrongCells: Set<string>;
    selectedRow: number | null;
    selectedCol: number | null;
    onSelectCell: (row: number, col: number) => void;
    boardSize?: number;
};

export default function SudokuBoard({
    puzzle,
    board,
    memos,
    wrongCells,
    selectedRow,
    selectedCol,
    onSelectCell,
    boardSize = 324,
}: Props) {
    const cellSize = boardSize / 9;
    const selectedValue =
        selectedRow !== null && selectedCol !== null
            ? board[selectedRow][selectedCol]
            : 0;

    const sameNumberPositions =
        selectedValue !== 0
            ? board.flatMap((rowValues, sameNumberRow) =>
                  rowValues
                      .map((value, sameNumberCol) => ({
                          value,
                          row: sameNumberRow,
                          col: sameNumberCol,
                      }))
                      .filter((cell) => cell.value === selectedValue),
              )
            : [];

    return (
        <View
            style={[
                styles.board,
                {
                    width: boardSize,
                    height: boardSize,
                },
            ]}
        >
            {board.map((rowValues, row) => (
                <View key={row} style={styles.row}>
                    {rowValues.map((value, col) => {
                        const isSelected =
                            selectedRow === row && selectedCol === col;

                        const isRelated =
                            selectedRow !== null &&
                            selectedCol !== null &&
                            (selectedRow === row || selectedCol === col);

                        const isSameNumber =
                            selectedValue !== 0 && value === selectedValue;

                        const isSameNumberRelated =
                            selectedValue !== 0 &&
                            sameNumberPositions.some(
                                (position) =>
                                    position.row === row ||
                                    position.col === col,
                            );

                        const isSameNumberBlockRelated =
                            selectedValue !== 0 &&
                            sameNumberPositions.some((position) => {
                                const sameNumberBlockRow = Math.floor(
                                    position.row / 3,
                                );
                                const sameNumberBlockCol = Math.floor(
                                    position.col / 3,
                                );

                                const currentBlockRow = Math.floor(row / 3);
                                const currentBlockCol = Math.floor(col / 3);

                                return (
                                    sameNumberBlockRow === currentBlockRow &&
                                    sameNumberBlockCol === currentBlockCol
                                );
                            });

                        const cellKey = `${row}-${col}`;

                        return (
                            <SudokuCell
                                key={cellKey}
                                value={value}
                                memoValues={memos[row][col]}
                                row={row}
                                col={col}
                                isSelected={isSelected}
                                isRelated={isRelated}
                                isSameNumber={isSameNumber}
                                isSameNumberRelated={isSameNumberRelated}
                                isSameNumberBlockRelated={
                                    isSameNumberBlockRelated
                                }
                                isGiven={isGivenCell(puzzle, row, col)}
                                isWrong={wrongCells.has(cellKey)}
                                cellSize={cellSize}
                                onPress={() => onSelectCell(row, col)}
                            />
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    board: {
        alignSelf: "center",
        backgroundColor: "#2f4050",
    },
    row: {
        flexDirection: "row",
    },
});
