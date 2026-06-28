import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AdminHomeScreen from "../screens/AdminHomeScreen";
import GameScreen from "../screens/GameScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RankingScreen from "../screens/RankingScreen";
import StageAdminScreen from "../screens/StageAdminScreen";
import StageEditScreen from "../screens/StageEditScreen";
import StageImportScreen from "../screens/StageImportScreen";
import StageSelectScreen from "../screens/StageSelectScreen";

import type { RootStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ title: "NumberPlace" }}
                />
                <Stack.Screen
                    name="StageSelect"
                    component={StageSelectScreen}
                    options={{ title: "ステージ選択" }}
                />
                <Stack.Screen
                    name="Game"
                    component={GameScreen}
                    options={{ title: "ゲーム" }}
                />
                <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ title: "プロフィール" }}
                />
                <Stack.Screen
                    name="Ranking"
                    component={RankingScreen}
                    options={{ title: "ランキング" }}
                />
                <Stack.Screen
                    name="AdminHome"
                    component={AdminHomeScreen}
                    options={{ title: "管理者メニュー" }}
                />
                <Stack.Screen
                    name="StageAdmin"
                    component={StageAdminScreen}
                    options={{ title: "ステージ管理" }}
                />
                <Stack.Screen
                    name="StageEdit"
                    component={StageEditScreen}
                    options={{ title: "ステージ編集" }}
                />
                <Stack.Screen
                    name="StageImport"
                    component={StageImportScreen}
                    options={{ title: "ステージインポート" }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
