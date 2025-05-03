import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
}

const NOTES_STORAGE_KEY = '@notes';

class NotesService {
    async getNotes(): Promise<Note[]> {
        try {
            const notesJson = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
            return notesJson ? JSON.parse(notesJson) : [];
        } catch (error) {
            console.error('Error getting notes:', error);
            return [];
        }
    }

    async addNote(note: Omit<Note, 'id' | 'createdAt'>): Promise<Note> {
        try {
            const notes = await this.getNotes();
            const newNote: Note = {
                ...note,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
            };
            const updatedNotes = [newNote, ...notes];
            await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
            return newNote;
        } catch (error) {
            console.error('Error adding note:', error);
            throw error;
        }
    }

    async deleteNote(id: string): Promise<void> {
        try {
            const notes = await this.getNotes();
            const updatedNotes = notes.filter(note => note.id !== id);
            await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
        } catch (error) {
            console.error('Error deleting note:', error);
            throw error;
        }
    }

    async updateNote(updatedNote: Note): Promise<void> {
        try {
            const notes = await this.getNotes();
            const updatedNotes = notes.map(note => 
                note.id === updatedNote.id ? updatedNote : note
            );
            await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
        } catch (error) {
            console.error('Error updating note:', error);
            throw error;
        }
    }
}

export default new NotesService(); 