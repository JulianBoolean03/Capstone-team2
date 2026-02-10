import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { profileStyles as s } from "../../styles/profileStyles";

export default function ProfileScreen() {
  // Mock data for now (later this becomes real user data)
  const user = {
    name: "John Doe",
    major: "Computer Science",
    year: "Junior",
    school: "Georgia State University",
    location: "Atlanta, GA",
    stats: { sessions: 24, connections: 18, groups: 5 },
    about:
      "CS major passionate about AI and machine learning. Always looking for study partners and collaborative learning opportunities!",
    courses: ["CS 229", "CS 161", "MATH 220", "PHYS 150"],
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 28 }}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>Profile</Text>

          <Pressable onPress={() => console.log("Edit profile pressed")}>
            <Text style={{ color: "white", fontWeight: "800" }}>Edit</Text>
          </Pressable>
        </View>
      </View>

      {/* Main Card */}
      <View style={s.card}>
        <View style={s.avatarWrap}>
          <Image
            source={{
              uri: "https://i.pravatar.cc/200?img=12",
            }}
            style={s.avatar}
          />
        </View>

        <Text style={s.name}>{user.name}</Text>
        <Text style={s.subtitle}>
          {user.major} • {user.year}
        </Text>

        <View style={s.metaRow}>
          <View style={s.metaChip}>
            <Text style={s.metaText}>{user.school}</Text>
          </View>
          <View style={s.metaChip}>
            <Text style={s.metaText}>{user.location}</Text>
          </View>
        </View>

        <View style={s.statsRow}>
          <View>
            <Text style={s.statNum}>{user.stats.sessions}</Text>
            <Text style={s.statLabel}>Study Sessions</Text>
          </View>
          <View>
            <Text style={s.statNum}>{user.stats.connections}</Text>
            <Text style={s.statLabel}>Connections</Text>
          </View>
          <View>
            <Text style={s.statNum}>{user.stats.groups}</Text>
            <Text style={s.statLabel}>Groups</Text>
          </View>
        </View>
      </View>

      {/* About */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>About</Text>
        <Text style={s.aboutText}>{user.about}</Text>
      </View>

      {/* Current Courses */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Current Courses</Text>
        <View style={s.tagsRow}>
          {user.courses.map((c) => (
            <View key={c} style={s.tag}>
              <Text style={s.tagText}>{c}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
