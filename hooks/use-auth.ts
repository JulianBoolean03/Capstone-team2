import { useDummyAuth } from '@/lib/dummy-auth';

export function useAuth() {
    const user = useDummyAuth();

    // Get token from dummy-auth.ts store
    const store = require('@/lib/dummy-auth').store;
    const token = store?.token || null;
    const userId = user?.id || null;

    return {
        user,
        token,
        userId,
        isAuthenticated: !!token && !!user,
    };
}
