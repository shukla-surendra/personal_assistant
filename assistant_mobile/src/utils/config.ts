import AsyncStorage from '@react-native-async-storage/async-storage';

interface Workspace {
    workspace_id: string;
    [key: string]: any;
}

class ConfigService {
    async setDefaultWorkspace(default_workspace: Workspace) {
        try {
            await AsyncStorage.setItem('workspace', JSON.stringify(default_workspace));
            return true;
        } catch (error) {
            console.error('Error setting default workspace:', error);
            return false;
        }
    }

    async removeDefaultWorkspace() {
        try {
            await AsyncStorage.removeItem('workspace');
            return true;
        } catch (error) {
            console.error('Error removing default workspace:', error);
            return false;
        }
    }

    async getDefaultWorkspace(): Promise<Workspace> {
        const default_workspace = { workspace_id: "default_id" };
        try {
            const workspaceJSON = await AsyncStorage.getItem('workspace');
            return workspaceJSON ? JSON.parse(workspaceJSON) : default_workspace;
        } catch (error) {
            console.error('Error getting default workspace:', error);
            return default_workspace;
        }
    }
}

export default new ConfigService(); 