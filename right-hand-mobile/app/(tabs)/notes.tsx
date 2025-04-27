import React, { useState, useEffect } from 'react';
import {
    View,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    TextInput,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { ThemedText } from '../../src/components/ThemedText';
import { ThemedView } from '../../src/components/ThemedView';
import NotesService, { Note } from '../../src/services/NotesService';
import Config from '../../src/utils/config';
import { Ionicons } from '@expo/vector-icons';

export default function NotesScreen() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', description: '' });
    const [workspaceId, setWorkspaceId] = useState<string>('');

    useEffect(() => {
        loadWorkspaceAndNotes();
    }, []);

    const loadWorkspaceAndNotes = async () => {
        try {
            setLoading(true);
            setError(null);
            const workspace = await Config.getDefaultWorkspace();
            if (!workspace?.workspace_id) {
                throw new Error('No workspace found');
            }
            setWorkspaceId(workspace.workspace_id);
            const fetchedNotes = await NotesService.getNotes(workspace.workspace_id);
            setNotes(fetchedNotes);
        } catch (error) {
            console.error('Error loading notes:', error);
            setError('Failed to load notes. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNote = async () => {
        if (!newNote.title.trim() || !newNote.description.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            const createdNote = await NotesService.createNote({
                ...newNote,
                workspace_id: workspaceId,
            });
            setNotes([createdNote, ...notes]);
            setModalVisible(false);
            setNewNote({ title: '', description: '' });
        } catch (error) {
            console.error('Error creating note:', error);
            Alert.alert('Error', 'Failed to create note. Please try again.');
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            await NotesService.deleteNote(noteId);
            setNotes(notes.filter(note => note.task_id !== noteId));
        } catch (error) {
            console.error('Error deleting note:', error);
            Alert.alert('Error', 'Failed to delete note. Please try again.');
        }
    };

    const renderNote = ({ item }: { item: Note }) => (
        <ThemedView type="card" style={styles.noteCard}>
            <View style={styles.noteHeader}>
                <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                <TouchableOpacity onPress={() => handleDeleteNote(item.task_id)}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
            </View>
            <ThemedText style={styles.noteContent}>{item.description}</ThemedText>
            <View style={styles.noteFooter}>
                <ThemedText style={styles.noteDate}>
                    {new Date(item.updated_at).toLocaleDateString()}
                </ThemedText>
                <View style={styles.noteStatus}>
                    <ThemedText style={styles.statusText}>{item.status}</ThemedText>
                </View>
            </View>
        </ThemedView>
    );

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
            </ThemedView>
        );
    }

    if (error) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.errorText}>{error}</ThemedText>
                <TouchableOpacity style={styles.retryButton} onPress={loadWorkspaceAndNotes}>
                    <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <FlatList
                data={notes}
                renderItem={renderNote}
                keyExtractor={item => item.task_id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <ThemedView style={styles.emptyContainer}>
                        <ThemedText>No notes yet. Create your first note!</ThemedText>
                    </ThemedView>
                }
            />

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <ThemedView type="card" style={styles.modalContent}>
                        <ThemedText type="title" style={styles.modalTitle}>New Note</ThemedText>
                        
                        <TextInput
                            style={styles.input}
                            placeholder="Title"
                            value={newNote.title}
                            onChangeText={text => setNewNote({ ...newNote, title: text })}
                        />
                        
                        <TextInput
                            style={[styles.input, styles.contentInput]}
                            placeholder="Description"
                            value={newNote.description}
                            onChangeText={text => setNewNote({ ...newNote, description: text })}
                            multiline
                            numberOfLines={4}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalButton, styles.createButton]}
                                onPress={handleCreateNote}
                            >
                                <ThemedText style={styles.buttonText}>Create</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </ThemedView>
                </View>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContainer: {
        padding: 16,
    },
    noteCard: {
        marginBottom: 16,
        padding: 16,
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    noteContent: {
        marginBottom: 8,
    },
    noteFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    noteDate: {
        fontSize: 12,
        color: '#666',
    },
    noteStatus: {
        backgroundColor: '#E5E5EA',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        color: '#666',
    },
    addButton: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        padding: 20,
        borderRadius: 10,
    },
    modalTitle: {
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    contentInput: {
        height: 120,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#E5E5EA',
    },
    createButton: {
        backgroundColor: '#007AFF',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        alignSelf: 'center',
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
}); 