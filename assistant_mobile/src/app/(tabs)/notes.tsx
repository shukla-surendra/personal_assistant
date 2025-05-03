import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import notesService, { Note } from '../../services/NotesService';

export default function NotesScreen() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const loadedNotes = await notesService.getNotes();
            setNotes(loadedNotes);
        } catch (error) {
            Alert.alert('Error', 'Failed to load notes');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadNotes();
    };

    const handleAddNote = async () => {
        if (!newNoteTitle.trim() || !newNoteContent.trim()) {
            Alert.alert('Error', 'Please enter both title and content');
            return;
        }

        try {
            const newNote = await notesService.addNote({
                title: newNoteTitle,
                content: newNoteContent,
            });
            setNotes([newNote, ...notes]);
            setNewNoteTitle('');
            setNewNoteContent('');
            setShowCreateModal(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to add note');
        }
    };

    const handleDeleteNote = async (id: string) => {
        try {
            await notesService.deleteNote(id);
            setNotes(notes.filter(note => note.id !== id));
        } catch (error) {
            Alert.alert('Error', 'Failed to delete note');
        }
    };

    const handleEditNote = async (updatedNote: Note) => {
        try {
            await notesService.updateNote(updatedNote);
            setNotes(notes.map(note => 
                note.id === updatedNote.id ? updatedNote : note
            ));
        } catch (error) {
            Alert.alert('Error', 'Failed to update note');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notes</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowCreateModal(true)}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text>Loading notes...</Text>
                </View>
            ) : notes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No notes yet</Text>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => setShowCreateModal(true)}
                    >
                        <Text style={styles.createButtonText}>Create your first note</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={notes}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.noteCard}>
                            <View style={styles.noteHeader}>
                                <Text style={styles.noteTitle}>{item.title}</Text>
                                <TouchableOpacity
                                    onPress={() => handleDeleteNote(item.id)}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.noteContent}>{item.content}</Text>
                            <Text style={styles.noteDate}>
                                {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                    contentContainerStyle={styles.notesList}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#007AFF']}
                            tintColor="#007AFF"
                        />
                    }
                />
            )}

            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create New Note</Text>
                            <TouchableOpacity
                                onPress={() => setShowCreateModal(false)}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.titleInput}
                            placeholder="Note Title"
                            value={newNoteTitle}
                            onChangeText={setNewNoteTitle}
                        />
                        <TextInput
                            style={styles.contentInput}
                            placeholder="Note Content"
                            value={newNoteContent}
                            onChangeText={setNewNoteContent}
                            multiline
                        />
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleAddNote}
                        >
                            <Text style={styles.saveButtonText}>Save Note</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        backgroundColor: '#007AFF',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    notesList: {
        padding: 16,
    },
    noteCard: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    noteTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    noteContent: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    noteDate: {
        fontSize: 12,
        color: '#999',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    titleInput: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        fontSize: 16,
    },
    contentInput: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 