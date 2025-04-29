import { Stack } from 'expo-router';

export default function SettingsLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#fff',
                },
                headerTintColor: '#000',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Settings',
                }}
            />
            <Stack.Screen
                name="password"
                options={{
                    title: 'Change Password',
                }}
            />
            <Stack.Screen
                name="workspaces"
                options={{
                    title: 'Workspaces',
                }}
            />
        </Stack>
    );
} 