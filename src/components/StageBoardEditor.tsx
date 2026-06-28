import { StyleSheet, TextInput, View } from "react-native";

type Board = number[][];

type Props = {
    board: Board;
    onChangeBoard: (board: Board) => void;
    allowZero?: boolean;
};

export default function StageBoardEditor({
    board,
    onChangeBoard,
    allowZero = true,
}: Props) {
    const handleChangeCell = (row: number, col: number, text: string) => {
        const lastChar = text.slice(-1);

        let nextValue = 0;

        if (lastChar === "") {
            nextValue = 0;
        } else if (/^[1-9]$/.test(lastChar)) {
            nextValue = Number(lastChar);
        } else if (allowZero && lastChar === "0") {
            nextValue = 0;
        } else {
            return;
        }

        const nextBoard = board.map((rowValues) => [...rowValues]);
        nextBoard[row][col] = nextValue;
        onChangeBoard(nextBoard);
    };

    return (
        <View style={styles.board}>
            {board.map((rowValues, row) => (
                <View key={row} style={styles.row}>
                    {rowValues.map((value, col) => (
                        <TextInput
                            key={`${row}-${col}`}
                            value={value === 0 ? "" : String(value)}
                            onChangeText={(text) =>
                                handleChangeCell(row, col, text)
                            }
                            keyboardType="number-pad"
                            maxLength={1}
                            textAlign="center"
                            style={[
                                styles.cell,
                                col % 3 === 0 && styles.leftThick,
                                row % 3 === 0 && styles.topThick,
                                col === 8 && styles.rightThick,
                                row === 8 && styles.bottomThick,
                            ]}
                        />
                    ))}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    board: {
        alignSelf: "center",
        backgroundColor: "#2f4050",
        marginBottom: 16,
    },
    row: {
        flexDirection: "row",
    },
    cell: {
        width: 34,
        height: 34,
        borderWidth: 0.5,
        borderColor: "#9aa7b2",
        backgroundColor: "#ffffff",
        fontSize: 18,
        color: "#2f4050",
        padding: 0,
    },
    leftThick: {
        borderLeftWidth: 2,
        borderLeftColor: "#2f4050",
    },
    topThick: {
        borderTopWidth: 2,
        borderTopColor: "#2f4050",
    },
    rightThick: {
        borderRightWidth: 2,
        borderRightColor: "#2f4050",
    },
    bottomThick: {
        borderBottomWidth: 2,
        borderBottomColor: "#2f4050",
    },
});
