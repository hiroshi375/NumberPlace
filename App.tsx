import "react-native-gesture-handler";

import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import RootNavigator from "./src/navigation/RootNavigator";

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
