import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getCurrentUser } from "aws-amplify/auth";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import AppButton from "../components/AppButton";
import { client } from "../lib/client";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "StageImport">;

type Board = number[][];

type ImportStage = {
    stageId: string;
    title: string;
    difficulty: number;
    difficultyLabel?: string;
    puzzle: Board;
    solution: Board;
    isPublished?: boolean;
};

const SAMPLE_IMPORT_JSON = `[
  {
    "stageId": "stage-001",
    "title": "初級 1",
    "difficulty": 1,
    "difficultyLabel": "初級",
    "isPublished": true,
    "puzzle": [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ],
    "solution": [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9]
    ]
  }
]`;

function validateBoard(board: unknown, label: string): Board {
    if (!Array.isArray(board) || board.length !== 9) {
        throw new Error(`${label} は9行の配列にしてください。`);
    }

    board.forEach((row) => {
        if (!Array.isArray(row) || row.length !== 9) {
            throw new Error(`${label} の各行は9列にしてください。`);
        }

        row.forEach((value) => {
            if (
                typeof value !== "number" ||
                !Number.isInteger(value) ||
                value < 0 ||
                value > 9
            ) {
                throw new Error(
                    `${label} の各マスは0〜9の整数にしてください。`,
                );
            }
        });
    });

    return board;
}

function countGivens(board: Board) {
    return board.flat().filter((value) => value !== 0).length;
}

function parseImportJson(text: string): ImportStage[] {
    const parsed = JSON.parse(text);
    const stages = Array.isArray(parsed) ? parsed : [parsed];

    return stages.map((stage, index) => {
        if (!stage.stageId || typeof stage.stageId !== "string") {
            throw new Error(`${index + 1}件目: stageId が不正です。`);
        }

        if (!stage.title || typeof stage.title !== "string") {
            throw new Error(`${index + 1}件目: title が不正です。`);
        }

        if (
            typeof stage.difficulty !== "number" ||
            !Number.isInteger(stage.difficulty) ||
            stage.difficulty < 1 ||
            stage.difficulty > 5
        ) {
            throw new Error(
                `${index + 1}件目: difficulty は1〜5にしてください。`,
            );
        }

        const puzzle = validateBoard(stage.puzzle, `${index + 1}件目 puzzle`);
        const solution = validateBoard(
            stage.solution,
            `${index + 1}件目 solution`,
        );

        return {
            stageId: stage.stageId,
            title: stage.title,
            difficulty: stage.difficulty,
            difficultyLabel: stage.difficultyLabel ?? "",
            puzzle,
            solution,
            isPublished: Boolean(stage.isPublished),
        };
    });
}

export default function StageImportScreen({ navigation }: Props) {
    const [selectedFileName, setSelectedFileName] = useState("");
    const [stages, setStages] = useState<ImportStage[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    const handlePickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "application/json",
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled) {
                return;
            }

            const asset = result.assets[0];

            if (!asset?.uri) {
                Alert.alert("エラー", "ファイルを読み込めませんでした。");
                return;
            }

            const fileText = await FileSystem.readAsStringAsync(asset.uri);
            const parsedStages = parseImportJson(fileText);

            setSelectedFileName(asset.name ?? "選択済みファイル");
            setStages(parsedStages);

            Alert.alert(
                "読み込み完了",
                `${parsedStages.length}件のステージを読み込みました。`,
            );
        } catch (error) {
            console.error("Pick import file error:", error);
            setSelectedFileName("");
            setStages([]);

            Alert.alert(
                "エラー",
                error instanceof Error
                    ? error.message
                    : "JSONファイルの読み込みに失敗しました。",
            );
        }
    };

    const handleImport = async () => {
        if (stages.length === 0) {
            Alert.alert("入力確認", "先にJSONファイルを選択してください。");
            return;
        }

        try {
            setIsImporting(true);

            const user = await getCurrentUser();
            const now = new Date().toISOString();

            let createdCount = 0;
            let updatedCount = 0;

            for (const stage of stages) {
                const existing = await client.models.Stage.list({
                    filter: {
                        stageId: {
                            eq: stage.stageId,
                        },
                    },
                });

                const existingStage = existing.data?.[0];

                const payload = {
                    stageId: stage.stageId,
                    title: stage.title,
                    difficulty: stage.difficulty,
                    difficultyLabel: stage.difficultyLabel,
                    puzzleJson: JSON.stringify(stage.puzzle),
                    solutionJson: JSON.stringify(stage.solution),
                    givensCount: countGivens(stage.puzzle),
                    isPublished: stage.isPublished,
                    updatedAt: now,
                };

                if (existingStage) {
                    await client.models.Stage.update({
                        id: existingStage.id,
                        ...payload,
                    });
                    updatedCount += 1;
                } else {
                    await client.models.Stage.create({
                        ...payload,
                        createdBy: user.userId,
                        createdAt: now,
                    });
                    createdCount += 1;
                }
            }

            Alert.alert(
                "インポート完了",
                `作成: ${createdCount}件\n更新: ${updatedCount}件`,
                [
                    {
                        text: "OK",
                        onPress: () => navigation.goBack(),
                    },
                ],
            );
        } catch (error) {
            console.error("Import stages error:", error);
            Alert.alert("エラー", "ステージのインポートに失敗しました。");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <Text style={styles.title}>ステージインポート</Text>

            <Text style={styles.description}>
                JSONファイルを選択してステージを一括登録・更新します。
                同じstageIdが存在する場合は更新します。
            </Text>

            <AppButton mode="outlined" onPress={handlePickFile}>
                JSONファイルを選択
            </AppButton>

            <View style={styles.fileInfoBox}>
                <Text style={styles.fileInfoLabel}>選択中のファイル</Text>
                <Text style={styles.fileInfoValue}>
                    {selectedFileName || "未選択"}
                </Text>
            </View>

            <View style={styles.fileInfoBox}>
                <Text style={styles.fileInfoLabel}>読み込み件数</Text>
                <Text style={styles.fileInfoValue}>{stages.length}件</Text>
            </View>

            {stages.length > 0 && (
                <View style={styles.previewBox}>
                    <Text style={styles.previewTitle}>読み込み内容</Text>

                    {stages.slice(0, 5).map((stage) => (
                        <View key={stage.stageId} style={styles.previewItem}>
                            <Text style={styles.previewStageTitle}>
                                {stage.title}
                            </Text>
                            <Text style={styles.previewStageText}>
                                ID: {stage.stageId}
                            </Text>
                            <Text style={styles.previewStageText}>
                                難易度: {stage.difficultyLabel || "-"} /{" "}
                                {stage.difficulty}
                            </Text>
                            <Text style={styles.previewStageText}>
                                初期数字数: {countGivens(stage.puzzle)}
                            </Text>
                        </View>
                    ))}

                    {stages.length > 5 && (
                        <Text style={styles.moreText}>
                            ほか {stages.length - 5} 件
                        </Text>
                    )}
                </View>
            )}

            <AppButton onPress={handleImport} disabled={isImporting}>
                インポート実行
            </AppButton>

            <View style={styles.sampleBox}>
                <Text style={styles.sampleTitle}>インポートJSONサンプル</Text>
                <Text style={styles.sampleDescription}>
                    以下の形式のJSONファイルを選択してください。
                    0は空白マスを表します。
                </Text>

                <ScrollView horizontal style={styles.sampleCodeScroll}>
                    <Text style={styles.sampleCode}>{SAMPLE_IMPORT_JSON}</Text>
                </ScrollView>
            </View>
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
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        lineHeight: 21,
        color: "#4b5563",
        marginBottom: 16,
    },
    fileInfoBox: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
    },
    fileInfoLabel: {
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 4,
    },
    fileInfoValue: {
        fontSize: 16,
        color: "#2f4050",
        fontWeight: "600",
    },
    previewBox: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 12,
        marginTop: 16,
        marginBottom: 16,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2f4050",
        marginBottom: 8,
    },
    previewItem: {
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        paddingTop: 8,
        marginTop: 8,
    },
    previewStageTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#2f4050",
        marginBottom: 2,
    },
    previewStageText: {
        fontSize: 13,
        color: "#4b5563",
    },
    moreText: {
        marginTop: 8,
        color: "#6b7280",
    },
    sampleBox: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 12,
        marginTop: 20,
    },
    sampleTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2f4050",
        marginBottom: 6,
    },
    sampleDescription: {
        fontSize: 13,
        lineHeight: 19,
        color: "#6b7280",
        marginBottom: 10,
    },
    sampleCodeScroll: {
        backgroundColor: "#f3f4f6",
        borderRadius: 8,
        padding: 10,
    },
    sampleCode: {
        fontSize: 12,
        lineHeight: 18,
        color: "#374151",
        fontFamily: "monospace",
    },
});
