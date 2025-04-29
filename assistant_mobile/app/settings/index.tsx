import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function SettingsScreen() {
    const router = useRouter();
    const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
    const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
    const borderColor = useThemeColor({ light: '#f0f0f0', dark: '#38383A' }, 'border');

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.section}>
                <TouchableOpacity
                    style={[styles.menuItem, { borderBottomColor: borderColor }]}
                    onPress={() => router.push('/settings/password')}
                >
                    <Ionicons name="key-outline" size={24} color="#007AFF" />
                    <Text style={[styles.menuItemText, { color: textColor }]}>Change Password</Text>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, { borderBottomColor: borderColor }]}
                    onPress={() => router.push('/settings/workspaces')}
                >
                    <Ionicons name="business-outline" size={24} color="#007AFF" />
                    <Text style={[styles.menuItemText, { color: textColor }]}>Workspaces</Text>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.menuItem, { borderBottomColor: borderColor }]}
                    onPress={() => router.push('/settings/notifications')}
                >
                    <Ionicons name="notifications-outline" size={24} color="#007AFF" />
                    <Text style={[styles.menuItemText, { color: textColor }]}>Notifications</Text>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        marginTop: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        marginLeft: 15,
    },
}); 