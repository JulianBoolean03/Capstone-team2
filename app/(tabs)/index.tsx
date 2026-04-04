import { useCallback, useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { fetchConversations, Conversation, useDummyAuth } from '@/lib/dummy-auth';

const BRAND = '#3B5BFF';
const BRAND_DARK = '#2A46E5';
const INK = '#0F172A';
const MUTED = '#6B7280';
const LINE = '#EEF2F7';
const SURFACE = '#FFFFFF';

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function InitialsAvatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

export default function ChatsScreen() {
  const router = useRouter();
  const currentUser = useDummyAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchConversations();
      setConversations(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
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
    const isUnread = item.lastMessage?.senderId !== currentUser?.id && !!item.lastMessage;

    return (
      <Pressable style={styles.row} onPress={() => router.push(`/chat/${item.id}`)}>
        <InitialsAvatar name={name} />
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={[styles.name, isUnread && styles.nameUnread]}>{name}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <View style={styles.rowBottom}>
            <Text style={[styles.message, isUnread && styles.messageUnread]} numberOfLines={1}>
              {lastMsg}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
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
          <Pressable style={styles.iconBtn} onPress={load}>
            <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            placeholder="Search conversations..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={load}
        refreshing={loading}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubble-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>
                Find study partners in Discover and start a chat.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SURFACE },
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  iconBtn: {
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
  searchInput: { flex: 1, fontSize: 13, color: INK },
  listContent: { paddingTop: 10 },
  emptyContainer: { flex: 1 },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: SURFACE,
  },
  avatar: {
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  rowContent: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { fontSize: 14, fontWeight: '600', color: INK },
  nameUnread: { fontWeight: '800' },
  time: { fontSize: 11, color: '#94A3B8' },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  message: { fontSize: 12.5, color: MUTED, flex: 1 },
  messageUnread: { color: INK, fontWeight: '600' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND,
    marginLeft: 6,
  },
  separator: { height: 1, backgroundColor: LINE, marginLeft: 74 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: INK },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', paddingHorizontal: 32 },
});
