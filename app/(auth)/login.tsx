import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { loginDummyUser, signUpDummyUser, useDummyAuth } from '@/lib/dummy-auth';

const ACCENT = '#3B5BFF';
const SURFACE = '#FFFFFF';
const INK = '#101126';
const MUTED = '#6B7280';

export default function AuthScreen() {
  const router = useRouter();
  const currentUser = useDummyAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('student@university.edu');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isSignup = mode === 'signup';

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (currentUser.quizCompleted) {
      router.replace('/(tabs)');
      return;
    }

    router.replace('/quiz');
  }, [currentUser, router]);

  const primaryLabel = useMemo(() => (isSignup ? 'Create Account' : 'Login'), [isSignup]);

  const handlePrimary = () => {
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    if (isSignup) {
      if (!fullName.trim()) {
        setErrorMessage('Full name is required for sign up.');
        return;
      }

      if (password.length < 6) {
        setErrorMessage('Use a password with at least 6 characters.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      const result = signUpDummyUser({ fullName, email, password });
      if (!result.ok) {
        setErrorMessage(result.error ?? 'Unable to create account.');
        return;
      }

      router.replace('/quiz');
      return;
    }

    const result = loginDummyUser({ email, password });
    if (!result.ok || !result.user) {
      setErrorMessage(result.error ?? 'Unable to login.');
      return;
    }

    if (result.user.quizCompleted) {
      router.replace('/(tabs)');
      return;
    }

    router.replace('/quiz');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.background}>
          <View style={styles.glowLeft} />
          <View style={styles.glowRight} />
        </View>

        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Ionicons name="school" size={20} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>Study Stack</Text>
          <Text style={styles.subtitle}>
            Connect with study partners, collaborate, and succeed together
          </Text>

          <View style={styles.segment}>
            <Pressable
              style={[styles.segmentItem, mode === 'login' && styles.segmentActive]}
              onPress={() => {
                setMode('login');
                setErrorMessage('');
              }}
            >
              <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>
                Login
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentItem, mode === 'signup' && styles.segmentActive]}
              onPress={() => {
                setMode('signup');
                setErrorMessage('');
              }}
            >
              <Text style={[styles.segmentText, mode === 'signup' && styles.segmentTextActive]}>
                Sign Up
              </Text>
            </Pressable>
          </View>

          {isSignup && (
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={MUTED}
                autoCapitalize="words"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          )}

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="student@university.edu"
              placeholderTextColor={MUTED}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={MUTED}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {isSignup && (
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={MUTED}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          )}

          {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          {!isSignup && (
            <Text style={styles.hintText}>
              Dummy login: student@university.edu / password123
            </Text>
          )}

          <Pressable style={styles.primaryButton} onPress={handlePrimary}>
            <Text style={styles.primaryText}>{primaryLabel}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glowLeft: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#C7D2FE',
    opacity: 0.4,
    top: -60,
    left: -80,
  },
  glowRight: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#E0E7FF',
    opacity: 0.6,
    bottom: -60,
    right: -80,
  },
  card: {
    alignSelf: 'center',
    marginTop: 120,
    width: '86%',
    maxWidth: 380,
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    shadowColor: '#1F2A55',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  iconBadge: {
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: INK,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 12.5,
    color: MUTED,
    marginTop: 6,
    marginBottom: 18,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    padding: 3,
    marginBottom: 18,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1F2A55',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },
  segmentTextActive: {
    color: INK,
  },
  fieldBlock: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: INK,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#EDF0F7',
    backgroundColor: '#F9FAFC',
    borderRadius: 9,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 12.5,
    color: INK,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 11,
    color: MUTED,
    marginBottom: 10,
  },
  primaryButton: {
    marginTop: 4,
    height: 42,
    borderRadius: 9,
    backgroundColor: '#020426',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
