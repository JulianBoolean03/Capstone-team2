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
    </ScrollView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
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
