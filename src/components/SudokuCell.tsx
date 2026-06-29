import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
    value: number;
    memoValues: number[];
    row: number;
    col: number;
    isSelected: boolean;
    isRelated: boolean;
    isSameNumber: boolean;
    isSameNumberRelated: boolean;
    isSameNumberBlockRelated: boolean;
    isGiven: boolean;
    isWrong: boolean;
    cellSize: number;
    onPress: () => void;
};

export default function SudokuCell({
    value,
    memoValues,
    isSelected,
    isRelated,
    isSameNumber,
    isSameNumberRelated,
    isSameNumberBlockRelated,
    isGiven,
    isWrong,
    cellSize,
    onPress,
}: Props) {
    const cellStyles = [
        styles.cell,
        {
            width: cellSize,
            height: cellSize,
        },

        isRelated && styles.related,
        isSameNumberBlockRelated && styles.sameNumberBlockRelated,
        isSameNumberRelated && styles.sameNumberRelated,
        isSameNumber && styles.sameNumber,
        isSelected && styles.selected,
        isWrong && styles.wrong,
    ];

    return (
        <Pressable style={cellStyles} onPress={onPress}>
            {value !== 0 ? (
                <Text
                    style={[
                        styles.valueText,
                        {
                            fontSize: cellSize * 0.48,
                        },
                        isGiven && styles.givenText,
                        isWrong && styles.wrongValueText,
                    ]}
                >
                    {value}
                </Text>
            ) : (
                <View style={styles.memoGrid}>
                    {Array.from({ length: 9 }, (_, index) => {
                        const memoNumber = index + 1;
                        const visible = memoValues.includes(memoNumber);

                        return (
                            <Text
                                key={memoNumber}
                                style={[
                                    styles.memoText,
                                    {
                                        fontSize: cellSize * 0.18,
                                    },
                                ]}
                            >
                                {visible ? memoNumber : ""}
                            </Text>
                        );
                    })}
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    cell: {
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
    },
    related: {
        backgroundColor: "#e8f1f8",
    },
    sameNumberBlockRelated: {
        backgroundColor: "#edf6ff",
    },
    sameNumberRelated: {
        backgroundColor: "#e2eef8",
    },
    sameNumber: {
        backgroundColor: "#d9ecff",
    },
    selected: {
        backgroundColor: "#cfe3f5",
    },
    wrong: {
        backgroundColor: "#fee2e2",
    },
    valueText: {
        color: "#2f4050",
        fontWeight: "700",
    },
    givenText: {
        color: "#111827",
        fontWeight: "800",
    },
    wrongValueText: {
        color: "#d93025",
        fontWeight: "800",
    },
    memoGrid: {
        width: "100%",
        height: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        padding: 2,
    },
    memoText: {
        width: "33.33%",
        height: "33.33%",
        textAlign: "center",
        color: "#64748b",
    },
});
