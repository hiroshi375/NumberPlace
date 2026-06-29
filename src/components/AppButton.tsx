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
    const isContained = mode === "contained";
    const isOutlined = mode === "outlined";

    return (
        <Button
            mode={mode}
            disabled={disabled}
            onPress={onPress}
            style={[
                styles.button,
                isContained && styles.containedButton,
                isOutlined && styles.outlinedButton,
                disabled && styles.disabledButton,
            ]}
            contentStyle={styles.content}
            labelStyle={styles.label}
            buttonColor={
                isContained ? (disabled ? "#9ca3af" : "#4b6f8f") : undefined
            }
            textColor={isContained ? "#ffffff" : "#4b6f8f"}
        >
            {children}
        </Button>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 10,
        marginVertical: 6,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 4,
    },
    containedButton: {
        borderBottomWidth: 4,
        borderBottomColor: "#36546e",
    },
    outlinedButton: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#4b6f8f",
        borderBottomWidth: 4,
        borderBottomColor: "#c7d3dc",
    },
    disabledButton: {
        borderBottomColor: "#7b8794",
        shadowOpacity: 0.08,
        elevation: 1,
    },
    content: {
        height: 44,
    },
    label: {
        fontSize: 15,
        fontWeight: "700",
    },
});
