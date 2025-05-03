import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import Auth from '../utils/auth';

export default function RootLayout() {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const isLoggedIn = await Auth.loggedIn();
                if (!isLoggedIn) {
                    router.replace('/login');
                } else {
                    router.replace('/(tabs)');
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                router.replace('/login');
            }
        };

        checkAuth();
    }, []);

    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="task-detail" options={{ headerShown: true }} />
        </Stack>
    );
} 