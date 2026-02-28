import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from './api';

let socketInstance: Socket | null = null;

export const initSocket = (token: string | null): Socket => {
    if (socketInstance) {
        return socketInstance;
    }

    socketInstance = io(getApiBaseUrl(), {
        auth: {
            token: token || '',
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
        console.log('[Socket] Connected:', socketInstance?.id);
    });

    socketInstance.on('disconnect', () => {
        console.log('[Socket] Disconnected');
    });

    socketInstance.on('error', (error) => {
        console.error('[Socket] Error:', error);
    });

    return socketInstance;
};

export const getSocket = (): Socket | null => {
    return socketInstance;
};

export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
};

export const sendMessage = (conversationId: string, content: string) => {
    if (socketInstance) {
        socketInstance.emit('send_message', { conversationId, content });
    }
};

export const markMessageRead = (conversationId: string, messageId: string) => {
    if (socketInstance) {
        socketInstance.emit('mark_read', { conversationId, messageId });
    }
};

export const selectConversation = (conversationId: string) => {
    if (socketInstance) {
        socketInstance.emit('conversation:select', conversationId);
    }
};

export const deselectConversation = () => {
    if (socketInstance) {
        socketInstance.emit('conversation:deselect');
    }
};

export default socketInstance;
