import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  fetchRecommendations,
  RecommendationCard,
  sendFriendRequest,
  createConversation,
} from '@/lib/dummy-auth';

import { useRouter } from 'expo-router';

type GroupTab = 'Students' | 'Groups';

export default function ExploreScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<GroupTab>('Students');
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<RecommendationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchRecommendations();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load recommendations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;

    return students.filter((s) => {
      const haystack = [s.fullName, s.email, `${s.matchPct}%`].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [query, students]);

  const handleAddFriend = async (receiverId: string) => {
    try {
      await sendFriendRequest(receiverId);
      await loadRecommendations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send request.');
    }
  };

  const handleMessage = async (userId: string) => {
    try {
      const conversationId = await createConversation(userId);
      router.push(`/chat/${conversationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open chat.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.backBtn} />
          <Text style={styles.headerTitle}>Discover</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadRecommendations}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.segmentWrap}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'Students' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('Students')}>
            <Text style={[styles.segmentText, activeTab === 'Students' && styles.segmentTextActive]}>
              Students
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'Groups' && styles.segmentBtnActiveLight]}
            onPress={() => setActiveTab('Groups')}>
            <Text style={[styles.segmentText, activeTab === 'Groups' && styles.segmentTextDark]}>
              Groups
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={activeTab === 'Students' ? 'Search students...' : 'Search groups...'}
            placeholderTextColor="#9AA3B2"
            style={styles.searchInput}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'Students' ? (
            <>
              {loading && <Text style={styles.infoText}>Loading recommendations...</Text>}
              {!!error && <Text style={styles.errorText}>{error}</Text>}
              {!loading && !filteredStudents.length && (
                <Text style={styles.infoText}>No recommendations yet. Ask more users to complete the quiz.</Text>
              )}

              {!loading &&
                filteredStudents.map((s) => (
                  <View key={s.id} style={styles.card}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{s.fullName}</Text>
                      <View style={styles.matchPill}>
                        <Text style={styles.matchPillText}>{s.matchPct}% Match</Text>
                      </View>
                    </View>

                    <Text style={styles.subtitle}>{s.email}</Text>

                    {s.relation === 'none' && (
                      <TouchableOpacity style={styles.messageBtn} onPress={() => handleAddFriend(s.id)}>
                        <Text style={styles.messageBtnText}>+ Add Friend</Text>
                      </TouchableOpacity>
                    )}
                    {s.relation === 'request_sent' && (
                      <View style={[styles.messageBtn, styles.messageBtnMuted]}>
                        <Text style={[styles.messageBtnText, styles.messageBtnTextMuted]}>Request Sent</Text>
                      </View>
                    )}
                    {s.relation === 'request_received' && (
                      <View style={[styles.messageBtn, styles.messageBtnMuted]}>
                        <Text style={[styles.messageBtnText, styles.messageBtnTextMuted]}>Sent You a Request</Text>
                      </View>
                    )}
                    {s.relation === 'friends' && (
                      <View style={styles.friendRow}>
                        <View style={[styles.messageBtn, styles.messageBtnSuccess, { flex: 1 }]}>
                          <Text style={styles.messageBtnText}>Friends ✓</Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.messageBtn, { flex: 1, backgroundColor: '#3B5BFF' }]}
                          onPress={() => handleMessage(s.id)}>
                          <Text style={styles.messageBtnText}>💬 Message</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Groups (coming soon)</Text>
              <Text style={styles.emptyText}>Student matching is now implemented with quiz-based scoring.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 44 },
  refreshBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: { fontSize: 18, color: '#111827' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  segmentWrap: {
    marginTop: 6,
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 6,
  },
  segmentBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: { backgroundColor: '#2E5BFF' },
  segmentBtnActiveLight: { backgroundColor: '#FFFFFF' },
  segmentText: { fontWeight: '700', color: '#5B6476' },
  segmentTextActive: { color: '#FFFFFF' },
  segmentTextDark: { color: '#111827' },
  searchWrap: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#111827' },
  scrollContent: { paddingTop: 12, paddingBottom: 22 },
  infoText: { color: '#4B5563', marginBottom: 12 },
  errorText: { color: '#B91C1C', marginBottom: 12, fontWeight: '600' },
  card: {
    backgroundColor: '#F8FAFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5EAF8',
    padding: 14,
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: { fontSize: 16, fontWeight: '800', color: '#111827', flex: 1 },
  subtitle: { marginTop: 4, color: '#5B6476' },
  matchPill: {
    backgroundColor: '#E8EEFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  matchPillText: { color: '#2E5BFF', fontWeight: '800', fontSize: 12 },
  messageBtn: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  messageBtnMuted: {
    backgroundColor: '#F3F4F6',
  },
  messageBtnSuccess: {
    backgroundColor: '#E8F7ED',
  },
  messageBtnText: { color: '#FFFFFF', fontWeight: '700' },
  messageBtnTextMuted: { color: '#374151' },
  emptyState: {
    backgroundColor: '#F8FAFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5EAF8',
    padding: 16,
  },
  friendRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  emptyTitle: { fontWeight: '800', color: '#111827', marginBottom: 6 },
  emptyText: { color: '#4B5563' },
});
