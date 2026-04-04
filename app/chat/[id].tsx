import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  fetchMessages,
  sendMessage,
  fetchConversations,
  Message,
  useDummyAuth,
} from '@/lib/dummy-auth';

const BRAND = '#3B5BFF';
const INK = '#0F172A';
const MUTED = '#94A3B8';
const SURFACE = '#FFFFFF';
const BG = '#F0F4FF';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = name.charCodeAt(0) % 6;
  const colors = ['#3B5BFF', '#7C3AED', '#DB2777', '#059669', '#D97706', '#DC2626'];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors[hue], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

type ListItem =
  | { type: 'date'; label: string; key: string }
  | { type: 'message'; data: Message; key: string };

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useDummyAuth();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatName, setChatName] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    const [msgs, convos] = await Promise.all([fetchMessages(id), fetchConversations()]);
    setMessages(msgs);
    const convo = convos.find((c) => c.id === id);
    if (convo?.otherMembers[0]) setChatName(convo.otherMembers[0].fullName);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 5000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !id) return;
    setSending(true);
    setText('');
    try {
      const message = await sendMessage(id, trimmed);
      setMessages((prev) => [...prev, message]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    } finally {
      setSending(false);
    }
  };

  // Build list with date separators
  const listItems: ListItem[] = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    if (!prev || !isSameDay(prev.createdAt, msg.createdAt)) {
      listItems.push({ type: 'date', label: formatDateLabel(msg.createdAt), key: `date-${msg.id}` });
    }
    listItems.push({ type: 'message', data: msg, key: msg.id });
  });

  const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateSep}>
          <View style={styles.dateLine} />
          <Text style={styles.dateLabel}>{item.label}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    }

    const msg = item.data;
    const isMe = msg.senderId === currentUser?.id;

    // Check if next message is from same sender (for tail)
    const nextItem = listItems[index + 1];
    const nextMsg = nextItem?.type === 'message' ? nextItem.data : null;
    const isLast = !nextMsg || nextMsg.senderId !== msg.senderId;

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
        {/* Avatar for others, only on last in group */}
        {!isMe && (
          <View style={styles.avatarSlot}>
            {isLast ? <Avatar name={msg.sender.fullName} size={30} /> : null}
          </View>
        )}

        <View style={styles.bubbleCol}>
          <View style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleThem,
            isMe
              ? (isLast ? styles.bubbleMeTail : undefined)
              : (isLast ? styles.bubbleThemTail : undefined),
          ]}>
            <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
              {msg.text}
            </Text>
            <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeThem]}>
              {formatTime(msg.createdAt)}
              {isMe && (
                <Text style={styles.tick}> ✓</Text>
              )}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={SURFACE} />
        </Pressable>
        {chatName ? <Avatar name={chatName} size={36} /> : <View style={{ width: 36 }} />}
        <View style={styles.headerMid}>
          <Text style={styles.headerName} numberOfLines={1}>{chatName || '...'}</Text>
          <Text style={styles.headerSub}>Study Stack</Text>
        </View>
        <Pressable style={styles.headerActionBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={SURFACE} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={BRAND} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={listItems}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubble-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor={MUTED}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnOff]}
            onPress={handleSend}
            disabled={!text.trim() || sending}>
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={17} color="#fff" />
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },

  header: {
    backgroundColor: BRAND,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerMid: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: '700', color: SURFACE },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  headerActionBtn: { padding: 4 },

  listContent: { paddingHorizontal: 10, paddingVertical: 12, gap: 2 },

  dateSep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 8,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: '#DDE4F0' },
  dateLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '600',
    backgroundColor: BG,
    paddingHorizontal: 6,
  },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 1 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },
  avatarSlot: { width: 34, marginRight: 4 },

  bubbleCol: { maxWidth: '75%' },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  bubbleMe: { backgroundColor: BRAND },
  bubbleThem: { backgroundColor: SURFACE },
  bubbleMeTail: { borderBottomRightRadius: 4 },
  bubbleThemTail: { borderBottomLeftRadius: 4 },

  bubbleText: { fontSize: 14.5, lineHeight: 21 },
  bubbleTextMe: { color: SURFACE },
  bubbleTextThem: { color: INK },

  msgTime: { fontSize: 10, marginTop: 3 },
  msgTimeMe: { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  msgTimeThem: { color: MUTED },
  tick: { color: 'rgba(255,255,255,0.65)' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
  emptyText: { color: MUTED, fontSize: 14 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: SURFACE,
    borderTopWidth: 1,
    borderTopColor: '#E8EDF5',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14.5,
    color: INK,
    maxHeight: 110,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: '#CBD5E1' },
});
