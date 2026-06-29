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
    const outerBorderWidth = 4;
    const thinLineWidth = 1;
    const thickLineWidth = 2;

    const cellSize = Math.floor((boardSize - outerBorderWidth * 2) / 9);
    const innerBoardSize = cellSize * 9;
    const actualBoardSize = innerBoardSize + outerBorderWidth * 2;

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

    const getGridLinePosition = (lineNumber: number, lineWidth: number) =>
        cellSize * lineNumber - lineWidth / 2;

    return (
        <View
            style={[
                styles.board,
                {
                    width: actualBoardSize,
                    height: actualBoardSize,
                    borderWidth: outerBorderWidth,
                },
            ]}
        >
            <View
                style={[
                    styles.innerBoard,
                    {
                        width: innerBoardSize,
                        height: innerBoardSize,
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
                                        sameNumberBlockRow ===
                                            currentBlockRow &&
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

                {Array.from({ length: 8 }, (_, index) => {
                    const lineNumber = index + 1;
                    const isThick = lineNumber % 3 === 0;
                    const lineWidth = isThick ? thickLineWidth : thinLineWidth;
                    const position = getGridLinePosition(lineNumber, lineWidth);

                    return (
                        <View
                            key={`vertical-${lineNumber}`}
                            pointerEvents="none"
                            style={[
                                styles.verticalLine,
                                {
                                    left: position,
                                    width: lineWidth,
                                },
                                isThick ? styles.thickLine : styles.thinLine,
                            ]}
                        />
                    );
                })}

                {Array.from({ length: 8 }, (_, index) => {
                    const lineNumber = index + 1;
                    const isThick = lineNumber % 3 === 0;
                    const lineWidth = isThick ? thickLineWidth : thinLineWidth;
                    const position = getGridLinePosition(lineNumber, lineWidth);

                    return (
                        <View
                            key={`horizontal-${lineNumber}`}
                            pointerEvents="none"
                            style={[
                                styles.horizontalLine,
                                {
                                    top: position,
                                    height: lineWidth,
                                },
                                isThick ? styles.thickLine : styles.thinLine,
                            ]}
                        />
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    board: {
        alignSelf: "center",
        backgroundColor: "#ffffff",
        borderColor: "#2f4050",
        borderRadius: 10,
        overflow: "hidden",
    },
    innerBoard: {
        position: "relative",
        backgroundColor: "#ffffff",
    },
    row: {
        flexDirection: "row",
    },
    verticalLine: {
        position: "absolute",
        top: 0,
        bottom: 0,
        zIndex: 10,
    },
    horizontalLine: {
        position: "absolute",
        left: 0,
        right: 0,
        zIndex: 10,
    },
    thinLine: {
        backgroundColor: "#9aa7b2",
    },
    thickLine: {
        backgroundColor: "#2f4050",
    },
});
