import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
    value: number;
    memoValues: number[];
    row: number;
    col: number;
    isSelected: boolean;
    isRelated: boolean;
    isSameNumber: boolean;
    isGiven: boolean;
    isWrong: boolean;
    onPress: () => void;
};

export default function SudokuCell({
    value,
    memoValues,
    row,
    col,
    isSelected,
    isRelated,
    isSameNumber,
    isGiven,
    isWrong,
    onPress,
}: Props) {
    const cellStyles = [
        styles.cell,
        col % 3 === 0 && styles.leftThick,
        row % 3 === 0 && styles.topThick,
        col === 8 && styles.rightThick,
        row === 8 && styles.bottomThick,
        isRelated && styles.related,
        isSameNumber && styles.sameNumber,
        isSelected && styles.selected,
    ];

    return (
        <Pressable style={cellStyles} onPress={onPress}>
            {value !== 0 ? (
                <Text
                    style={[
                        styles.value,
                        isGiven && styles.givenValue,
                        isWrong && styles.wrongValue,
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
                            <Text key={memoNumber} style={styles.memoText}>
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
        width: 38,
        height: 38,
        borderWidth: 0.5,
        borderColor: "#9aa7b2",
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
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
    selected: {
        backgroundColor: "#cfe3f5",
    },
    related: {
        backgroundColor: "#e8f1f8",
    },
    sameNumber: {
        backgroundColor: "#d9ecff",
    },
    value: {
        fontSize: 22,
        color: "#2f4050",
    },
    givenValue: {
        fontWeight: "700",
        color: "#111827",
    },
    wrongValue: {
        color: "#d93025",
        fontWeight: "700",
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
        fontSize: 9,
        textAlign: "center",
        color: "#64748b",
    },
});
