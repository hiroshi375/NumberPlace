export type RootStackParamList = {
    Home: undefined;
    StageSelect: undefined;
    Game: {
        stageId: string;
    };
    Profile: undefined;
    Ranking: {
        stageId?: string;
    };
    AdminHome: undefined;
    StageAdmin: undefined;
    StageEdit: {
        stageId?: string;
    };
    StageImport: undefined;
};
