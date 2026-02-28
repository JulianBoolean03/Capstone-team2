import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { AvatarColorPicker } from '@/components/color-picker';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/api';
import {
  fetchFriendRequests,
  FriendRequestsPayload,
  logoutDummyUser,
  respondToFriendRequest,
  useDummyAuth,
} from '@/lib/dummy-auth';

export default function ProfileScreen() {
  const router = useRouter();
  const currentUser = useDummyAuth();
  const { token } = useAuth();

  const [friendData, setFriendData] = useState<FriendRequestsPayload>({
    incoming: [],
    outgoing: [],
    friends: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatLoading, setChatLoading] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchFriendRequests();
      setFriendData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load profile data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    logoutDummyUser();
    router.replace('/login');
  };

  const handleRespond = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      await respondToFriendRequest(requestId, action);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update request.');
    }
  };

  const handleOpenChat = async (friendId: string, friendName: string) => {
    try {
      setChatLoading(friendId);
      const data = await apiRequest<{ conversationId: string }>(
        '/conversations',
        { method: 'POST', body: JSON.stringify({ otherUserId: friendId }) },
        token
      );
      setChatLoading(null);
      router.push(`/chat/${data.conversationId}`);
    } catch (err) {
      setChatLoading(null);
      setError(err instanceof Error ? err.message : 'Unable to open chat.');
    }
  };

  const handleAvatarColorChange = async (bgColor: string, textColor: string) => {
    try {
      await apiRequest(
        '/users/avatar',
        { method: 'POST', json: { bgColor, textColor } },
        token
      );
      setShowColorPicker(false);
      // Trigger a UI refresh by refetching user data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update avatar colors.');
    }
  };

  const displayName = currentUser?.fullName ?? 'Guest User';
  const displayEmail = currentUser?.email ?? 'guest@example.com';
  const avatarBgColor = currentUser?.avatarBgColor ?? '#3B5BFF';
  const avatarTextColor = currentUser?.avatarTextColor ?? '#FFFFFF';

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.avatarSection}>
          <Avatar
            name={displayName}
            backgroundColor={avatarBgColor}
            textColor={avatarTextColor}
            size={80}
          />
          <Pressable style={styles.editAvatarBtn} onPress={() => setShowColorPicker(!showColorPicker)}>
            <Text style={styles.editAvatarText}>Edit</Text>
          </Pressable>
        </View>

        {showColorPicker && (
          <AvatarColorPicker
            selectedBg={avatarBgColor}
            selectedText={avatarTextColor}
            onSelect={handleAvatarColorChange}
          />
        )}

        <Text style={styles.headerTitle}>{displayName}</Text>
        <Text style={styles.headerSubtitle}>{displayEmail}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{friendData.friends.length}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{friendData.incoming.length}</Text>
            <Text style={styles.statLabel}>Incoming</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{friendData.outgoing.length}</Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
        </View>
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Incoming Friend Requests</Text>
        {loading && <Text style={styles.infoText}>Loading...</Text>}
        {!loading && !friendData.incoming.length && (
          <Text style={styles.infoText}>No pending incoming requests.</Text>
        )}
        {!loading &&
          friendData.incoming.map((r) => (
            <View key={r.id} style={styles.requestRow}>
              <Avatar
                name={r.sender.fullName}
                backgroundColor={r.sender.avatarBgColor}
                textColor={r.sender.avatarTextColor}
                size={40}
              />
              <View style={styles.requestCopy}>
                <Text style={styles.requestName}>{r.sender.fullName}</Text>
                <Text style={styles.requestEmail}>{r.sender.email}</Text>
              </View>
              <View style={styles.requestActions}>
                <Pressable style={styles.acceptBtn} onPress={() => handleRespond(r.id, 'accept')}>
                  <Text style={styles.acceptText}>Accept</Text>
                </Pressable>
                <Pressable style={styles.declineBtn} onPress={() => handleRespond(r.id, 'decline')}>
                  <Text style={styles.declineText}>Decline</Text>
                </Pressable>
              </View>
            </View>
          ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Friends</Text>
        {!friendData.friends.length && <Text style={styles.infoText}>No friends yet.</Text>}
        {friendData.friends.map((f) => (
          <View key={f.id} style={styles.friendRow}>
            <Avatar
              name={f.fullName}
              backgroundColor={f.avatarBgColor}
              textColor={f.avatarTextColor}
              size={40}
            />
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{f.fullName}</Text>
              <Text style={styles.friendEmail}>{f.email}</Text>
            </View>
            <Pressable
              style={[styles.messageFriendBtn, chatLoading === f.id && styles.messageFriendBtnLoading]}
              onPress={() => handleOpenChat(f.id, f.fullName)}
              disabled={chatLoading === f.id}
            >
              <Text style={styles.messageFriendText}>
                {chatLoading === f.id ? '⏳' : '💬'}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F3F6FF' },
  container: { padding: 16, paddingBottom: 28 },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6EBF7',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  editAvatarBtn: {
    marginTop: 8,
    backgroundColor: '#3B5BFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0B1220', textAlign: 'center' },
  headerSubtitle: { marginTop: 4, color: '#5B6476', textAlign: 'center' },
  statsRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: '#F7F9FF',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  statNum: { fontSize: 18, fontWeight: '800', color: '#2F5CFF' },
  statLabel: { marginTop: 2, color: '#5B6476', fontSize: 12, fontWeight: '600' },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E6EBF7',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0B1220', marginBottom: 10 },
  infoText: { color: '#5B6476' },
  errorText: { color: '#B91C1C', fontWeight: '600', marginBottom: 8 },
  requestRow: {
    borderWidth: 1,
    borderColor: '#EEF1F6',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestCopy: { gap: 3, flex: 1 },
  requestName: { fontWeight: '700', color: '#0B1220' },
  requestEmail: { color: '#5B6476', fontSize: 13 },
  requestActions: { flexDirection: 'row', gap: 6 },
  acceptBtn: {
    backgroundColor: '#E8F7ED',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  acceptText: { color: '#12663A', fontWeight: '700' },
  declineBtn: {
    backgroundColor: '#FFECEC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  declineText: { color: '#B42318', fontWeight: '700' },
  friendRow: {
    borderWidth: 1,
    borderColor: '#EEF1F6',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: { fontWeight: '700', color: '#0B1220' },
  friendEmail: { marginTop: 3, color: '#5B6476', fontSize: 13 },
  messageFriendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageFriendBtnLoading: {
    opacity: 0.6,
  },
  messageFriendText: {
    fontSize: 18,
  },
  logoutBtn: {
    marginTop: 14,
    backgroundColor: '#111827',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logoutText: { color: '#FFFFFF', fontWeight: '700' },
});
