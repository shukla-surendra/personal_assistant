import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const router = useRouter();

    const navigateTo = (screen: string) => {
        router.push(`/(tabs)/${screen}`);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Here's your overview</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="list" size={24} color="#007AFF" />
                    <Text style={styles.statNumber}>5</Text>
                    <Text style={styles.statLabel}>Active Tasks</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="document-text-outline" size={24} color="#007AFF" />
                    <Text style={styles.statNumber}>12</Text>
                    <Text style={styles.statLabel}>Notes</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="timer" size={24} color="#007AFF" />
                    <Text style={styles.statNumber}>3</Text>
                    <Text style={styles.statLabel}>Pomodoros</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigateTo('tasks')}
                    >
                        <Ionicons name="add-circle" size={24} color="#007AFF" />
                        <Text style={styles.actionText}>New Task</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigateTo('notes')}
                    >
                        <Ionicons name="create" size={24} color="#007AFF" />
                        <Text style={styles.actionText}>New Note</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigateTo('pomodoro')}
                    >
                        <Ionicons name="play" size={24} color="#007AFF" />
                        <Text style={styles.actionText}>Start Timer</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.activityList}>
                    <View style={styles.activityItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        <Text style={styles.activityText}>Completed task: "Review project"</Text>
                    </View>
                    <View style={styles.activityItem}>
                        <Ionicons name="document-text" size={20} color="#007AFF" />
                        <Text style={styles.activityText}>Created note: "Meeting notes"</Text>
                    </View>
                    <View style={styles.activityItem}>
                        <Ionicons name="timer" size={20} color="#FF9800" />
                        <Text style={styles.activityText}>Completed pomodoro session</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 8,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    actionText: {
        marginTop: 8,
        fontSize: 14,
        color: '#333',
    },
    activityList: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    activityText: {
        marginLeft: 12,
        fontSize: 14,
        color: '#333',
    },
}); 