import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

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

  const [friendData, setFriendData] = useState<FriendRequestsPayload>({
    incoming: [],
    outgoing: [],
    friends: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const displayName = currentUser?.fullName ?? 'Guest User';
  const displayEmail = currentUser?.email ?? 'guest@example.com';

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
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
            <Text style={styles.friendName}>{f.fullName}</Text>
            <Text style={styles.friendEmail}>{f.email}</Text>
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0B1220' },
  headerSubtitle: { marginTop: 4, color: '#5B6476' },
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
  },
  requestCopy: { gap: 3 },
  requestName: { fontWeight: '700', color: '#0B1220' },
  requestEmail: { color: '#5B6476' },
  requestActions: { flexDirection: 'row', gap: 8 },
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
  },
  friendName: { fontWeight: '700', color: '#0B1220' },
  friendEmail: { marginTop: 3, color: '#5B6476' },
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
