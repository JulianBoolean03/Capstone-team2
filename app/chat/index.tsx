import { Avatar } from '@/components/avatar';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { formatTimestamp } from '@/lib/timestamp-formatter';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Conversation {
    id: string;
    otherUser: {
        id: string;
        fullName: string;
        email: string;
        avatarBgColor: string;
        avatarTextColor: string;
    };
    lastMessage: {
        id: string;
        content: string;
        senderId: string;
        createdAt: string;
        readAt: string | null;
    } | null;
    lastMessageAt: string;
    unreadCount: number;
}

export default function ChatListScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadConversations = useCallback(async () => {
        try {
            setError(null);
            const data = await apiRequest<{ conversations: Conversation[] }>(
                '/conversations',
                { method: 'GET' },
                token
            );
            setConversations(data.conversations);
        } catch (err) {
            console.error('Failed to load conversations:', err);
            setError('Couldn\'t load chats. Pull to refresh');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        loadConversations();

        // Subscribe to real-time message updates
        const socket = getSocket();
        if (!socket) return;

        const handleReceiveMessage = () => {
            console.log('[ChatList] New message received, refreshing conversations');
            loadConversations();
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [loadConversations]);

    const onRefresh = () => {
        setRefreshing(true);
        loadConversations();
    };

    const renderConversation = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => router.push(`/chat/${item.id}`)}
        >
            <Avatar
                name={item.otherUser.fullName}
                backgroundColor={item.otherUser.avatarBgColor}
                textColor={item.otherUser.avatarTextColor}
                size={56}
            />
            <View style={styles.conversationContent}>
                <View style={styles.headerRow}>
                    <Text style={styles.userName}>{item.otherUser.fullName}</Text>
                    {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage?.content || 'No messages yet'}
                </Text>
                <Text style={styles.timestamp}>
                    {formatTimestamp(item.lastMessageAt)}
                </Text>
            </View>
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
            {error && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{error}</Text>
                </View>
            )}
            <FlatList
                data={conversations}
                renderItem={renderConversation}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No chats yet</Text>
                        <Text style={styles.emptySubtext}>Tap + to start one</Text>
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
    errorBanner: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#FECACA',
    },
    errorBannerText: {
        fontSize: 13,
        color: '#991B1B',
        fontWeight: '500',
        textAlign: 'center',
    },
    conversationItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    conversationContent: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        flex: 1,
    },
    unreadBadge: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 12,
        color: '#999',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
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
    },
});
