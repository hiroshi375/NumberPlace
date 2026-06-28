import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";

import AppButton from "../components/AppButton";
import { client } from "../lib/client";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "StageAdmin">;

type StageItem = {
    id: string;
    stageId: string;
    title: string;
    difficulty: number;
    difficultyLabel?: string | null;
    isPublished?: boolean | null;
    givensCount?: number | null;
};

export default function StageAdminScreen({ navigation }: Props) {
    const [stages, setStages] = useState<StageItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadStages = useCallback(async () => {
        try {
            setIsLoading(true);

            const result = await client.models.Stage.list();

            const items = (result.data ?? [])
                .map((item) => ({
                    id: item.id,
                    stageId: item.stageId,
                    title: item.title,
                    difficulty: item.difficulty,
                    difficultyLabel: item.difficultyLabel,
                    isPublished: item.isPublished,
                    givensCount: item.givensCount,
                }))
                .sort((a, b) => a.stageId.localeCompare(b.stageId));

            setStages(items);
        } catch (error) {
            console.error("Load stages error:", error);
            Alert.alert("エラー", "ステージ一覧の読み込みに失敗しました。");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", loadStages);
        return unsubscribe;
    }, [loadStages, navigation]);

    const handleDeleteStage = (stage: StageItem) => {
        Alert.alert("確認", `「${stage.title}」を削除しますか？`, [
            {
                text: "キャンセル",
                style: "cancel",
            },
            {
                text: "削除",
                style: "destructive",
                onPress: async () => {
                    try {
                        await client.models.Stage.delete({
                            id: stage.id,
                        });

                        Alert.alert("削除完了", "ステージを削除しました。");
                        loadStages();
                    } catch (error) {
                        console.error("Delete stage error:", error);
                        Alert.alert("エラー", "ステージの削除に失敗しました。");
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>ステージ管理</Text>

            <AppButton onPress={() => navigation.navigate("StageEdit", {})}>
                新規ステージ作成
            </AppButton>

            <AppButton onPress={() => navigation.navigate("StageImport")}>
                JSONからインポート
            </AppButton>

            <FlatList
                data={stages}
                keyExtractor={(item) => item.id}
                refreshing={isLoading}
                onRefresh={loadStages}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        ステージが登録されていません。
                    </Text>
                }
                renderItem={({ item }) => (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.stageTitle}>{item.title}</Text>
                            <Text style={styles.stageText}>
                                ステージID: {item.stageId}
                            </Text>
                            <Text style={styles.stageText}>
                                難易度: {item.difficultyLabel ?? "-"} /{" "}
                                {item.difficulty}
                            </Text>
                            <Text style={styles.stageText}>
                                初期数字数: {item.givensCount ?? "-"}
                            </Text>
                            <Text style={styles.stageText}>
                                公開状態:{" "}
                                {item.isPublished ? "公開中" : "非公開"}
                            </Text>

                            <View style={styles.actionRow}>
                                <AppButton
                                    onPress={() =>
                                        navigation.navigate("StageEdit", {
                                            stageId: item.stageId,
                                        })
                                    }
                                >
                                    編集
                                </AppButton>

                                <AppButton
                                    mode="outlined"
                                    onPress={() => handleDeleteStage(item)}
                                >
                                    削除
                                </AppButton>
                            </View>
                        </Card.Content>
                    </Card>
                )}
            />
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
        marginBottom: 16,
    },
    listContent: {
        paddingTop: 12,
        paddingBottom: 32,
    },
    emptyText: {
        marginTop: 24,
        textAlign: "center",
        color: "#6b7280",
    },
    card: {
        marginBottom: 12,
        borderRadius: 12,
    },
    stageTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2f4050",
        marginBottom: 6,
    },
    stageText: {
        fontSize: 14,
        color: "#4b5563",
        marginBottom: 2,
    },
    actionRow: {
        marginTop: 12,
        gap: 8,
    },
});
