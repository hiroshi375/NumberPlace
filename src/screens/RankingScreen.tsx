import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import {
    FlatList,
    Image,
    ImageSourcePropType,
    StyleSheet,
    View,
} from "react-native";
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

const rankingIconMap: Record<number, ImageSourcePropType> = {
    1: require("../../assets/images/gold_trophy.png"),
    2: require("../../assets/images/silver_trophy.png"),
    3: require("../../assets/images/bronze_trophy.png"),
    4: require("../../assets/images/4th_trophy.png"),
    5: require("../../assets/images/5th_trophy.png"),
    6: require("../../assets/images/6th_trophy.png"),
    7: require("../../assets/images/7th_trophy.png"),
    8: require("../../assets/images/8th_trophy.png"),
    9: require("../../assets/images/9th_trophy.png"),
    10: require("../../assets/images/10th_trophy.png"),
};

function getRankingIcon(rank: number) {
    return rankingIconMap[rank] ?? rankingIconMap[10];
}

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

                if ((a.mistakes ?? 0) !== (b.mistakes ?? 0)) {
                    return (a.mistakes ?? 0) - (b.mistakes ?? 0);
                }

                if ((a.hintsUsed ?? 0) !== (b.hintsUsed ?? 0)) {
                    return (a.hintsUsed ?? 0) - (b.hintsUsed ?? 0);
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
                renderItem={({ item, index }) => {
                    const rank = index + 1;
                    const iconSource = getRankingIcon(rank);

                    return (
                        <Card style={styles.card}>
                            <Card.Content>
                                <View style={styles.row}>
                                    <View style={styles.iconArea}>
                                        <Image
                                            source={iconSource}
                                            style={styles.rankIcon}
                                        />
                                    </View>

                                    <View style={styles.nameArea}>
                                        <Text
                                            style={styles.name}
                                            numberOfLines={1}
                                        >
                                            {item.displayName ?? "プレイヤー"}
                                        </Text>
                                    </View>

                                    <View style={styles.statsArea}>
                                        <Text style={styles.score}>
                                            スコア: {item.score}
                                        </Text>
                                        <Text style={styles.meta}>
                                            クリア時間:{" "}
                                            {formatElapsedTime(
                                                item.elapsedSeconds,
                                            )}
                                        </Text>
                                        <Text style={styles.meta}>
                                            ミス: {item.mistakes ?? 0} / ヒント:{" "}
                                            {item.hintsUsed ?? 0}
                                        </Text>
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>
                    );
                }}
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
        marginBottom: 12,
        borderRadius: 14,
        backgroundColor: "#ffffff",
    },
    emptyText: {
        textAlign: "center",
        color: "#6b7280",
        marginTop: 40,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },

    iconArea: {
        width: 76,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    rankIcon: {
        width: 64,
        height: 64,
        resizeMode: "contain",
    },

    nameArea: {
        flex: 1,
        justifyContent: "center",
        paddingRight: 8,
    },

    name: {
        fontSize: 17,
        fontWeight: "700",
        color: "#2f4050",
    },

    statsArea: {
        width: 140,
        justifyContent: "center",
        alignItems: "flex-end",
        gap: 4,
    },

    score: {
        fontSize: 15,
        fontWeight: "700",
        color: "#4b6f8f",
        textAlign: "right",
    },

    meta: {
        fontSize: 13,
        color: "#4b5563",
        textAlign: "right",
    },
});
