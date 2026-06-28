import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";

import AppButton from "../components/AppButton";
import { client } from "../lib/client";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "StageSelect">;

type StageItem = {
    id: string;
    stageId: string;
    title: string;
    difficulty: number;
    difficultyLabel?: string | null;
    isPublished?: boolean | null;
};

function renderDifficultyStars(difficulty: number) {
    return "⭐️".repeat(Math.max(1, Math.min(difficulty, 5)));
}

export default function StageSelectScreen({ navigation }: Props) {
    const [stages, setStages] = useState<StageItem[]>([]);
    const [loading, setLoading] = useState(false);

    const loadStages = useCallback(async () => {
        setLoading(true);

        try {
            const result = await client.models.Stage.list();

            const items = (result.data ?? [])
                .filter((stage: any) => stage.isPublished)
                .map((stage: any) => ({
                    id: stage.id,
                    stageId: stage.stageId,
                    title: stage.title,
                    difficulty: stage.difficulty,
                    difficultyLabel: stage.difficultyLabel,
                    isPublished: stage.isPublished,
                }));

            items.sort((a, b) => a.stageId.localeCompare(b.stageId));

            setStages(items);
        } catch (error) {
            console.error("Stage list error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadStages();
        }, [loadStages]),
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>ステージ選択</Text>

            <FlatList
                data={stages}
                keyExtractor={(item) => item.id}
                refreshing={loading}
                onRefresh={loadStages}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        公開済みステージがありません。管理者メニューからテストステージを作成してください。
                    </Text>
                }
                renderItem={({ item }) => (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.stageTitle}>{item.title}</Text>
                            <Text style={styles.stageMeta}>
                                難易度: {renderDifficultyStars(item.difficulty)}
                            </Text>
                            {item.difficultyLabel ? (
                                <Text style={styles.stageMeta}>
                                    {item.difficultyLabel}
                                </Text>
                            ) : null}

                            <AppButton
                                onPress={() =>
                                    navigation.navigate("Game", {
                                        stageId: item.stageId,
                                    })
                                }
                            >
                                このステージで遊ぶ
                            </AppButton>
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
        padding: 16,
        backgroundColor: "#f5f7fa",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 16,
        color: "#2f4050",
    },
    card: {
        marginBottom: 12,
        borderRadius: 12,
    },
    stageTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 6,
    },
    stageMeta: {
        fontSize: 14,
        color: "#5f6f7f",
        marginBottom: 4,
    },
    emptyText: {
        textAlign: "center",
        color: "#6b7280",
        marginTop: 40,
        lineHeight: 22,
    },
});
