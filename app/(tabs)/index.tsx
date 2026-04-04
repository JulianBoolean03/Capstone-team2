import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { fetchConversations, Conversation, useDummyAuth } from '@/lib/dummy-auth';

const BRAND = '#3B5BFF';
const INK = '#0F172A';
const MUTED = '#6B7280';
const LINE = '#F1F5F9';
const SURFACE = '#FFFFFF';
const BG = '#F8F9FF';

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function Avatar({ name, size = 46 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const hue = name.charCodeAt(0) % 6;
  const colors = ['#3B5BFF', '#7C3AED', '#DB2777', '#059669', '#D97706', '#DC2626'];
  const bg = colors[hue];

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

export default function ChatsScreen() {
  const router = useRouter();
  const currentUser = useDummyAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchConversations();
      setConversations(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 8000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = conversations.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return c.otherMembers.some((m) => m.fullName.toLowerCase().includes(q));
  });

  const renderItem = ({ item }: { item: Conversation }) => {
    const other = item.otherMembers[0];
    const name = other?.fullName ?? 'Unknown';
    const lastMsg = item.lastMessage?.text ?? 'No messages yet';
    const time = item.lastMessage?.createdAt
      ? formatTime(item.lastMessage.createdAt)
      : formatTime(item.createdAt);
    const isUnread =
      !!item.lastMessage && item.lastMessage.senderId !== currentUser?.id;

    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => router.push(`/chat/${item.id}`)}>
        <Avatar name={name} />
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={[styles.name, isUnread && styles.nameBold]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.time, isUnread && styles.timeUnread]}>{time}</Text>
          </View>
          <View style={styles.rowBottom}>
            <Text
              style={[styles.preview, isUnread && styles.previewBold]}
              numberOfLines={1}>
              {lastMsg}
            </Text>
            {isUnread && <View style={styles.badge} />}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandIcon}>
            <Ionicons name="chatbubble-ellipses" size={15} color="#fff" />
          </View>
          <Text style={styles.brandName}>Study Stack</Text>
        </View>
        <Pressable onPress={() => load()} style={styles.headerIconBtn}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={15} color={MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={MUTED} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={BRAND} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={filtered.length === 0 ? styles.emptyWrap : styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubble-outline" size={32} color={BRAND} />
              </View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>
                Head to Discover to find study partners and start chatting.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    backgroundColor: BRAND,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: BRAND },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: SURFACE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: INK },
  list: { paddingTop: 6, paddingBottom: 16 },
  emptyWrap: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: SURFACE,
  },
  rowPressed: { backgroundColor: '#F0F4FF' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  name: { fontSize: 14.5, fontWeight: '500', color: INK, flex: 1, marginRight: 8 },
  nameBold: { fontWeight: '700' },
  time: { fontSize: 11.5, color: MUTED },
  timeUnread: { color: BRAND, fontWeight: '600' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preview: { fontSize: 13, color: MUTED, flex: 1 },
  previewBold: { color: INK, fontWeight: '500' },
  badge: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND, marginLeft: 8 },
  sep: { height: 1, backgroundColor: LINE, marginLeft: 74 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10, paddingHorizontal: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: INK },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20 },
});
