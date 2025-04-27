import { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
}

export default function ChatScreen() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');

    const handleSend = () => {
        if (inputText.trim()) {
            const newMessage: Message = {
                id: Date.now().toString(),
                text: inputText,
                isUser: true,
            };
            setMessages([...messages, newMessage]);
            setInputText('');
            // TODO: Add AI response logic
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView style={styles.messagesContainer}>
                {messages.map((message) => (
                    <ThemedView
                        key={message.id}
                        type={message.isUser ? 'userMessage' : 'aiMessage'}
                        style={styles.messageBubble}
                    >
                        <ThemedText>{message.text}</ThemedText>
                    </ThemedView>
                ))}
            </ScrollView>

            <ThemedView type="inputContainer" style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type your message..."
                    placeholderTextColor="#666"
                />
                <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                    <Ionicons name="send" size={24} color="#007AFF" />
                </TouchableOpacity>
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
        padding: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 20,
        paddingHorizontal: 16,
        marginRight: 8,
    },
    sendButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
    },
}); 