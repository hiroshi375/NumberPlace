type CalculateScoreParams = {
    filledCells: number;
    difficulty: number;
    elapsedSeconds: number;
    mistakes: number;
    hintsUsed: number;
    isCleared: boolean;
};

export function calculateScore({
    filledCells,
    difficulty,
    elapsedSeconds,
    mistakes,
    hintsUsed,
    isCleared,
}: CalculateScoreParams) {
    const cellScore = filledCells * 100;
    const difficultyBonus = difficulty * 1000;
    const clearBonus = isCleared ? difficulty * 2000 : 0;
    const timePenalty = elapsedSeconds;
    const mistakePenalty = mistakes * 50;
    const hintPenalty = hintsUsed * 100;

    const score =
        cellScore +
        difficultyBonus +
        clearBonus -
        timePenalty -
        mistakePenalty -
        hintPenalty;

    return Math.max(score, 0);
}
