import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getCurrentUser } from "aws-amplify/auth";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, View } from "react-native";
import { Switch, Text, TextInput } from "react-native-paper";
import StageBoardEditor from "../components/StageBoardEditor";

import AppButton from "../components/AppButton";
import { client } from "../lib/client";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "StageImport">;

type Board = number[][];

const createEmptyBoard = (): Board =>
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

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

function validateBoard(
    board: unknown,
    label: string,
    allowZero: boolean = true,
): Board {
    if (!Array.isArray(board) || board.length !== 9) {
        throw new Error(`${label} は9行の配列にしてください。`);
    }

    board.forEach((row, rowIndex) => {
        if (!Array.isArray(row) || row.length !== 9) {
            throw new Error(
                `${label} の${rowIndex + 1}行目は9列にしてください。`,
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
                    `${label} の${rowIndex + 1}行${colIndex + 1}列目は0〜9の整数にしてください。`,
                );
            }

            if (!allowZero && value === 0) {
                throw new Error(
                    `${label} の${rowIndex + 1}行${colIndex + 1}列目が未入力です。`,
                );
            }
        });
    });

    return board as Board;
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

        const puzzle = validateBoard(
            stage.puzzle,
            `${index + 1}件目 puzzle`,
            true,
        );

        const solution = validateBoard(
            stage.solution,
            `${index + 1}件目 solution`,
            false,
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

function parseSudokuImageResult(data: unknown): { board?: Board } | null {
    if (!data) {
        return null;
    }

    if (typeof data === "string") {
        return JSON.parse(data) as { board?: Board };
    }

    return data as { board?: Board };
}

export default function StageImportScreen({ navigation }: Props) {
    const [selectedFileName, setSelectedFileName] = useState("");
    const [stages, setStages] = useState<ImportStage[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    const [stageId, setStageId] = useState("");
    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState("1");
    const [difficultyLabel, setDifficultyLabel] = useState("初級");
    const [isPublished, setIsPublished] = useState(true);

    const [puzzleBoard, setPuzzleBoard] = useState<Board>(createEmptyBoard());
    const [solutionBoard, setSolutionBoard] =
        useState<Board>(createEmptyBoard());

    const [puzzleImageUri, setPuzzleImageUri] = useState<string | null>(null);
    const [solutionImageUri, setSolutionImageUri] = useState<string | null>(
        null,
    );

    const [isParsingPuzzle, setIsParsingPuzzle] = useState(false);
    const [isParsingSolution, setIsParsingSolution] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const captureAndParseBoard = async (target: "puzzle" | "solution") => {
        try {
            const permissionResult =
                await ImagePicker.requestCameraPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert(
                    "権限が必要です",
                    "カメラから取り込むため、カメラ権限を許可してください。",
                );
                return;
            }

            if (target === "puzzle") {
                setIsParsingPuzzle(true);
            } else {
                setIsParsingSolution(true);
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                quality: 0.7,
                base64: true,
            });

            if (result.canceled) {
                return;
            }

            const asset = result.assets[0];

            if (!asset?.base64 || !asset.uri) {
                Alert.alert("エラー", "画像を読み込めませんでした。");
                return;
            }

            const mimeType = asset.mimeType ?? "image/jpeg";

            const parseResult = await client.queries.parseSudokuImage({
                imageBase64: asset.base64,
                mimeType,
            });

            console.log(
                "parseSudokuImage result:",
                JSON.stringify(parseResult, null, 2),
            );

            if (parseResult.errors && parseResult.errors.length > 0) {
                console.error("parseSudokuImage errors:", parseResult.errors);
                Alert.alert("エラー", "画像解析でエラーが発生しました。");
                return;
            }

            const data = parseSudokuImageResult(parseResult.data);

            if (!data?.board) {
                Alert.alert("エラー", "盤面を読み取れませんでした。");
                return;
            }

            if (target === "puzzle") {
                setPuzzleImageUri(asset.uri);
                setPuzzleBoard(data.board);
                Alert.alert("読み取り完了", "問題画像を盤面に変換しました。");
            } else {
                setSolutionImageUri(asset.uri);
                setSolutionBoard(data.board);
                Alert.alert("読み取り完了", "解答画像を盤面に変換しました。");
            }
        } catch (error) {
            console.error("Capture and parse board error:", error);
            Alert.alert("エラー", "画像から盤面の読み取りに失敗しました。");
        } finally {
            setIsParsingPuzzle(false);
            setIsParsingSolution(false);
        }
    };

    const handleSaveCameraImport = async () => {
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
            setIsSaving(true);

            const user = await getCurrentUser();
            const now = new Date().toISOString();

            const existing = await client.models.Stage.list({
                filter: {
                    stageId: {
                        eq: stageId.trim(),
                    },
                },
            });

            const existingStage = existing.data?.[0];

            const payload = {
                stageId: stageId.trim(),
                title: title.trim(),
                difficulty: difficultyNumber,
                difficultyLabel: difficultyLabel.trim(),
                puzzleJson: JSON.stringify(puzzleBoard),
                solutionJson: JSON.stringify(solutionBoard),
                givensCount: countGivens(puzzleBoard),
                isPublished,
                updatedAt: now,
            };

            if (existingStage) {
                await client.models.Stage.update({
                    id: existingStage.id,
                    ...payload,
                });

                Alert.alert("保存完了", "既存ステージを更新しました。");
            } else {
                await client.models.Stage.create({
                    ...payload,
                    createdBy: user.userId,
                    createdAt: now,
                });

                Alert.alert("保存完了", "新しいステージを作成しました。");
            }
        } catch (error) {
            console.error("Save camera import stage error:", error);
            Alert.alert("エラー", "ステージの保存に失敗しました。");
        } finally {
            setIsSaving(false);
        }
    };

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
            <Text style={styles.sectionTitle}>カメラから取込</Text>

            <Text style={styles.description}>
                問題画像と解答画像をそれぞれ撮影し、9×9の盤面へ変換します。
                保存前にプレビューを確認・修正できます。
            </Text>

            <AppButton
                mode="outlined"
                onPress={() => captureAndParseBoard("puzzle")}
                disabled={isParsingPuzzle || isParsingSolution}
            >
                問題画像をカメラから取込
            </AppButton>

            {puzzleImageUri && (
                <Image
                    source={{ uri: puzzleImageUri }}
                    style={styles.previewImage}
                />
            )}

            <AppButton
                mode="outlined"
                onPress={() => captureAndParseBoard("solution")}
                disabled={isParsingPuzzle || isParsingSolution}
            >
                解答画像をカメラから取込
            </AppButton>

            {solutionImageUri && (
                <Image
                    source={{ uri: solutionImageUri }}
                    style={styles.previewImage}
                />
            )}

            <TextInput
                mode="outlined"
                label="ステージID"
                value={stageId}
                onChangeText={setStageId}
                style={styles.input}
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

            <Text style={styles.boardLabel}>問題プレビュー</Text>
            <StageBoardEditor
                board={puzzleBoard}
                onChangeBoard={setPuzzleBoard}
                allowZero
            />

            <Text style={styles.boardLabel}>解答プレビュー</Text>
            <StageBoardEditor
                board={solutionBoard}
                onChangeBoard={setSolutionBoard}
                allowZero={false}
            />

            <AppButton onPress={handleSaveCameraImport} disabled={isSaving}>
                保存
            </AppButton>

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
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2f4050",
        marginTop: 20,
        marginBottom: 8,
    },
    input: {
        marginBottom: 12,
        backgroundColor: "#ffffff",
    },
    previewImage: {
        width: "100%",
        height: 180,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 12,
        backgroundColor: "#e5e7eb",
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
        marginBottom: 8,
    },
});
