import api from './api';
import Config from '../utils/config';

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
    workspace_id: string;
    created_at: string;
    updated_at: string;
    comments?: Comment[];
    task_type?: 'TASK' | 'NOTE' | 'quick_note' | 'time_block';
}

interface Comment {
    id: string;
    content: string;
    user: string;
    created_at: string;
}

interface CreateTaskData {
    title: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
    task_type?: 'TASK' | 'NOTE' | 'quick_note' | 'time_block';
    workspace_id?: string;
}

interface UpdateTaskData {
    title?: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
    task_type?: 'TASK' | 'NOTE' | 'quick_note' | 'time_block';
}

interface CreateCommentData {
    content: string;
    user: string;
}

class TaskService {
    private async getWorkspaceId(): Promise<string> {
        const workspace = await Config.getDefaultWorkspace();
        if (!workspace?.workspace_id) {
            throw new Error('No workspace selected');
        }
        return workspace.workspace_id;
    }

    async getAll(): Promise<Task[]> {
        try {
            const workspaceId = await this.getWorkspaceId();
            const response = await api.get(`/api/v1/workspaces/${workspaceId}/tasks`, {
                params: {
                    order: 'desc',
                    task_type: 'TASK',
                    skip: 0,
                    page_size: 50
                }
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    }

    async getAllNotes(): Promise<Task[]> {
        try {
            const workspaceId = await this.getWorkspaceId();
            const response = await api.get(`/api/v1/workspaces/${workspaceId}/tasks`, {
                params: {
                    order: 'desc',
                    task_type: 'NOTE'
                }
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching notes:', error);
            throw error;
        }
    }

    async getAllQuickNotes(): Promise<Task[]> {
        try {
            const workspaceId = await this.getWorkspaceId();
            const response = await api.get(`/api/v1/workspaces/${workspaceId}/tasks`, {
                params: {
                    order: 'desc',
                    task_type: 'quick_note'
                }
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching quick notes:', error);
            throw error;
        }
    }

    async getAllTimeBlocks(): Promise<Task[]> {
        try {
            const workspaceId = await this.getWorkspaceId();
            const response = await api.get(`/api/v1/workspaces/${workspaceId}/tasks`, {
                params: {
                    order: 'desc',
                    task_type: 'time_block'
                }
            });
            return response.data || [];
        } catch (error) {
            console.error('Error fetching time blocks:', error);
            throw error;
        }
    }

    async get(taskId: string): Promise<Task> {
        try {
            const workspaceId = await this.getWorkspaceId();
            const response = await api.get(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching task:', error);
            throw error;
        }
    }

    async getPostBySlug(slug: string): Promise<Task> {
        try {
            const workspaceId = await this.getWorkspaceId();
            const response = await api.get(`/api/v1/workspaces/${workspaceId}/tasks/${slug}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching task by slug:', error);
            throw error;
        }
    }

    async create(data: CreateTaskData): Promise<Task> {
        try {
            const workspaceId = await this.getWorkspaceId();
            const response = await api.post(`/api/v1/workspaces/${workspaceId}/tasks`, {
                ...data,
                task_type: data.task_type || 'TASK',
                workspace_id: workspaceId
            });
            return response.data;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    async update(taskId: string, data: UpdateTaskData): Promise<Task> {
        try {
            const workspaceId = await this.getWorkspaceId();
            const response = await api.put(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }

    async delete(taskId: string): Promise<void> {
        try {
            const workspaceId = await this.getWorkspaceId();
            await api.delete(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}`);
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }

    async deleteAll(): Promise<void> {
        try {
            const workspaceId = await this.getWorkspaceId();
            await api.delete(`/api/v1/workspaces/${workspaceId}/tasks`);
        } catch (error) {
            console.error('Error deleting all tasks:', error);
            throw error;
        }
    }

    async findByTitle(title: string): Promise<Task[]> {
        try {
            const workspaceId = await this.getWorkspaceId();
            const response = await api.get(`/api/v1/workspaces/${workspaceId}/tasks`, {
                params: { title }
            });
            return response.data || [];
        } catch (error) {
            console.error('Error finding tasks by title:', error);
            throw error;
        }
    }

    async addComment(taskId: string, data: CreateCommentData): Promise<Comment> {
        try {
            const workspaceId = await this.getWorkspaceId();
            const response = await api.post(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/comments`, data);
            return response.data;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }
}

const taskService = new TaskService();
export default taskService; 