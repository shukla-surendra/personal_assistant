import api from './api';

export interface Note {
    task_id: string;
    title: string;
    description: string;
    priority: string;
    task_type: string;
    status: string;
    completed: boolean;
    is_deleted: boolean;
    published: boolean;
    due_on: string | null;
    start_time: string;
    end_time: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

class NotesService {
    async getNotes(workspaceId: string): Promise<Note[]> {
        try {
            const response = await api.get(`/api/v1/workspaces/${workspaceId}/tasks`, {
                params: {
                    order: 'desc',
                    task_type: 'NOTE',
                    skip: 0,
                    page_size: 50
                }
            });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return []; // Return empty array if no notes found
            }
            throw new Error('Failed to fetch notes. Please try again later.');
        }
    }

    async getNote(noteId: string): Promise<Note> {
        try {
            const response = await api.get(`/api/v1/tasks/${noteId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('Note not found');
            }
            throw new Error('Failed to fetch note. Please try again later.');
        }
    }

    async createNote(data: { title: string; description: string; workspace_id: string }): Promise<Note> {
        try {
            const noteData = {
                ...data,
                task_type: 'NOTE',
                priority: 'high',
                status: 'todo',
                completed: false,
                is_deleted: false,
                published: false,
                start_time: new Date().toISOString(),
                end_time: new Date(Date.now() + 3600000).toISOString() // 1 hour later
            };
            const response = await api.post(`/api/v1/workspaces/${data.workspace_id}/tasks`, noteData);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 400) {
                throw new Error('Invalid note data. Please check your input.');
            }
            throw new Error('Failed to create note. Please try again later.');
        }
    }

    async updateNote(noteId: string, data: { title?: string; description?: string }): Promise<Note> {
        try {
            const response = await api.put(`/api/v1/tasks/${noteId}`, data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('Note not found');
            }
            throw new Error('Failed to update note. Please try again later.');
        }
    }

    async deleteNote(noteId: string): Promise<void> {
        try {
            await api.delete(`/api/v1/tasks/${noteId}`);
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('Note not found');
            }
            throw new Error('Failed to delete note. Please try again later.');
        }
    }
}

export default new NotesService(); 