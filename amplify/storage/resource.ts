import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
    name: "numberPlaceStorage",
    access: (allow) => ({
        "profile-icons/*": [
            allow.authenticated.to(["read", "write", "delete"]),
        ],
    }),
});
