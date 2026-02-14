import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const TAGS = ["CS 229", "CS 161", "Math 220", "Physics 150"];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>

          <Pressable style={styles.editBtn} onPress={() => {}}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: "https://i.pravatar.cc/200?img=12" }}
              style={styles.avatar}
            />
          </View>

          <Text style={styles.name}>John Doe</Text>
          <Text style={styles.subtitle}>Computer Science • Junior</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>🏫 Georgia State University</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaItem}>📍 Atlanta, GA</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>24</Text>
              <Text style={styles.statLabel}>Study Sessions</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>18</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>5</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </View>
          </View>

          <Text style={styles.memberSince}>📅 Member since September 2024</Text>
        </View>
      </View>

      {/* About */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.sectionBody}>
          CS major, passionate about learning and collaborating. Looking for study partners for
          algorithms, networking, and math.
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

/* Small helper component for the stats row */
function Stat({ number, label }: { number: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Image
          source={{ uri: "https://i.pravatar.cc/150" }}
          style={styles.avatar}
        />

        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.subtitle}>Computer Science • Junior</Text>

        <Text style={styles.meta}>🎓 Stanford University</Text>
        <Text style={styles.meta}>📍 Palo Alto, CA</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Stat number="24" label="Study Sessions" />
          <Stat number="18" label="Connections" />
          <Stat number="5" label="Groups" />
        </View>

        <Text style={styles.memberSince}>
          📅 Member since September 2024
        </Text>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.sectionText}>
          CS major passionate about AI and machine learning. Always looking for
          study partners and collaborative learning opportunities!
        </Text>
      </View>

      {/* Current Courses */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Current Courses</Text>

        <View style={styles.tagsWrap}>
          {TAGS.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Courses</Text>
        <View style={styles.chips}>
          {["CS 229", "CS 161", "Math 220", "Physics 150"].map(course => (
            <View key={course} style={styles.chip}>
              <Text style={styles.chipText}>{course}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <Pressable style={styles.actionBtn} onPress={() => {}}>
          <Text style={styles.actionText}>Account Settings</Text>
          <Text style={styles.actionArrow}>›</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={() => {}}>
          <Text style={styles.actionText}>Privacy</Text>
          <Text style={styles.actionArrow}>›</Text>
        </Pressable>

        <Pressable style={[styles.actionBtn, styles.logoutBtn]} onPress={() => {}}>
          <Text style={[styles.actionText, styles.logoutText]}>Log Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F3F6FF" },
  container: { padding: 16, paddingBottom: 28 },

  header: { marginBottom: 14 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#0B1220" },
  editBtn: {
    backgroundColor: "#E9EEFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editText: { fontWeight: "700", color: "#365CFF" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#E9EEFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatar: { width: 76, height: 76, borderRadius: 38 },

  name: { fontSize: 20, fontWeight: "800", color: "#0B1220" },
  subtitle: { marginTop: 4, color: "#5B6476", fontWeight: "600" },

  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  metaItem: { color: "#5B6476", fontWeight: "600" },
  metaDot: { marginHorizontal: 8, color: "#9AA3B2" },

  statsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#EEF1F6",
  },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 18, fontWeight: "900", color: "#365CFF" },
  statLabel: { marginTop: 4, fontSize: 12, color: "#5B6476", fontWeight: "600" },

  memberSince: { marginTop: 12, color: "#5B6476", fontWeight: "600" },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0B1220" },
  sectionBody: { marginTop: 8, color: "#5B6476", fontWeight: "600", lineHeight: 20 },

  tagsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, gap: 8 },
  tag: {
    backgroundColor: "#EEF1FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: { color: "#365CFF", fontWeight: "800", fontSize: 12 },

  actionBtn: {
    marginTop: 10,
    backgroundColor: "#F6F7FB",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionText: { fontWeight: "700", color: "#0B1220" },
  actionArrow: { fontSize: 20, color: "#9AA3B2", fontWeight: "900" },

  logoutBtn: { backgroundColor: "#FFECEC" },
  logoutText: { color: "#C62828" },
  container: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },

  /* Header */
  header: {
    height: 120,
    backgroundColor: "#4F5DFF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
  },
  subtitle: {
    color: "#666",
    marginVertical: 4,
  },
  meta: {
    color: "#444",
    marginTop: 2,
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "100%",
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4F5DFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  memberSince: {
    marginTop: 16,
    color: "#666",
    fontSize: 12,
  },

  /* Sections */
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionText: {
    color: "#555",
    lineHeight: 20,
  },

  /* Course Chips */
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  chip: {
    backgroundColor: "#EEF1FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: "#4F5DFF",
    fontSize: 12,
  },
});
