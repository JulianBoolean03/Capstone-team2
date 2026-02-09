import { useMemo } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BRAND = '#3B5BFF';
const BRAND_DARK = '#2A46E5';
const INK = '#0F172A';
const MUTED = '#6B7280';
const LINE = '#EEF2F7';
const SURFACE = '#FFFFFF';

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&w=96&h=96&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&w=96&h=96&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=96&h=96&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=96&h=96&q=80',
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=96&h=96&q=80',
];

const CONVERSATIONS = [
  {
    id: 'c1',
    name: 'Sarah Chen',
    meta: 'CS 101',
    message: 'See you at the library tomorrow!',
    time: '2:45 PM',
    unread: 2,
  },
  {
    id: 'c2',
    name: 'Computer Science Study Group',
    meta: 'CS 201',
    message: 'Anyone want to review algorithms?',
    time: '1:30 PM',
    unread: 6,
  },
  {
    id: 'c3',
    name: 'Alex Rivera',
    meta: 'Math 220',
    message: 'Thanks for the notes!',
    time: 'Yesterday',
    unread: 0,
  },
  {
    id: 'c4',
    name: 'Physics Lab Partners',
    meta: 'Physics 150',
    message: 'Email lab report due Friday',
    time: 'Yesterday',
    unread: 0,
  },
  {
    id: 'c5',
    name: 'Maya Patel',
    meta: 'Biology 101',
    message: 'Did you understand today\'s lecture?',
    time: 'Monday',
    unread: 0,
  },
];

type Conversation = (typeof CONVERSATIONS)[number];

export default function HomeScreen() {
  const data = useMemo(() => {
    return CONVERSATIONS.map((item, index) => ({
      ...item,
      avatar: AVATARS[index % AVATARS.length],
    }));
  }, []);

  const renderItem = ({ item }: { item: Conversation & { avatar: string } }) => {
    return (
      <Pressable style={styles.row} onPress={() => null}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <View style={styles.rowMeta}>
            <Text style={styles.meta}>{item.meta}</Text>
            {item.unread > 0 && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message} numberOfLines={1}>
            {item.message}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>Study Stack</Text>
          </View>
          <Pressable style={styles.settings} onPress={() => null}>
            <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            placeholder="Search chats or courses..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 16 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  header: {
    backgroundColor: BRAND,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: BRAND_DARK,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  settings: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: INK,
  },
  listContent: {
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: SURFACE,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  rowContent: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  time: {
    fontSize: 11,
    color: '#94A3B8',
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  meta: {
    fontSize: 11,
    color: BRAND_DARK,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND,
  },
  message: {
    fontSize: 12.5,
    color: MUTED,
    marginTop: 3,
  },
  separator: {
    height: 1,
    backgroundColor: LINE,
    marginLeft: 74,
  },
});
