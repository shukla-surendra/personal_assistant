import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Switch,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Auth from '../utils/auth';
import Config from '../utils/config';
import api from '../services/api';

export default function SettingsScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const userProfile = await Auth.getProfile();
            setUser(userProfile);
        } catch (error) {
            Alert.alert('Error', 'Failed to load user profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await Auth.logout();
            navigation.replace('Login');
        } catch (error) {
            Alert.alert('Error', 'Failed to logout');
        }
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete('/api/v1/users/me');
                            await Auth.logout();
                            navigation.replace('Login');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete account');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile</Text>
                <View style={styles.profileInfo}>
                    <Text style={styles.label}>Name</Text>
                    <Text style={styles.value}>{user?.name}</Text>
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{user?.email}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.preferenceItem}>
                    <Text style={styles.preferenceLabel}>Enable Notifications</Text>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={notificationsEnabled ? '#007AFF' : '#f4f3f4'}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('ChangePassword')}
                >
                    <Text style={styles.buttonText}>Change Password</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDeleteAccount}
                >
                    <Text style={[styles.buttonText, styles.deleteButtonText]}>
                        Delete Account
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#000',
    },
    profileInfo: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    value: {
        fontSize: 16,
        color: '#000',
    },
    preferenceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    preferenceLabel: {
        fontSize: 16,
        color: '#000',
    },
    button: {
        backgroundColor: '#f8f8f8',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    buttonText: {
        fontSize: 16,
        color: '#007AFF',
        textAlign: 'center',
    },
    deleteButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ff3b30',
    },
    deleteButtonText: {
        color: '#ff3b30',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        marginTop: 'auto',
    },
    logoutText: {
        fontSize: 16,
        color: '#ff3b30',
        marginLeft: 10,
    },
}); 