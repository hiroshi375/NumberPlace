import { defineBackend } from "@aws-amplify/backend";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { parseSudokuImage } from "./functions/parseSudokuImage/resource";
import { storage } from "./storage/resource";

const backend = defineBackend({
    auth,
    data,
    storage,
    parseSudokuImage,
});

backend.parseSudokuImage.resources.lambda.addToRolePolicy(
    new PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: ["*"],
    }),
);
