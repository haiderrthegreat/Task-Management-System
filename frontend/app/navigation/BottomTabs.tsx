import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

import TeamsScreen from '../screens/WorkSpace';
import TasksScreen from '../screens/Tasks';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const getTabIcon = (routeName: keyof BottomTabParamList) => {
  switch (routeName) {
    case 'Home':
      return 'home-outline';
    case 'Tasks':
      return 'checkbox-outline';
    case 'Workspace':
      return 'people-outline';
    case 'Profile':
      return 'person-outline';
    default:
      return 'ellipse-outline';
  }
};

const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F8FAFC' },
        sceneStyle: { backgroundColor: '#F8FAFC' },
        title: route.name,
        tabBarActiveTintColor: '#4F6F73',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={getTabIcon(route.name as keyof BottomTabParamList)}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Workspace" component={TeamsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 66,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default BottomTabs;
