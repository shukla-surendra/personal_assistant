import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import pomodoroService from '../services/pomodoroService';

export default function PomodoroTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
    const [progress] = useState(new Animated.Value(0));

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isRunning && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleTimerComplete();
        }
        return () => clearInterval(timer);
    }, [isRunning, timeLeft]);

    useEffect(() => {
        const settings = pomodoroService.getSettings();
        switch (mode) {
            case 'work':
                setTimeLeft(settings.workDuration * 60);
                break;
            case 'shortBreak':
                setTimeLeft(settings.shortBreakDuration * 60);
                break;
            case 'longBreak':
                setTimeLeft(settings.longBreakDuration * 60);
                break;
        }
    }, [mode]);

    const handleTimerComplete = () => {
        setIsRunning(false);
        const settings = pomodoroService.getSettings();
        if (mode === 'work') {
            setMode(settings.autoStartBreaks ? 'shortBreak' : 'work');
        } else {
            setMode(settings.autoStartPomodoros ? 'work' : mode);
        }
    };

    const toggleTimer = () => {
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setIsRunning(false);
        const settings = pomodoroService.getSettings();
        setTimeLeft(settings.workDuration * 60);
        setMode('work');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getModeColor = () => {
        switch (mode) {
            case 'work':
                return '#007AFF';
            case 'shortBreak':
                return '#4CAF50';
            case 'longBreak':
                return '#FF9800';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.modeContainer}>
                <TouchableOpacity
                    style={[styles.modeButton, mode === 'work' && styles.activeMode]}
                    onPress={() => setMode('work')}
                >
                    <Text style={[styles.modeText, mode === 'work' && styles.activeModeText]}>
                        Work
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeButton, mode === 'shortBreak' && styles.activeMode]}
                    onPress={() => setMode('shortBreak')}
                >
                    <Text style={[styles.modeText, mode === 'shortBreak' && styles.activeModeText]}>
                        Short Break
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeButton, mode === 'longBreak' && styles.activeMode]}
                    onPress={() => setMode('longBreak')}
                >
                    <Text style={[styles.modeText, mode === 'longBreak' && styles.activeModeText]}>
                        Long Break
                    </Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.timer, { color: getModeColor() }]}>
                {formatTime(timeLeft)}
            </Text>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.controlButton, styles.resetButton]}
                    onPress={resetTimer}
                >
                    <Ionicons name="refresh" size={24} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.controlButton, styles.playButton, { backgroundColor: getModeColor() }]}
                    onPress={toggleTimer}
                >
                    <Ionicons
                        name={isRunning ? 'pause' : 'play'}
                        size={32}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    modeContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    modeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 8,
        backgroundColor: '#f5f5f5',
    },
    activeMode: {
        backgroundColor: '#007AFF',
    },
    modeText: {
        fontSize: 14,
        color: '#666',
    },
    activeModeText: {
        color: '#fff',
    },
    timer: {
        fontSize: 72,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    resetButton: {
        backgroundColor: '#f5f5f5',
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
}); 