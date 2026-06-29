import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
    onPressNumber: (value: number) => void;
    onClearCell: () => void;
    isMemoMode: boolean;
    onToggleMemoMode: () => void;
    disabledNumbers: Set<number>;
};

export default function NumberPad({
    onPressNumber,
    onClearCell,
    isMemoMode,
    onToggleMemoMode,
    disabledNumbers,
}: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.numberRow}>
                {Array.from({ length: 9 }, (_, index) => {
                    const number = index + 1;
                    const isDisabled = disabledNumbers.has(number);

                    return (
                        <Pressable
                            key={number}
                            disabled={isDisabled}
                            onPress={() => onPressNumber(number)}
                            style={({ pressed }) => [
                                styles.numberButton,
                                isDisabled && styles.disabledNumberButton,
                                pressed &&
                                    !isDisabled &&
                                    styles.numberButtonPressed,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.numberButtonText,
                                    isDisabled &&
                                        styles.disabledNumberButtonText,
                                ]}
                            >
                                {number}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.subActionRow}>
                <Pressable
                    onPress={onToggleMemoMode}
                    style={({ pressed }) => [
                        styles.subActionButton,
                        isMemoMode && styles.memoActiveButton,
                        pressed && styles.subActionButtonPressed,
                    ]}
                >
                    <Text
                        style={[
                            styles.subActionButtonText,
                            isMemoMode && styles.memoActiveButtonText,
                        ]}
                    >
                        メモ
                    </Text>
                </Pressable>

                <Pressable
                    onPress={onClearCell}
                    style={({ pressed }) => [
                        styles.subActionButton,
                        pressed && styles.subActionButtonPressed,
                    ]}
                >
                    <Text style={styles.subActionButtonText}>クリア</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    numberRow: {
        flexDirection: "row",
        gap: 4,
    },
    numberButton: {
        flex: 1,
        height: 42,
        borderRadius: 8,
        backgroundColor: "#4b6f8f",
        alignItems: "center",
        justifyContent: "center",

        borderBottomWidth: 4,
        borderBottomColor: "#36546e",

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 4,
    },
    numberButtonPressed: {
        transform: [{ translateY: 2 }],
        borderBottomWidth: 2,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        elevation: 2,
    },
    numberButtonText: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "800",
    },
    disabledNumberButton: {
        backgroundColor: "#cbd5e1",
        borderBottomColor: "#94a3b8",
        shadowOpacity: 0.06,
        elevation: 1,
    },
    disabledNumberButtonText: {
        color: "#64748b",
    },
    subActionRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 8,
    },
    subActionButton: {
        flex: 1,
        height: 42,
        borderRadius: 10,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#4b6f8f",
        alignItems: "center",
        justifyContent: "center",

        borderBottomWidth: 4,
        borderBottomColor: "#c7d3dc",

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.14,
        shadowRadius: 4,
        elevation: 3,
    },
    subActionButtonPressed: {
        transform: [{ translateY: 2 }],
        borderBottomWidth: 2,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.08,
        elevation: 1,
    },
    subActionButtonText: {
        color: "#4b6f8f",
        fontSize: 15,
        fontWeight: "700",
    },
    memoActiveButton: {
        backgroundColor: "#4b6f8f",
        borderColor: "#4b6f8f",
        borderBottomColor: "#36546e",
    },
    memoActiveButtonText: {
        color: "#ffffff",
    },
});
