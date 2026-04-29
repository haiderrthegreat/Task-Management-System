import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DetailsScreen from '../screens/DetailsScreen';
import CommentsScreen from '../screens/CommentsScreen';
import CreateWorkspaceScreen from '../screens/CreateWorkspaceScreen';
import FileAttachmentsScreen from '../screens/FileAttachmentsScreen';
import FilterSearchScreen from '../screens/FilterSearchScreen';
// import GetStartedScreen from '../screens/GetStartedScreen';
import InviteMemberScreen from '../screens/InviteMemberScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import WorkspaceDetailScreen from '../screens/WorkspaceDetailScreen';
import { CreateTaskScreen, LoginScreen, SignUpScreen } from '../screens';
import BottomTabs from './BottomTabs';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

type StackNavigatorProps = {
  initialRouteName?: keyof RootStackParamList;
  navigatorKey?: string;
};

const StackNavigator = ({ initialRouteName = 'Login', navigatorKey }: StackNavigatorProps) => {
  return (
    <Stack.Navigator
      key={navigatorKey}
      initialRouteName={initialRouteName}
      screenOptions={{
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F8FAFC' },
        contentStyle: { backgroundColor: '#F8FAFC' },
        statusBarTranslucent: false,
      }}
    >
      {/* <Stack.Screen
        name="GetStarted"
        component={GetStartedScreen}
        options={{ headerShown: false }}
      /> */}
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Sign Up' }} />
      <Stack.Screen
        name="MainTabs"
        component={BottomTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WorkspaceDetail"
        component={WorkspaceDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InviteMember"
        component={InviteMemberScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateWorkspace"
        component={CreateWorkspaceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Comments"
        component={CommentsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="FilterSearch" component={FilterSearchScreen} options={{ title: 'Filters & Search' }} />
      <Stack.Screen
        name="FileAttachments"
        component={FileAttachmentsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
