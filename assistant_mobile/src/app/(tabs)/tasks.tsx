import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import taskService, { Task } from '../../services/taskService';

export default function TasksScreen() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const fetchedTasks = await taskService.getAll();
            setTasks(fetchedTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderTask = ({ item }: { item: Task }) => (
        <TouchableOpacity
            style={styles.taskItem}
            onPress={() => router.push({
                pathname: '/task-detail',
                params: { id: item.id }
            })}
        >
            <Text style={styles.taskTitle}>{item.title}</Text>
            {item.description && (
                <Text style={styles.taskDescription}>{item.description}</Text>
            )}
            <View style={styles.taskMeta}>
                <Text style={styles.taskStatus}>{item.status}</Text>
                <Text style={styles.taskPriority}>{item.priority}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={tasks}
                renderItem={renderTask}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    list: {
        padding: 16,
    },
    taskItem: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    taskDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    taskMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    taskStatus: {
        fontSize: 12,
        color: '#666',
    },
    taskPriority: {
        fontSize: 12,
        color: '#666',
    },
}); 