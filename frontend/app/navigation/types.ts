import { NavigatorScreenParams } from "@react-navigation/native";

export type BottomTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Workspace: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  GetStarted: undefined;
  Login: undefined;
  SignUp: undefined;
  MainTabs: NavigatorScreenParams<BottomTabParamList> | undefined;
  WorkspaceDetail: {
    workspaceId: string;
    workspaceName?: string;
    workspaceDescription?: string;
    workspaceRole?: string;
  };
  InviteMember: { workspaceId: string };
  CreateWorkspace:
    | {
        workspaceId?: string;
        name?: string;
        description?: string | null;
      }
    | undefined;
  CreateTask: undefined;
  Details: { taskId: string; workspaceId: string };
  Comments: { taskId: string };
  FilterSearch: undefined;
  FileAttachments: { taskId: string };
  Notifications: undefined;
};
