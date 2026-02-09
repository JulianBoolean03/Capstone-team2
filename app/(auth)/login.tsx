import { useMemo, useState } from 'react';
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

const ACCENT = '#3B5BFF';
const SURFACE = '#FFFFFF';
const INK = '#101126';
const MUTED = '#6B7280';
const BORDER = '#E6E8F0';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isSignup = mode === 'signup';

  const primaryLabel = useMemo(() => (isSignup ? 'Sign Up' : 'Login'), [isSignup]);

  const handlePrimary = () => {
    // TODO: wire to backend auth
    if (isSignup) {
      void fullName;
      void confirmPassword;
      router.push('/quiz');
      return;
    }
    void email;
    void password;
    router.push('/(tabs)');
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
              onPress={() => setMode('login')}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === 'login' && styles.segmentTextActive,
                ]}
              >
                Login
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentItem, mode === 'signup' && styles.segmentActive]}
              onPress={() => setMode('signup')}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === 'signup' && styles.segmentTextActive,
                ]}
              >
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
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    fontSize: 13,
    color: INK,
    backgroundColor: '#F9FAFB',
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: '#0B0F26',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
