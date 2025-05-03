import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PomodoroTimer from '../../components/PomodoroTimer';
import PomodoroSettingsPanel from '../../components/PomodoroSettings';

export default function PomodoroScreen() {
    const [showSettings, setShowSettings] = useState(false);
    const [rotation] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.loop(
            Animated.timing(rotation, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Pomodoro Timer</Text>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => setShowSettings(!showSettings)}
                >
                    <Ionicons
                        name={showSettings ? 'close' : 'settings'}
                        size={24}
                        color="#007AFF"
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.timerContainer}>
                <Animated.View style={[styles.circle, { transform: [{ rotate: spin }] }]}>
                    <Ionicons name="timer" size={120} color="#007AFF" />
                </Animated.View>
                <PomodoroTimer />
            </View>

            {showSettings && (
                <View style={styles.settingsContainer}>
                    <PomodoroSettingsPanel />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    settingsButton: {
        padding: 8,
    },
    timerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    circle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    settingsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
}); 