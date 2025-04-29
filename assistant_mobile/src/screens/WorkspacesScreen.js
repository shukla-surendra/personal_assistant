import React, { useState, useEffect } from 'react';
import {
    View,
    FlatList,
    TouchableOpacity,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WorkspaceService from '../services/WorkspaceService';
import Config from '../utils/config';

export default function WorkspacesScreen({ navigation }) {
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWorkspaces();
    }, []);

    const loadWorkspaces = async () => {
        try {
            const data = await WorkspaceService.getAll();
            setWorkspaces(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load workspaces');
        } finally {
            setLoading(false);
        }
    };

    const handleWorkspaceSelect = async (workspace) => {
        try {
            await Config.setDefaultWorkspace(workspace);
            Alert.alert('Success', 'Workspace changed successfully');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to change workspace');
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
        <View style={styles.container}>
            <FlatList
                data={workspaces}
                keyExtractor={(item) => item.workspace_id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.workspaceItem}
                        onPress={() => handleWorkspaceSelect(item)}
                    >
                        <View style={styles.workspaceContent}>
                            <Text style={styles.workspaceName}>{item.name}</Text>
                            <Text style={styles.workspaceDescription}>
                                {item.description || 'No description'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#666" />
                    </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
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
    workspaceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
    },
    workspaceContent: {
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
    separator: {
        height: 1,
        backgroundColor: '#eee',
    },
}); 