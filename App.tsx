import "react-native-gesture-handler";

import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react-native";
import { Amplify } from "aws-amplify";
import { SafeAreaProvider } from "react-native-safe-area-context";

import amplifyOutputs from "./amplify_outputs.json";
import RootNavigator from "./src/navigation/RootNavigator";

Amplify.configure(amplifyOutputs);

export default function App() {
    return (
        <ThemeProvider>
            <Authenticator.Provider>
                <Authenticator>
                    <SafeAreaProvider>
                        <RootNavigator />
                    </SafeAreaProvider>
                </Authenticator>
            </Authenticator.Provider>
        </ThemeProvider>
    );
}
