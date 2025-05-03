import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import pomodoroService, { PomodoroSettings } from '../services/pomodoroService';

const PomodoroSettingsPanel: React.FC = () => {
    const [settings, setSettings] = useState<PomodoroSettings>(pomodoroService.getSettings());

    useEffect(() => {
        const loadSettings = async () => {
            setSettings(pomodoroService.getSettings());
        };
        loadSettings();
    }, []);

    const handleSettingChange = async (key: keyof PomodoroSettings, value: number | boolean) => {
        try {
            const newSettings = { ...settings, [key]: value };
            await pomodoroService.saveSettings(newSettings);
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving pomodoro settings:', error);
        }
    };

    const renderNumberInput = (label: string, value: number, key: keyof PomodoroSettings) => (
        <View style={styles.settingRow}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.numberInput}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleSettingChange(key, Math.max(1, value - 1))}
                >
                    <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.value}>{value}</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleSettingChange(key, value + 1)}
                >
                    <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderSwitch = (label: string, value: boolean, key: keyof PomodoroSettings) => (
        <View style={styles.settingRow}>
            <Text style={styles.label}>{label}</Text>
            <Switch
                value={value}
                onValueChange={(newValue) => handleSettingChange(key, newValue)}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            {renderNumberInput('Work Duration (minutes)', settings.workDuration, 'workDuration')}
            {renderNumberInput('Short Break Duration (minutes)', settings.shortBreakDuration, 'shortBreakDuration')}
            {renderNumberInput('Long Break Duration (minutes)', settings.longBreakDuration, 'longBreakDuration')}
            {renderNumberInput('Long Break Interval', settings.longBreakInterval, 'longBreakInterval')}
            {renderSwitch('Auto-start Breaks', settings.autoStartBreaks, 'autoStartBreaks')}
            {renderSwitch('Auto-start Pomodoros', settings.autoStartPomodoros, 'autoStartPomodoros')}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        margin: 10,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    label: {
        fontSize: 16,
        color: '#333',
    },
    numberInput: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    button: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    value: {
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: 10,
        minWidth: 30,
        textAlign: 'center',
    },
});

export default PomodoroSettingsPanel; 