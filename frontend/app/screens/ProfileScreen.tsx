import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppCard from '../components/AppCard';
import Avatar from '../components/Avatar';
import Screen from '../components/Screen';
import { taskflowRepository } from '../data/taskflowRepository';
import { RootStackParamList } from '../navigation/types';
import { API, useLogoutMutation } from '../store/api';
import { useAppDispatch } from '../store/hooks';
import { clearAuth } from '../store/slices/authSlice';

const ProfileScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tasks = taskflowRepository.getTasks();
  const workspaces = taskflowRepository.getWorkspaces();
  const [logout] = useLogoutMutation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (refreshToken) {
        await logout({ refreshToken }).unwrap();
      }
    } catch {
      // Local logout should still continue even if API call fails.
    } finally {
      await AsyncStorage.multiRemove(['user', 'token', 'refreshToken']);
      dispatch(clearAuth());
      dispatch(API.util.resetApiState());
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      setIsLoggingOut(false);
    }
  };

  return (
    <Screen disableTopInset>
      <AppCard>
        <View style={styles.profileRow}>
          <Avatar name="Noah Kim" size={52} />
          <View>
            <Text style={styles.name}>Noah Kim</Text>
            <Text style={styles.role}>Project Manager</Text>
          </View>
        </View>
      </AppCard>

      <View style={styles.grid}>
        <AppCard>
          <Text style={styles.metric}>{tasks.length}</Text>
          <Text style={styles.metricLabel}>Assigned Tasks</Text>
        </AppCard>
        <AppCard>
          <Text style={styles.metric}>{workspaces.length}</Text>
          <Text style={styles.metricLabel}>Workspaces</Text>
        </AppCard>
      </View>

      <AppCard>
        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.linkText}>Notifications</Text>
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('MainTabs', { screen: 'Workspace' })}>
          <Text style={styles.linkText}>Workspace List</Text>
        </Pressable>
        <Pressable style={styles.linkRow} onPress={handleLogout} disabled={isLoggingOut}>
          <Text style={styles.linkText}>{isLoggingOut ? 'Logging out...' : 'Logout'}</Text>
        </Pressable>
      </AppCard>
    </Screen>
  );
};

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  role: {
    color: '#64748B',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  metric: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    color: '#64748B',
  },
  linkRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  linkText: {
    color: '#0F766E',
    fontWeight: '600',
  },
});

export default ProfileScreen;
