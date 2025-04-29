import AsyncStorage from '@react-native-async-storage/async-storage';

interface Workspace {
    workspace_id: string;
    name: string;
    description?: string;
}

class ConfigService {
    private static instance: ConfigService;
    private token: string | null = null;
    private defaultWorkspace: Workspace | null = null;

    private constructor() {}

    static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    async setToken(token: string | null): Promise<void> {
        this.token = token;
        if (token) {
            await AsyncStorage.setItem('token', token);
        } else {
            await AsyncStorage.removeItem('token');
        }
    }

    async getToken(): Promise<string | null> {
        if (!this.token) {
            this.token = await AsyncStorage.getItem('token');
        }
        return this.token;
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

    async clear(): Promise<void> {
        this.token = null;
        this.defaultWorkspace = null;
        await AsyncStorage.clear();
    }
}

const Config = ConfigService.getInstance();
export default Config; 