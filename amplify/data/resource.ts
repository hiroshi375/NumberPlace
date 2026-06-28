import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update",
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
    UserProfile: a
        .model({
            userId: a.string().required(),
            email: a.email(),
            displayName: a.string().required(),
            iconKey: a.string(),
            role: a.string().default("user"), // user | admin
            rank: a.string().default("Beginner"),
            totalScore: a.integer().default(0),
            totalClearedStages: a.integer().default(0),
            createdAt: a.datetime(),
            updatedAt: a.datetime(),
        })
        .authorization((allow) => [
            // MVPではログイン済みユーザー全員が読めるようにする
            allow.authenticated().to(["read"]),

            // 自分のプロフィール作成・更新用
            allow.owner(),
        ]),

    Stage: a
        .model({
            stageId: a.string().required(),
            title: a.string().required(),
            difficulty: a.integer().required(), // 1〜5
            difficultyLabel: a.string(),
            puzzleJson: a.string().required(), // 9x9 board, 0 means empty
            solutionJson: a.string().required(), // 9x9 solved board
            givensCount: a.integer(),
            isPublished: a.boolean().default(false),
            createdBy: a.string(),
            createdAt: a.datetime(),
            updatedAt: a.datetime(),
        })
        .authorization((allow) => [
            // MVPではログイン済みユーザーがステージ一覧を読める
            //allow.authenticated().to(["read"]),

            // 管理者画面を先に作りやすくするため、初期段階ではログイン済みユーザーに作成も許可
            // 本番化する段階で allow.group("Admin") に変更する
            //allow.authenticated().to(["create", "update", "delete"]),

            // 暫定
            allow.authenticated().to(["read", "create", "update", "delete"]),
        ]),

    GameSession: a
        .model({
            sessionId: a.string().required(),
            userId: a.string().required(),
            stageId: a.string().required(),
            startedAt: a.datetime().required(),
            endedAt: a.datetime(),
            elapsedSeconds: a.integer(),
            score: a.integer().default(0),
            mistakes: a.integer().default(0),
            hintsUsed: a.integer().default(0),
            isCleared: a.boolean().default(false),
            boardJson: a.string(),
            memoJson: a.string(),
            createdAt: a.datetime(),
            updatedAt: a.datetime(),
        })
        .authorization((allow) => [
            // 自分のプレイ履歴を作成・更新・削除
            allow.owner(),

            // ランキングや比較表示用にログイン済みユーザーが読める
            allow.authenticated().to(["read"]),
        ]),

    RankingEntry: a
        .model({
            rankingId: a.string().required(),
            userId: a.string().required(),
            stageId: a.string(), // null/空なら総合用にも使える
            displayName: a.string(),
            iconKey: a.string(),
            score: a.integer().required(),
            elapsedSeconds: a.integer().required(),
            clearedAt: a.datetime().required(),
            mistakes: a.integer().default(0),
            hintsUsed: a.integer().default(0),
        })
        .authorization((allow) => [
            // 暫定
            allow.authenticated().to(["read", "create"]),
            // ランキングは全ログインユーザーが読める
            //allow.authenticated().to(["read"]),

            // クリア時に自分のランキングを作成
            allow.owner(),

            // MVP用。必要に応じて後で Admin のみにする
            //allow.authenticated().to(["create"]),
        ]),

    UserStageProgress: a
        .model({
            userId: a.string().required(),
            stageId: a.string().required(),
            bestScore: a.integer().default(0),
            bestElapsedSeconds: a.integer(),
            clearedCount: a.integer().default(0),
            lastPlayedAt: a.datetime(),
            isCleared: a.boolean().default(false),
        })
        .authorization((allow) => [
            allow.owner(),
            allow.authenticated().to(["read"]),
        ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: "userPool",
    },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
