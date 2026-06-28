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
};

export default function SudokuBoard({
    puzzle,
    board,
    memos,
    wrongCells,
    selectedRow,
    selectedCol,
    onSelectCell,
}: Props) {
    const selectedValue =
        selectedRow !== null && selectedCol !== null
            ? board[selectedRow][selectedCol]
            : 0;

    return (
        <View style={styles.board}>
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
                                isGiven={isGivenCell(puzzle, row, col)}
                                isWrong={wrongCells.has(cellKey)}
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
