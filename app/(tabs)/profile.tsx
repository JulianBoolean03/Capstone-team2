import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  fetchFriendRequests,
  FriendRequestsPayload,
  respondToFriendRequest,
  useDummyAuth,
} from '@/lib/dummy-auth';

const BRAND = '#3B5BFF';
const INK = '#0B1220';
const MUTED = '#5B6476';
const BG = '#F3F6FF';
const SURFACE = '#FFFFFF';

function Avatar({ name, size = 72 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = name.charCodeAt(0) % 6;
  const colors = ['#3B5BFF', '#7C3AED', '#DB2777', '#059669', '#D97706', '#DC2626'];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors[hue], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

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
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={20} color={SURFACE} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ backgroundColor: BG }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar name={displayName} size={72} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{friendData.friends.length}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{friendData.incoming.length}</Text>
              <Text style={styles.statLabel}>Requests</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{friendData.outgoing.length}</Text>
              <Text style={styles.statLabel}>Sent</Text>
            </View>
          </View>
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {/* Incoming requests */}
        {(friendData.incoming.length > 0 || loading) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FRIEND REQUESTS</Text>
            <View style={styles.card}>
              {loading && <Text style={styles.infoText}>Loading...</Text>}
              {!loading && friendData.incoming.map((r, i) => (
                <View key={r.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.requestRow}>
                    <Avatar name={r.sender.fullName} size={40} />
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestName}>{r.sender.fullName}</Text>
                      <Text style={styles.requestEmail}>{r.sender.email}</Text>
                    </View>
                    <View style={styles.requestActions}>
                      <Pressable style={styles.acceptBtn} onPress={() => handleRespond(r.id, 'accept')}>
                        <Text style={styles.acceptText}>Accept</Text>
                      </Pressable>
                      <Pressable style={styles.declineBtn} onPress={() => handleRespond(r.id, 'decline')}>
                        <Ionicons name="close" size={16} color="#B42318" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Friends list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FRIENDS</Text>
          <View style={styles.card}>
            {!loading && !friendData.friends.length && (
              <Text style={styles.infoText}>No friends yet. Discover study partners!</Text>
            )}
            {friendData.friends.map((f, i) => (
              <View key={f.id}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.friendRow}>
                  <Avatar name={f.fullName} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>{f.fullName}</Text>
                    <Text style={styles.friendEmail}>{f.email}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: SURFACE },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  container: { flexGrow: 1, padding: 16, paddingBottom: 32, backgroundColor: BG },

  profileCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E6EBF7',
    marginBottom: 4,
  },
  profileInfo: { alignItems: 'center', gap: 3 },
  profileName: { fontSize: 20, fontWeight: '800', color: INK },
  profileEmail: { fontSize: 13, color: MUTED },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: '#F7F9FF',
    borderRadius: 14,
    padding: 12,
    width: '100%',
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: BRAND },
  statLabel: { fontSize: 11, color: MUTED, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E6EBF7' },

  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6EBF7',
  },
  divider: { height: 1, backgroundColor: '#F0F2F8', marginLeft: 60 },
  infoText: { color: MUTED, padding: 14, fontSize: 13 },
  errorText: { color: '#B91C1C', fontWeight: '600', marginBottom: 8, marginTop: 4 },

  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  requestInfo: { flex: 1 },
  requestName: { fontWeight: '700', color: INK, fontSize: 14 },
  requestEmail: { color: MUTED, fontSize: 12, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  acceptBtn: {
    backgroundColor: '#E8F7ED',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  acceptText: { color: '#12663A', fontWeight: '700', fontSize: 13 },
  declineBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  friendName: { fontWeight: '700', color: INK, fontSize: 14 },
  friendEmail: { color: MUTED, fontSize: 12, marginTop: 2 },
});
