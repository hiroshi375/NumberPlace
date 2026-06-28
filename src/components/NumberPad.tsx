import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";

type Props = {
    onPressNumber: (value: number) => void;
    onClearCell: () => void;
    isMemoMode: boolean;
    onToggleMemoMode: () => void;
};

export default function NumberPad({
    onPressNumber,
    onClearCell,
    isMemoMode,
    onToggleMemoMode,
}: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.numberGrid}>
                {Array.from({ length: 9 }, (_, index) => {
                    const value = index + 1;

                    return (
                        <Button
                            key={value}
                            mode="contained"
                            style={styles.numberButton}
                            contentStyle={styles.numberButtonContent}
                            buttonColor="#4b6f8f"
                            textColor="#ffffff"
                            onPress={() => onPressNumber(value)}
                        >
                            {value}
                        </Button>
                    );
                })}
            </View>

            <View style={styles.actionRow}>
                <Button
                    mode={isMemoMode ? "contained" : "outlined"}
                    style={styles.actionButton}
                    buttonColor={isMemoMode ? "#6b8faf" : undefined}
                    textColor={isMemoMode ? "#ffffff" : "#4b6f8f"}
                    onPress={onToggleMemoMode}
                >
                    メモ
                </Button>

                <Button
                    mode="outlined"
                    style={styles.actionButton}
                    textColor="#d93025"
                    onPress={onClearCell}
                >
                    クリア
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    numberGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 8,
    },
    numberButton: {
        borderRadius: 8,
        width: 58,
    },
    numberButtonContent: {
        height: 42,
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 12,
        gap: 12,
    },
    actionButton: {
        borderRadius: 8,
        width: 110,
    },
});
