import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { Button } from "react-native-paper";

type Props = {
    children: ReactNode;
    onPress: () => void;
    mode?: "text" | "outlined" | "contained";
    disabled?: boolean;
};

export default function AppButton({
    children,
    onPress,
    mode = "contained",
    disabled = false,
}: Props) {
    return (
        <Button
            mode={mode}
            disabled={disabled}
            onPress={onPress}
            style={styles.button}
            contentStyle={styles.content}
            labelStyle={styles.label}
            buttonColor={mode === "contained" ? "#4b6f8f" : undefined}
            textColor={mode === "contained" ? "#ffffff" : "#4b6f8f"}
        >
            {children}
        </Button>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 8,
        marginVertical: 6,
    },
    content: {
        height: 44,
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
    },
});
