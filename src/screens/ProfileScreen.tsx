import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { getUrl, uploadData } from "aws-amplify/storage";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import { Alert, Image, StyleSheet, View } from "react-native";
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

    const [iconPath, setIconPath] = useState<string | null>(null);
    const [iconUrl, setIconUrl] = useState<string | null>(null);

    const loadIconUrl = useCallback(async (path: string) => {
        try {
            const urlResult = await getUrl({
                path,
                options: {
                    expiresIn: 3600,
                },
            });

            setIconUrl(urlResult.url.toString());
        } catch (error) {
            console.error("Load icon url error:", error);
            setIconUrl(null);
        }
    }, []);

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

                const existingIconPath = existing.iconPath ?? null;
                setIconPath(existingIconPath);

                if (existingIconPath) {
                    await loadIconUrl(existingIconPath);
                }

                return;
            }

            const defaultDisplayName = currentEmail || "プレイヤー";

            const created = await client.models.UserProfile.create({
                userId: currentUserId,
                email: currentEmail,
                displayName: defaultDisplayName,
                iconPath: null,
                role: "user",
                rank: "Beginner",
                totalScore: 0,
                totalClearedStages: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            if (created.data) {
                setProfileId(created.data.id);
                setDisplayName(created.data.displayName ?? defaultDisplayName);
                setIconPath(created.data.iconPath ?? null);
            }
        } catch (error) {
            console.error("Load profile error:", error);
            Alert.alert("エラー", "プロフィールの読み込みに失敗しました。");
        }
    }, [loadIconUrl]);

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
                    iconPath,
                    updatedAt: new Date().toISOString(),
                });
            } else {
                const created = await client.models.UserProfile.create({
                    userId,
                    email,
                    displayName: displayName.trim(),
                    iconPath,
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

    const handlePickProfileIcon = async () => {
        if (!userId) {
            Alert.alert("エラー", "ユーザー情報の読み込みが完了していません。");
            return;
        }

        if (!profileId) {
            Alert.alert(
                "エラー",
                "プロフィール情報の読み込みが完了していません。",
            );
            return;
        }

        try {
            const permissionResult =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert(
                    "権限が必要です",
                    "アイコン画像を選択するため、写真ライブラリへのアクセスを許可してください。",
                );
                return;
            }

            const pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (pickerResult.canceled) {
                return;
            }

            const asset = pickerResult.assets[0];

            if (!asset?.uri) {
                return;
            }

            const response = await fetch(asset.uri);
            const blob = await response.blob();

            const extension =
                asset.fileName?.split(".").pop()?.toLowerCase() ?? "jpg";

            const contentType =
                asset.mimeType ??
                (extension === "png" ? "image/png" : "image/jpeg");

            const fileName = `icon-${Date.now()}.${extension}`;

            const uploadResult = await uploadData({
                path: ({ identityId }) =>
                    `profile-icons/${identityId}/${fileName}`,
                data: blob,
                options: {
                    contentType,
                },
            }).result;

            const nextIconPath = uploadResult.path;

            await client.models.UserProfile.update({
                id: profileId,
                iconPath: nextIconPath,
                updatedAt: new Date().toISOString(),
            });

            const urlResult = await getUrl({
                path: nextIconPath,
                options: {
                    expiresIn: 3600,
                },
            });

            setIconPath(nextIconPath);
            setIconUrl(urlResult.url.toString());

            Alert.alert("完了", "アイコン画像を登録しました。");
        } catch (error) {
            console.error("Pick profile icon error:", error);
            Alert.alert("エラー", "アイコン画像の登録に失敗しました。");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>プロフィール</Text>

            {iconUrl ? (
                <Image source={{ uri: iconUrl }} style={styles.profileIcon} />
            ) : (
                <View style={styles.profileIconPlaceholder}>
                    <Text style={styles.profileIconPlaceholderText}>
                        No Image
                    </Text>
                </View>
            )}

            <AppButton onPress={handlePickProfileIcon}>
                アイコン画像を登録
            </AppButton>

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
    profileIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignSelf: "center",
        marginBottom: 12,
        backgroundColor: "#e5e7eb",
    },
    profileIconPlaceholder: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignSelf: "center",
        marginBottom: 12,
        backgroundColor: "#d1d5db",
        alignItems: "center",
        justifyContent: "center",
    },
    profileIconPlaceholderText: {
        fontSize: 12,
        color: "#6b7280",
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
