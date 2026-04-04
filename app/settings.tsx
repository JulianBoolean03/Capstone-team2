import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { logoutDummyUser } from '@/lib/dummy-auth';

const BRAND = '#3B5BFF';
const INK = '#111827';
const MUTED = '#6B7280';
const BG = '#F3F4F6';
const SURFACE = '#FFFFFF';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [locationSharing, setLocationSharing] = React.useState(true);

  const handleLogout = () => {
    logoutDummyUser();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={SURFACE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* ACCOUNT */}
        <Section title="ACCOUNT">
          <Row icon="person-outline" title="Edit Profile" subtitle="Update your information" onPress={() => {}} />
          <Divider />
          <Row icon="lock-closed-outline" title="Privacy & Security" subtitle="Control your privacy" onPress={() => {}} />
          <Divider />
          <Row icon="school-outline" title="Retake Quiz" subtitle="Update your study preferences" onPress={() => router.replace('/(auth)/quiz')} />
        </Section>

        {/* PREFERENCES */}
        <Section title="PREFERENCES">
          <ToggleRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="Message & match alerts"
            value={notifications}
            onValueChange={setNotifications}
          />
          <Divider />
          <ToggleRow
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Change app appearance"
            value={darkMode}
            onValueChange={setDarkMode}
          />
          <Divider />
          <ToggleRow
            icon="location-outline"
            title="Location Sharing"
            subtitle="Find nearby study partners"
            value={locationSharing}
            onValueChange={setLocationSharing}
          />
        </Section>

        {/* SUPPORT */}
        <Section title="SUPPORT">
          <Row icon="help-circle-outline" title="Help Center" subtitle="FAQs and support" onPress={() => {}} />
          <Divider />
          <Row icon="information-circle-outline" title="About" subtitle="Version 1.0.0" onPress={() => {}} />
        </Section>

        {/* Logout */}
        <TouchableOpacity activeOpacity={0.85} style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Study Stack © 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={BRAND} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#C4CDD5" />
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={BRAND} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: '#BFCBFF' }}
        thumbColor={value ? BRAND : '#9CA3AF'}
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND },
  scroll: { flex: 1, backgroundColor: BG },
  content: { paddingBottom: 32 },

  header: {
    backgroundColor: BRAND,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: SURFACE },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDEFF4',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTitle: { fontSize: 14.5, fontWeight: '600', color: INK },
  rowSubtitle: { fontSize: 12, color: MUTED, marginTop: 2 },

  divider: { height: 1, backgroundColor: '#F0F2F5', marginLeft: 62 },

  logoutBtn: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: '#E11D48',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  footer: { marginTop: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 12 },
});
