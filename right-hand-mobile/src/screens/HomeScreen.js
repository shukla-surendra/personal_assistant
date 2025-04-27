import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Config from '../utils/config';
import Auth from '../utils/auth';
import WorkspaceService from '../services/WorkspaceService';

export default function HomeScreen({ navigation }) {
    const [currentWorkspace, setCurrentWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCurrentWorkspace();
    }, []);

    const loadCurrentWorkspace = async () => {
        try {
            const workspace = await Config.getDefaultWorkspace();
            setCurrentWorkspace(workspace);
        } catch (error) {
            Alert.alert('Error', 'Failed to load current workspace');
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

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Right Hand</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.workspaceSection}>
                <Text style={styles.sectionTitle}>Current Workspace</Text>
                <TouchableOpacity
                    style={styles.workspaceCard}
                    onPress={() => navigation.navigate('Workspaces')}
                >
                    <View style={styles.workspaceInfo}>
                        <Text style={styles.workspaceName}>
                            {currentWorkspace?.name || 'No workspace selected'}
                        </Text>
                        <Text style={styles.workspaceDescription}>
                            {currentWorkspace?.description || 'Select a workspace to get started'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <View style={styles.featuresSection}>
                <Text style={styles.sectionTitle}>Features</Text>
                
                <TouchableOpacity
                    style={styles.featureCard}
                    onPress={() => navigation.navigate('Chat')}
                >
                    <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
                    <Text style={styles.featureText}>Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.featureCard}
                    onPress={() => navigation.navigate('Tasks')}
                >
                    <Ionicons name="list-outline" size={24} color="#007AFF" />
                    <Text style={styles.featureText}>Tasks</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.featureCard}
                    onPress={() => navigation.navigate('Calendar')}
                >
                    <Ionicons name="calendar-outline" size={24} color="#007AFF" />
                    <Text style={styles.featureText}>Calendar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.featureCard}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Ionicons name="settings-outline" size={24} color="#007AFF" />
                    <Text style={styles.featureText}>Settings</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    workspaceSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#000',
    },
    workspaceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    workspaceInfo: {
        flex: 1,
    },
    workspaceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    workspaceDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    featuresSection: {
        padding: 20,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        marginBottom: 10,
    },
    featureText: {
        fontSize: 16,
        marginLeft: 15,
        color: '#000',
    },
}); 