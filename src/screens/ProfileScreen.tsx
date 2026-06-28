import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Text, TextInput } from "react-native-paper";

import AppButton from "../components/AppButton";
import { client } from "../lib/client";

export default function ProfileScreen() {
    const [profileId, setProfileId] = useState<string | null>(null);
    const [userId, setUserId] = useState("");
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [rank, setRank] = useState("Beginner");
    const [totalScore, setTotalScore] = useState(0);
    const [totalClearedStages, setTotalClearedStages] = useState(0);

    const loadProfile = useCallback(async () => {
        try {
            const user = await getCurrentUser();
            const attributes = await fetchUserAttributes();

            const currentUserId = user.userId;
            const currentEmail =
                attributes.email ?? user.signInDetails?.loginId ?? "";

            setUserId(currentUserId);
            setEmail(currentEmail);

            const result = await client.models.UserProfile.list({
                filter: {
                    userId: {
                        eq: currentUserId,
                    },
                },
            });

            const existing = result.data?.[0];

            if (existing) {
                setProfileId(existing.id);
                setDisplayName(existing.displayName ?? "");
                setRank(existing.rank ?? "Beginner");
                setTotalScore(existing.totalScore ?? 0);
                setTotalClearedStages(existing.totalClearedStages ?? 0);
                return;
            }

            const defaultDisplayName = currentEmail || "プレイヤー";

            const created = await client.models.UserProfile.create({
                userId: currentUserId,
                email: currentEmail,
                displayName: defaultDisplayName,
                role: "user",
                rank: "Beginner",
                totalScore: 0,
                totalClearedStages: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            if (created.data) {
                setProfileId(created.data.id);
                setDisplayName(created.data.displayName);
            }
        } catch (error) {
            console.error("Load profile error:", error);
            Alert.alert("エラー", "プロフィールの読み込みに失敗しました。");
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const saveProfile = async () => {
        if (!userId) {
            return;
        }

        if (!displayName.trim()) {
            Alert.alert("入力確認", "ユーザー名を入力してください。");
            return;
        }

        try {
            if (profileId) {
                await client.models.UserProfile.update({
                    id: profileId,
                    displayName: displayName.trim(),
                    updatedAt: new Date().toISOString(),
                });
            } else {
                const created = await client.models.UserProfile.create({
                    userId,
                    email,
                    displayName: displayName.trim(),
                    role: "user",
                    rank: "Beginner",
                    totalScore: 0,
                    totalClearedStages: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });

                if (created.data) {
                    setProfileId(created.data.id);
                }
            }

            Alert.alert("保存完了", "プロフィールを保存しました。");
        } catch (error) {
            console.error("Save profile error:", error);
            Alert.alert("エラー", "プロフィールの保存に失敗しました。");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>プロフィール</Text>

            <Text style={styles.label}>メールアドレス</Text>
            <Text style={styles.value}>{email}</Text>

            <Text style={styles.label}>ユーザー名</Text>
            <TextInput
                mode="outlined"
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.input}
                placeholder="ユーザー名"
            />

            <Text style={styles.label}>ランク</Text>
            <Text style={styles.value}>{rank}</Text>

            <Text style={styles.label}>累計スコア</Text>
            <Text style={styles.value}>{totalScore}</Text>

            <Text style={styles.label}>クリア済みステージ数</Text>
            <Text style={styles.value}>{totalClearedStages}</Text>

            <AppButton onPress={saveProfile}>保存</AppButton>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f5f7fa",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#2f4050",
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        color: "#6b7280",
        marginTop: 12,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: "#2f4050",
        marginBottom: 4,
    },
    input: {
        backgroundColor: "#ffffff",
    },
});
