import api from './api';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
    workspace_id: string;
    created_at: string;
    updated_at: string;
}

interface CreateTaskData {
    title: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
    workspace_id: string;
}

interface UpdateTaskData {
    title?: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
}

class TaskService {
    async getTasks(workspaceId: string): Promise<Task[]> {
        try {
            const response = await api.get(`/api/v1/workspaces/${workspaceId}/tasks`);
            return response.data;
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    }

    async getTask(workspaceId: string, taskId: string): Promise<Task> {
        try {
            const response = await api.get(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching task:', error);
            throw error;
        }
    }

    async createTask(workspaceId: string, data: CreateTaskData): Promise<Task> {
        try {
            const response = await api.post(`/api/v1/workspaces/${workspaceId}/tasks`, data);
            return response.data;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    async updateTask(workspaceId: string, taskId: string, data: UpdateTaskData): Promise<Task> {
        try {
            const response = await api.put(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }

    async deleteTask(workspaceId: string, taskId: string): Promise<void> {
        try {
            await api.delete(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}`);
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }

    async searchTasks(workspaceId: string, query: string): Promise<Task[]> {
        try {
            const response = await api.get(`/api/v1/workspaces/${workspaceId}/tasks/search`, {
                params: { q: query }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching tasks:', error);
            throw error;
        }
    }
}

export default new TaskService(); 