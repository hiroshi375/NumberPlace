import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";

import { client } from "../lib/client";
import type { RootStackParamList } from "../types/navigation";
import { formatElapsedTime } from "../utils/time";

type Props = NativeStackScreenProps<RootStackParamList, "Ranking">;

type RankingItem = {
    id: string;
    displayName?: string | null;
    score: number;
    elapsedSeconds: number;
    mistakes?: number | null;
    hintsUsed?: number | null;
    clearedAt: string;
};

export default function RankingScreen({ route }: Props) {
    const stageId = route.params?.stageId;

    const [items, setItems] = useState<RankingItem[]>([]);
    const [loading, setLoading] = useState(false);

    const loadRanking = useCallback(async () => {
        setLoading(true);

        try {
            const result = stageId
                ? await client.models.RankingEntry.list({
                      filter: {
                          stageId: {
                              eq: stageId,
                          },
                      },
                  })
                : await client.models.RankingEntry.list();

            const rankingItems = (result.data ?? []).map((item: any) => ({
                id: item.id,
                displayName: item.displayName,
                score: item.score,
                elapsedSeconds: item.elapsedSeconds,
                mistakes: item.mistakes,
                hintsUsed: item.hintsUsed,
                clearedAt: item.clearedAt,
            }));

            rankingItems.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }

                if (a.elapsedSeconds !== b.elapsedSeconds) {
                    return a.elapsedSeconds - b.elapsedSeconds;
                }

                return (
                    new Date(a.clearedAt).getTime() -
                    new Date(b.clearedAt).getTime()
                );
            });

            setItems(rankingItems.slice(0, 50));
        } catch (error) {
            console.error("Ranking list error:", error);
        } finally {
            setLoading(false);
        }
    }, [stageId]);

    useFocusEffect(
        useCallback(() => {
            loadRanking();
        }, [loadRanking]),
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {stageId ? "ステージ別ランキング" : "総合ランキング"}
            </Text>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                refreshing={loading}
                onRefresh={loadRanking}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        ランキングデータがありません。
                    </Text>
                }
                renderItem={({ item, index }) => (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.rank}>#{index + 1}</Text>
                            <Text style={styles.name}>
                                {item.displayName ?? "プレイヤー"}
                            </Text>
                            <Text style={styles.meta}>
                                スコア: {item.score}
                            </Text>
                            <Text style={styles.meta}>
                                クリア時間:{" "}
                                {formatElapsedTime(item.elapsedSeconds)}
                            </Text>
                            <Text style={styles.meta}>
                                ミス: {item.mistakes ?? 0} / ヒント:{" "}
                                {item.hintsUsed ?? 0}
                            </Text>
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
        color: "#2f4050",
        marginBottom: 16,
    },
    card: {
        marginBottom: 10,
        borderRadius: 12,
    },
    rank: {
        fontSize: 18,
        fontWeight: "700",
        color: "#4b6f8f",
    },
    name: {
        fontSize: 17,
        fontWeight: "700",
        marginTop: 4,
    },
    meta: {
        fontSize: 14,
        color: "#4b5563",
        marginTop: 2,
    },
    emptyText: {
        textAlign: "center",
        color: "#6b7280",
        marginTop: 40,
    },
});
