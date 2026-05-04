import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons'; // Assuming you are using Expo or have this installed

import Screen from '../components/Screen';
import { RootStackParamList } from '../navigation/types';
import { API, useLogoutMutation } from '../store/api';
import { useAppDispatch } from '../store/hooks';
import { clearAuth } from '../store/slices/authSlice';

const ProfileScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
      <View style={styles.container}>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Notifications')}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
              <Feather name="bell" size={22} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Notifications</Text>
              <Text style={styles.cardSubtitle}>Alerts & reminders</Text>
            </View>
          </View>
          <View style={styles.chevronContainer}>
            <Feather name="chevron-right" size={16} color="#64748B" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PrivacyPolicy')}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
              <Feather name="lock" size={22} color="#9333EA" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Privacy Policy</Text>
              <Text style={styles.cardSubtitle}>How we use your data</Text>
            </View>
          </View>
          <View style={styles.chevronContainer}>
            <Feather name="chevron-right" size={16} color="#64748B" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TermsAndConditions')}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
              <Feather name="file-text" size={22} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Terms and Conditions</Text>
              <Text style={styles.cardSubtitle}>Usage agreement</Text>
            </View>
          </View>
          <View style={styles.chevronContainer}>
            <Feather name="chevron-right" size={16} color="#64748B" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('FAQ')}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEF9C3' }]}>
              <Feather name="help-circle" size={22} color="#CA8A04" />
            </View>
            <View>
              <Text style={styles.cardTitle}>FAQ</Text>
              <Text style={styles.cardSubtitle}>Common questions</Text>
            </View>
          </View>
          <View style={styles.chevronContainer}>
            <Feather name="chevron-right" size={16} color="#64748B" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AboutUs')}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#F5F3FF' }]}>
              <Feather name="info" size={22} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.cardTitle}>About Us</Text>
              <Text style={styles.cardSubtitle}>Our story & mission</Text>
            </View>
          </View>
          <View style={styles.chevronContainer}>
            <Feather name="chevron-right" size={16} color="#64748B" />
          </View>
        </TouchableOpacity>
  
        <TouchableOpacity 
          style={[styles.card, styles.logoutCard]} 
          onPress={handleLogout} 
          disabled={isLoggingOut}
        >
          <View style={styles.cardLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="log-out" size={22} color="#DC2626" />
            </View>
            <Text style={styles.logoutText}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 2,
  },
  settingsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    // borderWidth: 1,
    // borderColor: '#E2E8F0',
    borderRadius: 16,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    marginTop: 8, // slight extra gap before logout if desired
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});

export default ProfileScreen;