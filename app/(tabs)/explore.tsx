import React, { useMemo, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type StudentCard = {
  id: string;
  name: string;
  major: string;
  year: string;
  location: string;
  matchPct: number;
  bio: string;
  courses: string[];
  availability: string[];
  preferences: string[];
  avatarUrl: string;
};

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState<"Students" | "Groups">("Students");
  const [query, setQuery] = useState("");

  const students: StudentCard[] = useMemo(
    () => [
      {
        id: "emma",
        name: "Emma Wilson",
        major: "Computer Science",
        year: "Junior",
        location: "Palo Alto, CA",
        matchPct: 95,
        bio:
          "Looking for study partners for machine learning. Love collaborative problem solving!",
        courses: ["CS 229", "CS 161", "Math 220"],
        availability: ["Evening", "Library"],
        preferences: ["One-on-One"],
        avatarUrl: "https://i.pravatar.cc/150?img=32",
      },
      {
        id: "liam",
        name: "Liam Thompson",
        major: "Mathematics",
        year: "Sophomore",
        location: "Palo Alto, CA",
        matchPct: 88,
        bio: "Math enthusiast seeking partners for problem sets and exam prep.",
        courses: ["Math 220", "CS 103", "Physics 150"],
        availability: ["Afternoon"],
        preferences: ["Coffee Shop", "Group Study"],
        avatarUrl: "https://i.pravatar.cc/150?img=12",
      },
    ],
    []
  );

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;

    return students.filter((s) => {
      const haystack = [
        s.name,
        s.major,
        s.year,
        s.location,
        s.bio,
        ...s.courses,
        ...s.availability,
        ...s.preferences,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [query, students]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => {}}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Discover</Text>

          <View style={{ width: 44 }} />
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentWrap}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === "Students" && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab("Students")}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === "Students" && styles.segmentTextActive,
              ]}
            >
              Students
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === "Groups" && styles.segmentBtnActiveLight,
            ]}
            onPress={() => setActiveTab("Groups")}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === "Groups" && styles.segmentTextDark,
              ]}
            >
              Groups
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={
              activeTab === "Students" ? "Search students..." : "Search groups..."
            }
            placeholderTextColor="#9AA3B2"
            style={styles.searchInput}
          />
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "Students" ? (
            filteredStudents.map((s) => (
              <View key={s.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <Image source={{ uri: s.avatarUrl }} style={styles.avatar} />

                  <View style={styles.cardTopText}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{s.name}</Text>

                      <View style={styles.matchPill}>
                        <Text style={styles.matchPillText}>
                          {s.matchPct}% Match
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.subtitle}>
                      {s.major} • {s.year}
                    </Text>

                    <View style={styles.locationRow}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.locationText}>{s.location}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.bio}>{s.bio}</Text>

                {/* Tags rows */}
                <View style={styles.tagRow}>
                  {s.courses.map((t) => (
                    <View key={`${s.id}-c-${t}`} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.tagRow}>
                  {s.availability.map((t) => (
                    <View key={`${s.id}-a-${t}`} style={styles.tagSoft}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                  {s.preferences.map((t) => (
                    <View key={`${s.id}-p-${t}`} style={styles.tagSoft}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.messageBtn} onPress={() => {}}>
                  <Text style={styles.messageBtnText}>💬  Send Message</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Groups (coming soon)</Text>
              <Text style={styles.emptyText}>
                For SCRUM-21 we can focus on matching the Students UI first. If
                your Jira wants Groups too, tell me and we’ll build that next.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, paddingHorizontal: 16 },

  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 18, color: "#111827" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },

  segmentWrap: {
    marginTop: 6,
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 6,
  },
  segmentBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#0B1020",
  },
  segmentBtnActiveLight: {
    backgroundColor: "#FFFFFF",
  },
  segmentText: { fontSize: 15, fontWeight: "600" },
  segmentTextActive: { color: "#FFFFFF" },
  segmentTextDark: { color: "#111827" },

  searchWrap: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: { marginRight: 8, fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: "#111827" },

  scrollContent: { paddingBottom: 24, paddingTop: 12 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
  },
  cardTopRow: { flexDirection: "row" },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  cardTopText: { flex: 1 },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  name: { fontSize: 18, fontWeight: "800", color: "#111827", flex: 1 },

  matchPill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  matchPillText: { fontSize: 12, fontWeight: "700", color: "#111827" },

  subtitle: { marginTop: 2, fontSize: 13, color: "#374151", fontWeight: "600" },

  locationRow: { marginTop: 4, flexDirection: "row", alignItems: "center" },
  locationIcon: { marginRight: 6, fontSize: 13 },
  locationText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },

  bio: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
    fontWeight: "500",
  },

  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  tag: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tagSoft: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tagText: { fontSize: 12, fontWeight: "700", color: "#111827" },

  messageBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#0B1020",
    alignItems: "center",
    justifyContent: "center",
  },
  messageBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },

  emptyState: {
    marginTop: 40,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  emptyText: { marginTop: 6, fontSize: 13, color: "#374151", lineHeight: 18 },
});
