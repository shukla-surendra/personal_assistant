import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import taskService from '../src/services/taskService';
import { useThemeColor } from '../hooks/useThemeColor';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
}

export default function TaskDetailScreen() {
    const router = useRouter();
    const { taskId, workspaceId } = useLocalSearchParams<{ taskId?: string; workspaceId: string }>();
    const [task, setTask] = useState<Partial<Task>>({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
    const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
    const borderColor = useThemeColor({ light: '#f0f0f0', dark: '#38383A' }, 'border');

    useEffect(() => {
        if (taskId) {
            loadTask();
        } else {
            setLoading(false);
        }
    }, [taskId]);

    const loadTask = async () => {
        try {
            const loadedTask = await taskService.getTask(workspaceId, taskId!);
            setTask(loadedTask);
        } catch (error) {
            console.error('Error loading task:', error);
            Alert.alert('Error', 'Failed to load task');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!task.title) {
            Alert.alert('Error', 'Title is required');
            return;
        }

        setSaving(true);
        try {
            if (taskId) {
                await taskService.updateTask(workspaceId, taskId, task);
            } else {
                await taskService.createTask(workspaceId, {
                    ...task,
                    workspace_id: workspaceId,
                } as any);
            }
            router.back();
        } catch (error) {
            console.error('Error saving task:', error);
            Alert.alert('Error', 'Failed to save task');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!taskId) return;

        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await taskService.deleteTask(workspaceId, taskId);
                            router.back();
                        } catch (error) {
                            console.error('Error deleting task:', error);
                            Alert.alert('Error', 'Failed to delete task');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor }]}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor }]}>
            <View style={styles.form}>
                <TextInput
                    style={[styles.input, { color: textColor, borderColor }]}
                    placeholder="Title"
                    placeholderTextColor="#999"
                    value={task.title}
                    onChangeText={(text) => setTask({ ...task, title: text })}
                />
                <TextInput
                    style={[styles.input, styles.textArea, { color: textColor, borderColor }]}
                    placeholder="Description"
                    placeholderTextColor="#999"
                    value={task.description}
                    onChangeText={(text) => setTask({ ...task, description: text })}
                    multiline
                    numberOfLines={4}
                />
                <View style={[styles.section, { borderBottomColor: borderColor }]}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Status</Text>
                    <View style={styles.statusContainer}>
                        {['todo', 'in_progress', 'done'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.statusButton,
                                    task.status === status && styles.statusButtonActive,
                                ]}
                                onPress={() => setTask({ ...task, status: status as Task['status'] })}
                            >
                                <Text
                                    style={[
                                        styles.statusText,
                                        task.status === status && styles.statusTextActive,
                                    ]}
                                >
                                    {status.replace('_', ' ')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <View style={[styles.section, { borderBottomColor: borderColor }]}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Priority</Text>
                    <View style={styles.priorityContainer}>
                        {['low', 'medium', 'high'].map((priority) => (
                            <TouchableOpacity
                                key={priority}
                                style={[
                                    styles.priorityButton,
                                    task.priority === priority && styles.priorityButtonActive,
                                ]}
                                onPress={() =>
                                    setTask({ ...task, priority: priority as Task['priority'] })
                                }
                            >
                                <Text
                                    style={[
                                        styles.priorityText,
                                        task.priority === priority && styles.priorityTextActive,
                                    ]}
                                >
                                    {priority}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
            <View style={styles.footer}>
                {taskId && (
                    <TouchableOpacity
                        style={[styles.deleteButton, { borderColor }]}
                        onPress={handleDelete}
                    >
                        <Ionicons name="trash-outline" size={24} color="#ff3b30" />
                        <Text style={styles.deleteButtonText}>Delete Task</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: '#007AFF' }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    form: {
        padding: 16,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 15,
    },
    section: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 5,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    statusButtonActive: {
        backgroundColor: '#007AFF',
    },
    statusText: {
        fontSize: 14,
        color: '#666',
    },
    statusTextActive: {
        color: '#fff',
    },
    priorityContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    priorityButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 5,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    priorityButtonActive: {
        backgroundColor: '#007AFF',
    },
    priorityText: {
        fontSize: 14,
        color: '#666',
    },
    priorityTextActive: {
        color: '#fff',
    },
    footer: {
        padding: 16,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 15,
    },
    deleteButtonText: {
        color: '#ff3b30',
        fontSize: 16,
        marginLeft: 10,
        fontWeight: '600',
    },
    saveButton: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
}); 