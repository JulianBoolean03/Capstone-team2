import { Avatar } from '@/components/avatar';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Friend {
    id: string;
    fullName: string;
    email: string;
    avatarBgColor: string;
    avatarTextColor: string;
    connectedAt: string;
}

export default function NewChatModal() {
    const router = useRouter();
    const { token } = useAuth();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const loadFriends = async () => {
            try {
                const data = await apiRequest<{
                    friends: Friend[];
                    incoming: any[];
                    outgoing: any[];
                }>('/friends/requests', { method: 'GET' }, token);
                setFriends(data.friends);
            } catch (error) {
                console.error('Failed to load friends:', error);
                Alert.alert('Error', 'Failed to load friends list');
            } finally {
                setLoading(false);
            }
        };

        loadFriends();
    }, [token]);

    const handleStartChat = useCallback(
        async (friendId: string) => {
            try {
                setCreating(true);
                const data = await apiRequest<{ conversationId: string }>(
                    '/conversations',
                    {
                        method: 'POST',
                        body: JSON.stringify({ otherUserId: friendId }),
                    },
                    token
                );

                // Dismiss the modal first
                router.back();

                // Then navigate to the conversation
                setTimeout(() => {
                    router.push(`/chat/${data.conversationId}`);
                }, 300);
            } catch (error) {
                console.error('Failed to create conversation:', error);
                Alert.alert('Error', 'Failed to start chat');
                setCreating(false);
            }
        },
        [token, router]
    );

    const handleGroupChat = () => {
        Alert.alert('Coming Soon', 'Group chats will be available in a future update!');
    };

    const renderGroupChatRow = () => (
        <TouchableOpacity style={styles.groupChatRow} onPress={handleGroupChat}>
            <View style={styles.groupIconContainer}>
                <Ionicons name="people" size={28} color="#007AFF" />
            </View>
            <View style={styles.groupChatContent}>
                <Text style={styles.groupChatText}>New Group Chat</Text>
                <Text style={styles.groupChatSubtext}>Start a conversation with multiple friends</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
    );

    const renderFriend = ({ item }: { item: Friend }) => (
        <TouchableOpacity
            style={styles.friendRow}
            onPress={() => handleStartChat(item.id)}
            disabled={creating}
        >
            <Avatar
                name={item.fullName}
                backgroundColor={item.avatarBgColor}
                textColor={item.avatarTextColor}
                size={50}
            />
            <View style={styles.friendContent}>
                <Text style={styles.friendName}>{item.fullName}</Text>
                <Text style={styles.friendEmail}>{item.email}</Text>
            </View>
            {creating && <ActivityIndicator size="small" />}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={friends}
                renderItem={renderFriend}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderGroupChatRow}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No friends yet</Text>
                        <Text style={styles.emptySubtext}>
                            Add friends from the Explore tab to start chatting!
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    groupChatRow: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#f9f9f9',
    },
    groupIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f8ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupChatContent: {
        flex: 1,
    },
    groupChatText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    groupChatSubtext: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    friendRow: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    friendContent: {
        flex: 1,
    },
    friendName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    friendEmail: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#ccc',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});
