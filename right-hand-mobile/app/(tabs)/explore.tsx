import { StyleSheet } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import Collapsible from '../../components/Collapsible';

export default function ExploreScreen() {
    return (
        <ThemedView style={styles.container}>
            <ThemedView type="section">
                <ThemedText type="title">Features</ThemedText>
                <Collapsible title="AI Assistant">
                    <ThemedText>
                        Get instant help from our AI assistant for any task or question.
                    </ThemedText>
                </Collapsible>
                <Collapsible title="Task Management">
                    <ThemedText>
                        Create, organize, and track your tasks with ease.
                    </ThemedText>
                </Collapsible>
                <Collapsible title="Calendar Integration">
                    <ThemedText>
                        Sync your calendar and manage your schedule efficiently.
                    </ThemedText>
                </Collapsible>
            </ThemedView>

            <ThemedView type="section">
                <ThemedText type="title">Getting Started</ThemedText>
                <Collapsible title="First Steps">
                    <ThemedText>
                        1. Complete your profile
                        2. Set up your workspace
                        3. Connect your calendar
                    </ThemedText>
                </Collapsible>
                <Collapsible title="Tips & Tricks">
                    <ThemedText>
                        • Use the AI assistant for quick help
                        • Organize tasks by priority
                        • Set reminders for important events
                    </ThemedText>
                </Collapsible>
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
});
