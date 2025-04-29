import api from './api';

interface Workspace {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

class WorkspaceService {
    async getMemberWorkspaces(): Promise<Workspace[]> {
        try {
            const response = await api.get('/api/v1/workspaces/member-workspaces');
            return response.data;
        } catch (error) {
            console.error('Error fetching member workspaces:', error);
            throw error;
        }
    }

    async getOwnWorkspaces(): Promise<Workspace[]> {
        try {
            const response = await api.get('/api/v1/workspaces');
            return response.data;
        } catch (error) {
            console.error('Error fetching own workspaces:', error);
            throw error;
        }
    }

    async createWorkspace(name: string, description?: string): Promise<Workspace> {
        try {
            const response = await api.post('/api/v1/workspaces', { name, description });
            return response.data;
        } catch (error) {
            console.error('Error creating workspace:', error);
            throw error;
        }
    }

    async updateWorkspace(workspaceId: string, name: string, description?: string): Promise<Workspace> {
        try {
            const response = await api.put(`/api/v1/workspaces/${workspaceId}`, { name, description });
            return response.data;
        } catch (error) {
            console.error('Error updating workspace:', error);
            throw error;
        }
    }

    async deleteWorkspace(workspaceId: string): Promise<void> {
        try {
            await api.delete(`/api/v1/workspaces/${workspaceId}`);
        } catch (error) {
            console.error('Error deleting workspace:', error);
            throw error;
        }
    }
}

export default new WorkspaceService(); 