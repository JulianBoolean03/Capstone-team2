import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export async function requestNotificationPermissions() {
    if (!Device.isDevice) {
        console.log('[Notifications] Running on simulator, skipping notification registration');
        return null;
    }

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Permission denied');
            return null;
        }

        const token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });

        console.log('[Notifications] Push token:', token.data);
        return token.data;
    } catch (error) {
        console.error('[Notifications] Error getting push token:', error);
        return null;
    }
}

export async function registerPushToken(token: string, authToken: string) {
    try {
        const response = await fetch('http://localhost:4000/users/push-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) {
            console.error('[Notifications] Failed to register token:', await response.text());
            return false;
        }

        console.log('[Notifications] Token registered successfully');
        return true;
    } catch (error) {
        console.error('[Notifications] Error registering token:', error);
        return false;
    }
}

export function setupNotificationChannels() {
    // Set notification handler for all incoming notifications
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}
