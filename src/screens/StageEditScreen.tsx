import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getCurrentUser } from "aws-amplify/auth";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Switch, Text, TextInput } from "react-native-paper";

import AppButton from "../components/AppButton";
import StageBoardEditor from "../components/StageBoardEditor";
import { client } from "../lib/client";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "StageEdit">;

type Board = number[][];

const createEmptyBoard = (): Board =>
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

function validateBoard(board: Board, label: string, allowZero: boolean) {
    if (!Array.isArray(board) || board.length !== 9) {
        throw new Error(`${label} は9行で入力してください。`);
    }

    board.forEach((row, rowIndex) => {
        if (!Array.isArray(row) || row.length !== 9) {
            throw new Error(
                `${label} の${rowIndex + 1}行目は9列で入力してください。`,
            );
        }

        row.forEach((value, colIndex) => {
            if (
                typeof value !== "number" ||
                !Number.isInteger(value) ||
                value < 0 ||
                value > 9
            ) {
                throw new Error(
                    `${label} の${rowIndex + 1}行${colIndex + 1}列目は0〜9で入力してください。`,
                );
            }

            if (!allowZero && value === 0) {
                throw new Error(
                    `${label} の${rowIndex + 1}行${colIndex + 1}列目が未入力です。`,
                );
            }
        });
    });
}

function countGivens(board: Board) {
    return board.flat().filter((value) => value !== 0).length;
}

export default function StageEditScreen({ route, navigation }: Props) {
    const editingStageId = route.params?.stageId;

    const [stageRecordId, setStageRecordId] = useState<string | null>(null);
    const [stageId, setStageId] = useState("");
    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState("1");
    const [difficultyLabel, setDifficultyLabel] = useState("初級");
    const [puzzleBoard, setPuzzleBoard] = useState<Board>(createEmptyBoard());
    const [solutionBoard, setSolutionBoard] =
        useState<Board>(createEmptyBoard());
    const [isPublished, setIsPublished] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const loadStage = useCallback(async () => {
        if (!editingStageId) {
            return;
        }

        try {
            setIsLoading(true);

            const result = await client.models.Stage.list({
                filter: {
                    stageId: {
                        eq: editingStageId,
                    },
                },
            });

            const item = result.data?.[0];

            if (!item) {
                Alert.alert("エラー", "ステージが見つかりません。");
                navigation.goBack();
                return;
            }

            setStageRecordId(item.id);
            setStageId(item.stageId);
            setTitle(item.title);
            setDifficulty(String(item.difficulty));
            setDifficultyLabel(item.difficultyLabel ?? "");
            setPuzzleBoard(JSON.parse(item.puzzleJson));
            setSolutionBoard(JSON.parse(item.solutionJson));
            setIsPublished(Boolean(item.isPublished));
        } catch (error) {
            console.error("Load stage error:", error);
            Alert.alert("エラー", "ステージの読み込みに失敗しました。");
        } finally {
            setIsLoading(false);
        }
    }, [editingStageId, navigation]);

    useEffect(() => {
        loadStage();
    }, [loadStage]);

    const handleSave = async () => {
        if (!stageId.trim()) {
            Alert.alert("入力確認", "ステージIDを入力してください。");
            return;
        }

        if (!title.trim()) {
            Alert.alert("入力確認", "タイトルを入力してください。");
            return;
        }

        const difficultyNumber = Number(difficulty);

        if (
            !Number.isInteger(difficultyNumber) ||
            difficultyNumber < 1 ||
            difficultyNumber > 5
        ) {
            Alert.alert("入力確認", "難易度は1〜5の整数で入力してください。");
            return;
        }

        try {
            validateBoard(puzzleBoard, "問題", true);
            validateBoard(solutionBoard, "解答", false);
        } catch (error) {
            Alert.alert(
                "入力確認",
                error instanceof Error
                    ? error.message
                    : "盤面の入力内容が正しくありません。",
            );
            return;
        }

        try {
            const user = await getCurrentUser();
            const now = new Date().toISOString();

            if (stageRecordId) {
                await client.models.Stage.update({
                    id: stageRecordId,
                    stageId: stageId.trim(),
                    title: title.trim(),
                    difficulty: difficultyNumber,
                    difficultyLabel: difficultyLabel.trim(),
                    puzzleJson: JSON.stringify(puzzleBoard),
                    solutionJson: JSON.stringify(solutionBoard),
                    givensCount: countGivens(puzzleBoard),
                    isPublished,
                    updatedAt: now,
                });

                Alert.alert("保存完了", "ステージを更新しました。");
            } else {
                const existing = await client.models.Stage.list({
                    filter: {
                        stageId: {
                            eq: stageId.trim(),
                        },
                    },
                });

                if ((existing.data ?? []).length > 0) {
                    Alert.alert(
                        "入力確認",
                        "同じステージIDのステージが既に存在します。",
                    );
                    return;
                }

                await client.models.Stage.create({
                    stageId: stageId.trim(),
                    title: title.trim(),
                    difficulty: difficultyNumber,
                    difficultyLabel: difficultyLabel.trim(),
                    puzzleJson: JSON.stringify(puzzleBoard),
                    solutionJson: JSON.stringify(solutionBoard),
                    givensCount: countGivens(puzzleBoard),
                    isPublished,
                    createdBy: user.userId,
                    createdAt: now,
                    updatedAt: now,
                });

                Alert.alert("作成完了", "ステージを作成しました。");
            }

            navigation.goBack();
        } catch (error) {
            console.error("Save stage error:", error);
            Alert.alert("エラー", "ステージの保存に失敗しました。");
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <Text style={styles.title}>
                {editingStageId ? "ステージ編集" : "ステージ作成"}
            </Text>

            <TextInput
                mode="outlined"
                label="ステージID"
                value={stageId}
                onChangeText={setStageId}
                style={styles.input}
                editable={!Boolean(editingStageId)}
                placeholder="stage-001"
            />

            <TextInput
                mode="outlined"
                label="タイトル"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                placeholder="初級 1"
            />

            <TextInput
                mode="outlined"
                label="難易度 1〜5"
                value={difficulty}
                onChangeText={setDifficulty}
                style={styles.input}
                keyboardType="number-pad"
            />

            <TextInput
                mode="outlined"
                label="難易度ラベル"
                value={difficultyLabel}
                onChangeText={setDifficultyLabel}
                style={styles.input}
                placeholder="初級"
            />

            <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>公開する</Text>
                <Switch value={isPublished} onValueChange={setIsPublished} />
            </View>

            <Text style={styles.boardLabel}>問題</Text>
            <Text style={styles.boardDescription}>
                空白マスは未入力のままにしてください。
            </Text>
            <StageBoardEditor
                board={puzzleBoard}
                onChangeBoard={setPuzzleBoard}
                allowZero
            />

            <Text style={styles.boardLabel}>解答</Text>
            <Text style={styles.boardDescription}>
                解答はすべてのマスを1〜9で入力してください。
            </Text>
            <StageBoardEditor
                board={solutionBoard}
                onChangeBoard={setSolutionBoard}
                allowZero={false}
            />

            <AppButton onPress={handleSave} disabled={isLoading}>
                保存
            </AppButton>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f7fa",
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#2f4050",
        marginBottom: 16,
    },
    input: {
        marginBottom: 12,
        backgroundColor: "#ffffff",
    },
    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    switchLabel: {
        fontSize: 16,
        color: "#2f4050",
    },
    boardLabel: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2f4050",
        marginTop: 12,
        marginBottom: 4,
    },
    boardDescription: {
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 8,
    },
});
