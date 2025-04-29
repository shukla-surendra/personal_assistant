import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function TasksScreen() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const response = await api.get('/api/v1/tasks');
            setTasks(response.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const toggleTaskStatus = async (taskId) => {
        try {
            const task = tasks.find((t) => t.id === taskId);
            const response = await api.put(`/api/v1/tasks/${taskId}`, {
                completed: !task.completed,
            });

            setTasks(tasks.map((t) => (t.id === taskId ? response.data : t)));
        } catch (error) {
            Alert.alert('Error', 'Failed to update task status');
        }
    };

    const deleteTask = async (taskId) => {
        try {
            await api.delete(`/api/v1/tasks/${taskId}`);
            setTasks(tasks.filter((t) => t.id !== taskId));
        } catch (error) {
            Alert.alert('Error', 'Failed to delete task');
        }
    };

    const renderTask = ({ item }) => (
        <View style={styles.taskItem}>
            <TouchableOpacity
                style={styles.taskContent}
                onPress={() => toggleTaskStatus(item.id)}
            >
                <View style={styles.checkbox}>
                    {item.completed && (
                        <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                </View>
                <View style={styles.taskInfo}>
                    <Text
                        style={[
                            styles.taskTitle,
                            item.completed && styles.completedTask,
                        ]}
                    >
                        {item.title}
                    </Text>
                    {item.description && (
                        <Text style={styles.taskDescription}>
                            {item.description}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteTask(item.id)}
            >
                <Ionicons name="trash-outline" size={20} color="#ff3b30" />
            </TouchableOpacity>
        </View>
    );

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
                data={tasks}
                renderItem={renderTask}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.taskList}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No tasks found</Text>
                    </View>
                }
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
    taskList: {
        padding: 15,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        marginBottom: 10,
    },
    taskContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#007AFF',
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    completedTask: {
        textDecorationLine: 'line-through',
        color: '#666',
    },
    taskDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    deleteButton: {
        padding: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
}); 