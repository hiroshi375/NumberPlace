import { useAuthenticator } from "@aws-amplify/ui-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getCurrentUser } from "aws-amplify/auth";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import AppButton from "../components/AppButton";
import { client } from "../lib/client";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
    const { signOut } = useAuthenticator();

    const [isAdmin, setIsAdmin] = useState(false);

    const loadAdminRole = useCallback(async () => {
        try {
            const user = await getCurrentUser();

            const result = await client.models.UserProfile.list({
                filter: {
                    userId: {
                        eq: user.userId,
                    },
                },
            });

            const profile = result.data?.[0];

            setIsAdmin(profile?.role === "admin");
        } catch (error) {
            console.error("Load admin role error:", error);
            setIsAdmin(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", loadAdminRole);

        return unsubscribe;
    }, [navigation, loadAdminRole]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>NumberPlace</Text>
            <Text style={styles.subtitle}>数独ゲーム</Text>

            <View style={styles.buttonArea}>
                <AppButton onPress={() => navigation.navigate("StageSelect")}>
                    ステージ選択
                </AppButton>

                <AppButton onPress={() => navigation.navigate("Profile")}>
                    プロフィール
                </AppButton>

                <AppButton onPress={() => navigation.navigate("Ranking", {})}>
                    ランキング
                </AppButton>

                {isAdmin && (
                    <AppButton onPress={() => navigation.navigate("AdminHome")}>
                        管理者メニュー
                    </AppButton>
                )}

                <AppButton mode="outlined" onPress={signOut}>
                    サインアウト
                </AppButton>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
        backgroundColor: "#f5f7fa",
    },
    title: {
        fontSize: 36,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 8,
        color: "#2f4050",
    },
    subtitle: {
        fontSize: 18,
        textAlign: "center",
        marginBottom: 40,
        color: "#5f6f7f",
    },
    buttonArea: {
        gap: 6,
    },
});
