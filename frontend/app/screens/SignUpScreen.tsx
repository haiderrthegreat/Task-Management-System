import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  View,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import Screen from '../components/Screen';
import { RootStackParamList } from '../navigation/types';
import { getApiErrorMessage, useSignupMutation } from '../store/api';

type SignUpScreenProps = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signup] = useSignupMutation();

  const validate = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Name, email and password are required.');
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleSignUp = async () => {
    if (!validate()) return;

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
      };

      setLoading(true);
      const response = await signup(payload).unwrap();
      const successMessage = response?.message || 'User Created Successfully';
      // console.log(successMessage);
      Alert.alert('Success', successMessage, [
        {
          text: 'OK',
          onPress: () => navigation.replace('Login'),
        },
      ]);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Unable to create your account right now.'));
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
            Create an account to start managing tasks
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
          />
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
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.textBtnLabel}>
              Already have an account? Login
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
    paddingHorizontal: 20, // ✅ same as login
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

export default SignUpScreen;