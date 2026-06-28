import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getCurrentUser } from "aws-amplify/auth";
import { Alert, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import AppButton from "../components/AppButton";
import { client } from "../lib/client";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "AdminHome">;

const SAMPLE_PUZZLE = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const SAMPLE_SOLUTION = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

export default function AdminHomeScreen({ navigation }: Props) {
    const createSampleStage = async () => {
        try {
            const user = await getCurrentUser();

            const stageId = "stage-001";

            const existing = await client.models.Stage.list({
                filter: {
                    stageId: {
                        eq: stageId,
                    },
                },
            });

            if ((existing.data ?? []).length > 0) {
                Alert.alert("確認", "テストステージは既に存在します。");
                return;
            }

            await client.models.Stage.create({
                stageId,
                title: "初級 1",
                difficulty: 1,
                difficultyLabel: "初級",
                puzzleJson: JSON.stringify(SAMPLE_PUZZLE),
                solutionJson: JSON.stringify(SAMPLE_SOLUTION),
                givensCount: SAMPLE_PUZZLE.flat().filter((value) => value !== 0)
                    .length,
                isPublished: true,
                createdBy: user.userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            Alert.alert("作成完了", "テストステージを作成しました。");
        } catch (error) {
            console.error("Create sample stage error:", error);
            Alert.alert("エラー", "テストステージの作成に失敗しました。");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>管理者メニュー</Text>

            <Text style={styles.description}>
                まずは動作確認用に、初級ステージを1件作成します。
            </Text>

            <AppButton onPress={createSampleStage}>
                テストステージを作成
            </AppButton>

            <AppButton onPress={() => navigation.navigate("StageAdmin")}>
                ステージ管理
            </AppButton>

            <AppButton onPress={() => navigation.navigate("StageImport")}>
                ステージインポート
            </AppButton>
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
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: "#4b5563",
        marginBottom: 20,
    },
});
