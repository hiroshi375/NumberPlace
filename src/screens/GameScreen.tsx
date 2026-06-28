import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getCurrentUser } from "aws-amplify/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { Card, Text } from "react-native-paper";

import AppButton from "../components/AppButton";
import NumberPad from "../components/NumberPad";
import SudokuBoard from "../components/SudokuBoard";
import { client } from "../lib/client";

import type { RootStackParamList } from "../types/navigation";
import type {
    MemoBoard,
    SudokuBoard as SudokuBoardType,
} from "../types/sudoku";
import { calculateScore } from "../utils/score";
import {
    cloneBoard,
    countFilledCells,
    createEmptyMemoBoard,
    createInitialBoardFromPuzzle,
    isBoardCleared,
    isGivenCell,
    parseBoardJson,
} from "../utils/sudoku";
import { formatElapsedTime } from "../utils/time";

type Props = NativeStackScreenProps<RootStackParamList, "Game">;

type StageData = {
    id: string;
    stageId: string;
    title: string;
    difficulty: number;
    difficultyLabel?: string | null;
    puzzleJson: string;
    solutionJson: string;
};

export default function GameScreen({ route, navigation }: Props) {
    const { width } = useWindowDimensions();

    const screenHorizontalPadding = 8 * 2;
    const boardSize = width - screenHorizontalPadding;

    const { stageId } = route.params;

    const [stage, setStage] = useState<StageData | null>(null);
    const [puzzle, setPuzzle] = useState<SudokuBoardType>([]);
    const [solution, setSolution] = useState<SudokuBoardType>([]);
    const [board, setBoard] = useState<SudokuBoardType>([]);
    const [memos, setMemos] = useState<MemoBoard>(createEmptyMemoBoard());

    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [selectedCol, setSelectedCol] = useState<number | null>(null);
    const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());

    const [isMemoMode, setIsMemoMode] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [isCleared, setIsCleared] = useState(false);
    const [startedAt, setStartedAt] = useState(() => new Date().toISOString());

    const [displayName, setDisplayName] = useState("プレイヤー");
    const [userId, setUserId] = useState("");

    const filledCells = useMemo(() => {
        if (board.length !== 9 || puzzle.length !== 9) {
            return 0;
        }

        return countFilledCells(board, puzzle);
    }, [board, puzzle]);

    const score = useMemo(() => {
        return calculateScore({
            filledCells,
            difficulty: stage?.difficulty ?? 1,
            elapsedSeconds,
            mistakes,
            hintsUsed,
            isCleared,
        });
    }, [
        filledCells,
        stage?.difficulty,
        elapsedSeconds,
        mistakes,
        hintsUsed,
        isCleared,
    ]);

    const disabledNumbers = useMemo(() => {
        const counts = Array.from({ length: 10 }, () => 0);

        board.forEach((rowValues, rowIndex) => {
            rowValues.forEach((value, colIndex) => {
                const cellKey = `${rowIndex}-${colIndex}`;

                if (value >= 1 && value <= 9 && !wrongCells.has(cellKey)) {
                    counts[value] += 1;
                }
            });
        });

        return new Set(
            counts
                .map((count, value) => ({ value, count }))
                .filter(({ value, count }) => value >= 1 && count >= 9)
                .map(({ value }) => value),
        );
    }, [board, wrongCells]);

    useEffect(() => {
        if (isCleared) {
            return;
        }

        const timerId = setInterval(() => {
            setElapsedSeconds((current) => current + 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [isCleared]);

    const loadUser = useCallback(async () => {
        try {
            const user = await getCurrentUser();
            setUserId(user.userId);

            const profileResult = await client.models.UserProfile.list({
                filter: {
                    userId: {
                        eq: user.userId,
                    },
                },
            });

            const profile = profileResult.data?.[0];

            if (profile?.displayName) {
                setDisplayName(profile.displayName);
            } else {
                setDisplayName(user.signInDetails?.loginId ?? "プレイヤー");
            }
        } catch (error) {
            console.error("Load user error:", error);
        }
    }, []);

    const loadStage = useCallback(async () => {
        try {
            const result = await client.models.Stage.list({
                filter: {
                    stageId: {
                        eq: stageId,
                    },
                },
            });

            const item = result.data?.[0];

            if (!item) {
                Alert.alert("エラー", "ステージが見つかりません。");
                navigation.goBack();
                return;
            }

            const parsedPuzzle = parseBoardJson(item.puzzleJson);
            const parsedSolution = parseBoardJson(item.solutionJson);

            setStage({
                id: item.id,
                stageId: item.stageId,
                title: item.title,
                difficulty: item.difficulty,
                difficultyLabel: item.difficultyLabel,
                puzzleJson: item.puzzleJson,
                solutionJson: item.solutionJson,
            });

            setPuzzle(parsedPuzzle);
            setSolution(parsedSolution);
            setBoard(createInitialBoardFromPuzzle(parsedPuzzle));
            setMemos(createEmptyMemoBoard());
        } catch (error) {
            console.error("Load stage error:", error);
            Alert.alert("エラー", "ステージの読み込みに失敗しました。");
        }
    }, [navigation, stageId]);

    useEffect(() => {
        loadUser();
        loadStage();
    }, [loadUser, loadStage]);

    const handleSelectCell = (row: number, col: number) => {
        setSelectedRow(row);
        setSelectedCol(col);
    };

    const handlePressNumber = async (value: number) => {
        if (
            selectedRow === null ||
            selectedCol === null ||
            puzzle.length !== 9 ||
            board.length !== 9 ||
            solution.length !== 9
        ) {
            return;
        }

        if (isGivenCell(puzzle, selectedRow, selectedCol)) {
            return;
        }

        if (isMemoMode) {
            setMemos((current) => {
                const next = current.map((row) => row.map((cell) => [...cell]));
                const currentMemos = next[selectedRow][selectedCol];

                if (currentMemos.includes(value)) {
                    next[selectedRow][selectedCol] = currentMemos.filter(
                        (n) => n !== value,
                    );
                } else {
                    next[selectedRow][selectedCol] = [
                        ...currentMemos,
                        value,
                    ].sort();
                }

                return next;
            });

            return;
        }

        const nextBoard = cloneBoard(board);
        nextBoard[selectedRow][selectedCol] = value;

        const cellKey = `${selectedRow}-${selectedCol}`;
        const nextWrongCells = new Set(wrongCells);

        if (value !== solution[selectedRow][selectedCol]) {
            nextWrongCells.add(cellKey);
            setMistakes((current) => current + 1);
            setWrongCells(nextWrongCells);
            setBoard(nextBoard);

            Alert.alert("NG", "その数字は正しくありません。");
            return;
        }

        nextWrongCells.delete(cellKey);
        setWrongCells(nextWrongCells);

        setMemos((current) => {
            const next = current.map((row) => row.map((cell) => [...cell]));
            next[selectedRow][selectedCol] = [];
            return next;
        });

        setBoard(nextBoard);

        if (isBoardCleared(nextBoard, solution)) {
            await handleClear(nextBoard);
        }
    };

    const handleClearCell = () => {
        if (
            selectedRow === null ||
            selectedCol === null ||
            puzzle.length !== 9 ||
            board.length !== 9
        ) {
            return;
        }

        if (isGivenCell(puzzle, selectedRow, selectedCol)) {
            return;
        }

        const nextBoard = cloneBoard(board);
        nextBoard[selectedRow][selectedCol] = 0;
        setBoard(nextBoard);

        const cellKey = `${selectedRow}-${selectedCol}`;
        const nextWrongCells = new Set(wrongCells);
        nextWrongCells.delete(cellKey);
        setWrongCells(nextWrongCells);

        setMemos((current) => {
            const next = current.map((row) => row.map((cell) => [...cell]));
            next[selectedRow][selectedCol] = [];
            return next;
        });
    };

    const handleClearAll = () => {
        Alert.alert("確認", "入力した数字をすべてクリアしますか？", [
            {
                text: "キャンセル",
                style: "cancel",
            },
            {
                text: "全てクリア",
                style: "destructive",
                onPress: () => {
                    setBoard(createInitialBoardFromPuzzle(puzzle));
                    setMemos(createEmptyMemoBoard());
                    setWrongCells(new Set());
                    setSelectedRow(null);
                    setSelectedCol(null);

                    setElapsedSeconds(0);
                    setStartedAt(new Date().toISOString());
                    setMistakes(0);
                    setHintsUsed(0);
                    setIsMemoMode(false);
                    setIsCleared(false);
                },
            },
        ]);
    };

    const handleHint = () => {
        if (
            board.length !== 9 ||
            solution.length !== 9 ||
            puzzle.length !== 9
        ) {
            return;
        }

        for (let row = 0; row < 9; row += 1) {
            for (let col = 0; col < 9; col += 1) {
                if (puzzle[row][col] === 0 && board[row][col] === 0) {
                    const nextBoard = cloneBoard(board);
                    nextBoard[row][col] = solution[row][col];

                    setBoard(nextBoard);
                    setSelectedRow(row);
                    setSelectedCol(col);
                    setHintsUsed((current) => current + 1);

                    if (isBoardCleared(nextBoard, solution)) {
                        handleClear(nextBoard);
                    }

                    return;
                }
            }
        }
    };

    const handleClear = async (clearedBoard: SudokuBoardType) => {
        if (!stage || !userId) {
            return;
        }

        setIsCleared(true);

        const endedAt = new Date().toISOString();

        const finalScore = calculateScore({
            filledCells: countFilledCells(clearedBoard, puzzle),
            difficulty: stage.difficulty,
            elapsedSeconds,
            mistakes,
            hintsUsed,
            isCleared: true,
        });

        try {
            await client.models.GameSession.create({
                sessionId: `${userId}-${stage.stageId}-${Date.now()}`,
                userId,
                stageId: stage.stageId,
                startedAt,
                endedAt,
                elapsedSeconds,
                score: finalScore,
                mistakes,
                hintsUsed,
                isCleared: true,
                boardJson: JSON.stringify(clearedBoard),
                memoJson: JSON.stringify(memos),
                createdAt: startedAt,
                updatedAt: endedAt,
            });

            await client.models.RankingEntry.create({
                rankingId: `${stage.stageId}-${userId}-${Date.now()}`,
                userId,
                stageId: stage.stageId,
                displayName,
                score: finalScore,
                elapsedSeconds,
                clearedAt: endedAt,
                mistakes,
                hintsUsed,
            });

            Alert.alert(
                "Clear!",
                `スコア: ${finalScore}\nクリア時間: ${formatElapsedTime(elapsedSeconds)}`,
                [
                    {
                        text: "ランキングを見る",
                        onPress: () =>
                            navigation.navigate("Ranking", {
                                stageId: stage.stageId,
                            }),
                    },
                    {
                        text: "OK",
                    },
                ],
            );
        } catch (error) {
            console.error("Clear save error:", error);
            Alert.alert("Clear!", "クリアしましたが、結果保存に失敗しました。");
        }
    };

    const handleStop = () => {
        Alert.alert("確認", "ゲームを停止してホームに戻りますか？", [
            {
                text: "キャンセル",
                style: "cancel",
            },
            {
                text: "停止する",
                style: "destructive",
                onPress: () => navigation.navigate("Home"),
            },
        ]);
    };

    if (!stage || board.length !== 9 || puzzle.length !== 9) {
        return (
            <View style={styles.loadingContainer}>
                <Text>読み込み中...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <Card style={styles.infoCard}>
                <Card.Content>
                    <Text style={styles.stageTitle}>{stage.title}</Text>
                    <Text style={styles.infoText}>
                        プレイヤー: {displayName}
                    </Text>
                    <Text style={styles.infoText}>
                        難易度: {"⭐️".repeat(stage.difficulty)}
                    </Text>
                    <Text style={styles.infoText}>
                        時間: {formatElapsedTime(elapsedSeconds)}
                    </Text>
                    <Text style={styles.infoText}>スコア: {score}</Text>
                    <Text style={styles.infoText}>
                        ミス: {mistakes} / ヒント: {hintsUsed}
                    </Text>
                </Card.Content>
            </Card>

            {isCleared ? <Text style={styles.clearText}>Clear!</Text> : null}

            <SudokuBoard
                puzzle={puzzle}
                board={board}
                memos={memos}
                wrongCells={wrongCells}
                selectedRow={selectedRow}
                selectedCol={selectedCol}
                onSelectCell={handleSelectCell}
                boardSize={boardSize}
            />

            <NumberPad
                onPressNumber={handlePressNumber}
                onClearCell={handleClearCell}
                isMemoMode={isMemoMode}
                onToggleMemoMode={() => setIsMemoMode((current) => !current)}
                disabledNumbers={disabledNumbers}
            />

            <View style={styles.bottomActions}>
                <AppButton onPress={handleHint}>ヒント</AppButton>

                <AppButton mode="outlined" onPress={handleClearAll}>
                    全てクリア
                </AppButton>

                <AppButton mode="outlined" onPress={handleStop}>
                    停止
                </AppButton>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f7fa",
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    clearText: {
        textAlign: "center",
        fontSize: 32,
        fontWeight: "700",
        color: "#16a34a",
        marginBottom: 12,
    },
    content: {
        padding: 8,
        paddingBottom: 24,
    },
    infoCard: {
        marginBottom: 8,
        borderRadius: 12,
    },
    stageTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 4,
        color: "#2f4050",
    },
    infoText: {
        fontSize: 12,
        color: "#4b5563",
        marginBottom: 1,
    },
    bottomActions: {
        marginTop: 8,
    },
});
