import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../utils/config';

export interface PomodoroSettings {
    workDuration: number; // in minutes
    shortBreakDuration: number; // in minutes
    longBreakDuration: number; // in minutes
    longBreakInterval: number; // number of work sessions before long break
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
}

export interface PomodoroSession {
    id: string;
    startTime: string;
    endTime?: string;
    duration: number; // in minutes
    type: 'work' | 'short_break' | 'long_break';
    taskId?: string;
    workspaceId: string;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: true,
    autoStartPomodoros: true
};

class PomodoroService {
    private static instance: PomodoroService;
    private settings: PomodoroSettings = DEFAULT_SETTINGS;
    private currentSession: PomodoroSession | null = null;
    private sessionCount: number = 0;

    private constructor() {
        this.loadSettings();
    }

    static getInstance(): PomodoroService {
        if (!PomodoroService.instance) {
            PomodoroService.instance = new PomodoroService();
        }
        return PomodoroService.instance;
    }

    private async loadSettings(): Promise<void> {
        try {
            const settingsStr = await AsyncStorage.getItem('pomodoro_settings');
            if (settingsStr) {
                this.settings = JSON.parse(settingsStr);
            }
        } catch (error) {
            console.error('Error loading pomodoro settings:', error);
        }
    }

    async saveSettings(settings: Partial<PomodoroSettings>): Promise<void> {
        try {
            this.settings = { ...this.settings, ...settings };
            await AsyncStorage.setItem('pomodoro_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving pomodoro settings:', error);
            throw error;
        }
    }

    getSettings(): PomodoroSettings {
        return this.settings;
    }

    async startSession(taskId?: string): Promise<PomodoroSession> {
        try {
            const workspace = await Config.getDefaultWorkspace();
            if (!workspace?.workspace_id) {
                throw new Error('No workspace selected');
            }

            const sessionType = this.getNextSessionType();
            const duration = this.getDurationForSessionType(sessionType);

            const session: PomodoroSession = {
                id: Date.now().toString(),
                startTime: new Date().toISOString(),
                duration,
                type: sessionType,
                taskId,
                workspaceId: workspace.workspace_id
            };

            this.currentSession = session;
            if (sessionType === 'work') {
                this.sessionCount++;
            }

            return session;
        } catch (error) {
            console.error('Error starting pomodoro session:', error);
            throw error;
        }
    }

    async endSession(): Promise<PomodoroSession> {
        try {
            if (!this.currentSession) {
                throw new Error('No active session');
            }

            const session = {
                ...this.currentSession,
                endTime: new Date().toISOString()
            };

            this.currentSession = null;
            return session;
        } catch (error) {
            console.error('Error ending pomodoro session:', error);
            throw error;
        }
    }

    getCurrentSession(): PomodoroSession | null {
        return this.currentSession;
    }

    getSessionCount(): number {
        return this.sessionCount;
    }

    private getNextSessionType(): 'work' | 'short_break' | 'long_break' {
        if (!this.currentSession) {
            return 'work';
        }

        if (this.currentSession.type === 'work') {
            return this.sessionCount % this.settings.longBreakInterval === 0 ? 'long_break' : 'short_break';
        }

        return 'work';
    }

    private getDurationForSessionType(type: 'work' | 'short_break' | 'long_break'): number {
        switch (type) {
            case 'work':
                return this.settings.workDuration;
            case 'short_break':
                return this.settings.shortBreakDuration;
            case 'long_break':
                return this.settings.longBreakDuration;
        }
    }
}

export default PomodoroService.getInstance(); 