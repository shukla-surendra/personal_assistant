import api from './api';

class WorkspaceService {
    async getAll() {
        try {
            const response = await api.get('/api/v1/workspaces/member-workspaces');
            return response.data;
        } catch (error) {
            console.error('Error fetching member workspaces:', error);
            throw error;
        }
    }

    async getOwn() {
        try {
            const response = await api.get('/api/v1/workspaces');
            return response.data;
        } catch (error) {
            console.error('Error fetching own workspaces:', error);
            throw error;
        }
    }
}

export default new WorkspaceService(); 