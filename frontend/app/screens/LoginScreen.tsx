import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Screen from '../components/Screen';
import { RootStackParamList } from '../navigation/types';
import { getApiErrorMessage, useLoginMutation } from '../store/api';
import { useAppDispatch } from '../store/hooks';
import { setToken, setUser } from '../store/slices/authSlice';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [login] = useLoginMutation();

  const validate = () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required.');
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      const payload = {
        email: email.trim(),
        password,
      };

      setLoading(true);
      const response = await login(payload).unwrap();

      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(response?.user ?? null)),
        AsyncStorage.setItem('token', response?.accessToken ?? ''),
        AsyncStorage.setItem('refreshToken', response?.refreshToken ?? ''),
      ]);

      dispatch(setUser(response?.user ?? null));
      dispatch(setToken(response?.accessToken ?? null));
      navigation.replace('MainTabs');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Unable to login right now.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Screen style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.brand}>TaskFlow</Text>
          <Text style={styles.subtitle}>
            Sign in to continue managing your tasks 
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textBtn}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.textBtnLabel}>
              Don’t have an account? Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </Screen>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20, // ✅ horizontal spacing fixed
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    color: '#64748B',
    marginBottom: 28,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 14,
    color: '#0F172A',
  },
  errorText: {
    color: '#B91C1C',
    marginBottom: 12,
    fontSize: 13,
  },
  primaryBtn: {
    marginTop: 10,
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  textBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  textBtnLabel: {
    color: '#0F766E',
    fontWeight: '600',
  },
});

export default LoginScreen;