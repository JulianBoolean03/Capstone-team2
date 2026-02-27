import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function Settings() {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [locationSharing, setLocationSharing] = React.useState(true);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={22} color="#111" />
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* ACCOUNT */}
      <Section title="ACCOUNT">
        <Row icon="shield-outline" title="Edit Profile" subtitle="Update your information" />
        <Divider />
        <Row icon="lock-closed-outline" title="Privacy & Security" subtitle="Control your privacy" />
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
        <Row icon="help-circle-outline" title="Help Center" subtitle="FAQs and support" />
        <Divider />
        <Row icon="information-circle-outline" title="About" subtitle="Version 1.0.0" />
      </Section>

      {/* Logout */}
      <TouchableOpacity activeOpacity={0.9} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Study Stack © 2026</Text>
    </ScrollView>
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color="#3B82F6" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#9aa0a6" />
    </View>
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
        <Ionicons name={icon} size={18} color="#3B82F6" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },

  section: {
    paddingHorizontal: 16,
    marginTop: 14,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    letterSpacing: 0.6,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  rowSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginLeft: 62,
  },

  logoutBtn: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: "#E11D48",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  footer: {
    marginTop: 14,
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
  },
});