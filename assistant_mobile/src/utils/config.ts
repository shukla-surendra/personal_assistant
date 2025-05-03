import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://192.168.29.93:8000';

interface Workspace {
    workspace_id: string;
    name: string;
    description?: string;
}

class ConfigService {
    private static instance: ConfigService;
    private defaultWorkspace: Workspace | null = null;
    private userId: string | null = null;

    private constructor() {}

    static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    async setDefaultWorkspace(workspace: Workspace | null): Promise<void> {
        this.defaultWorkspace = workspace;
        if (workspace) {
            await AsyncStorage.setItem('defaultWorkspace', JSON.stringify(workspace));
        } else {
            await AsyncStorage.removeItem('defaultWorkspace');
        }
    }

    async getDefaultWorkspace(): Promise<Workspace | null> {
        if (!this.defaultWorkspace) {
            const workspace = await AsyncStorage.getItem('defaultWorkspace');
            if (workspace) {
                this.defaultWorkspace = JSON.parse(workspace);
            }
        }
        return this.defaultWorkspace;
    }

    async setUserId(userId: string | null): Promise<void> {
        this.userId = userId;
        if (userId) {
            await AsyncStorage.setItem('userId', userId);
        } else {
            await AsyncStorage.removeItem('userId');
        }
    }

    async getUserId(): Promise<string> {
        if (!this.userId) {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                throw new Error('No user ID found');
            }
            this.userId = userId;
        }
        return this.userId;
    }

    async clear(): Promise<void> {
        this.defaultWorkspace = null;
        this.userId = null;
        await AsyncStorage.clear();
    }
}

const Config = ConfigService.getInstance();
export default Config; 