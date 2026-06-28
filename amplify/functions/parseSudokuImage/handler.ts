/// <reference types="node" />

import {
    BedrockRuntimeClient,
    ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

type EventArguments = {
    imageBase64: string;
    mimeType: string;
};

type AppSyncEvent = {
    arguments: EventArguments;
};

type Board = number[][];

const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION ?? "ap-northeast-1",
});

function extractJson(text: string) {
    const match = text.match(/\[[\s\S]*\]/);

    if (!match) {
        throw new Error("AI応答からJSON配列を抽出できませんでした。");
    }

    return match[0];
}

function validateBoard(board: unknown): Board {
    if (!Array.isArray(board) || board.length !== 9) {
        throw new Error("9行の配列ではありません。");
    }

    board.forEach((row) => {
        if (!Array.isArray(row) || row.length !== 9) {
            throw new Error("各行は9列である必要があります。");
        }

        row.forEach((value) => {
            if (
                typeof value !== "number" ||
                !Number.isInteger(value) ||
                value < 0 ||
                value > 9
            ) {
                throw new Error("各マスは0〜9の整数である必要があります。");
            }
        });
    });

    return board;
}

export const handler = async (event: AppSyncEvent) => {
    const { imageBase64, mimeType } = event.arguments;

    if (!imageBase64) {
        throw new Error("画像データが指定されていません。");
    }

    const format = mimeType.includes("png") ? "png" : "jpeg";
    const imageBytes = Buffer.from(imageBase64, "base64");

    const command = new ConverseCommand({
        modelId:
            process.env.BEDROCK_MODEL_ID ??
            "jp.anthropic.claude-haiku-4-5-20251001-v1:0",
        messages: [
            {
                role: "user",
                content: [
                    {
                        text:
                            "この画像は数独の9x9盤面です。" +
                            "画像内の数字を読み取り、9行9列のJSON配列だけを返してください。" +
                            "空白マスは0にしてください。" +
                            "説明文、Markdown、コードブロックは不要です。" +
                            "返答例: [[5,3,0,0,7,0,0,0,0], ...]",
                    },
                    {
                        image: {
                            format,
                            source: {
                                bytes: imageBytes,
                            },
                        },
                    },
                ],
            },
        ],
        inferenceConfig: {
            maxTokens: 1200,
            temperature: 0,
        },
    });

    const response = await client.send(command);

    const text =
        response.output?.message?.content
            ?.map((content) => content.text ?? "")
            .join("\n") ?? "";

    const jsonText = extractJson(text);
    const parsed = JSON.parse(jsonText);
    console.log("Parsed board before validation:", JSON.stringify(parsed));

    if (Array.isArray(parsed)) {
        console.log(
            "Parsed board row lengths:",
            parsed.map((row) =>
                Array.isArray(row) ? row.length : "not-array",
            ),
        );
    }

    const board = validateBoard(parsed);

    return {
        board,
    };
};
