import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../../src/components/ThemedText';
import { ThemedView } from '../../src/components/ThemedView';

export default function TasksScreen() {
    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Tasks</ThemedText>
            <ThemedText>Coming soon...</ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
}); 