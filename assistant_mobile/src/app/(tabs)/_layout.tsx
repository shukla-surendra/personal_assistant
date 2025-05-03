import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Auth from '../../utils/auth';

export default function TabLayout() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await Auth.logout();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#666',
                tabBarStyle: {
                    backgroundColor: '#fff',
                },
                headerRight: () => (
                    <TouchableOpacity
                        style={{ marginRight: 16 }}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={24} color="#007AFF" />
                    </TouchableOpacity>
                ),
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="tasks"
                options={{
                    title: 'Tasks',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="notes"
                options={{
                    title: 'Notes',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="document-text-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="pomodoro"
                options={{
                    title: 'Pomodoro',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="timer" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
} 