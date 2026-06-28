import { defineFunction } from "@aws-amplify/backend";

export const parseSudokuImage = defineFunction({
    name: "parseSudokuImage",
    entry: "./handler.ts",
    timeoutSeconds: 60,
    environment: {
        BEDROCK_MODEL_ID: "jp.anthropic.claude-haiku-4-5-20251001-v1:0",
    },
});
