import { getAuthToken, hasAuthToken, subscribeAuth } from '@/lib/dummy-auth';
import { disconnectSocket, getSocket, initSocket } from '@/lib/socket';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

type SocketContextType = {
    socket: Socket | null;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [authChanged, setAuthChanged] = useState(0);

    // Subscribe to auth state changes
    useEffect(() => {
        const unsubscribe = subscribeAuth(() => {
            // Trigger a re-check of auth state by incrementing counter
            setAuthChanged((prev) => prev + 1);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Initialize or disconnect socket based on auth state
    useEffect(() => {
        const manageSocket = async () => {
            const hasToken = hasAuthToken();

            if (hasToken) {
                // Try to get existing socket first
                const existingSocket = getSocket();

                if (existingSocket) {
                    // Socket already initialized, just update state
                    setSocket(existingSocket);
                } else {
                    // Need to initialize socket with current token
                    try {
                        const token = getAuthToken();
                        if (token) {
                            const newSocket = initSocket(token);
                            setSocket(newSocket);
                            console.log('[SocketProvider] Socket initialized');
                        }
                    } catch (error) {
                        console.error('[SocketProvider] Failed to initialize socket:', error);
                    }
                }
            } else {
                // No token, disconnect if needed
                const currentSocket = getSocket();
                if (currentSocket) {
                    disconnectSocket();
                    setSocket(null);
                    console.log('[SocketProvider] Socket disconnected (no auth)');
                } else if (socket) {
                    setSocket(null);
                }
            }
        };

        manageSocket();
    }, [authChanged, socket]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket(): Socket | null {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context.socket;
}
