import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function CalendarScreen() {
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, [selectedDate]);

    const loadEvents = async () => {
        try {
            const response = await api.get(`/api/v1/calendar/events?date=${selectedDate}`);
            setEvents(response.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const renderEvent = ({ item }) => (
        <View style={styles.eventItem}>
            <View style={styles.eventTime}>
                <Text style={styles.timeText}>
                    {new Date(item.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </Text>
                <Text style={styles.timeText}>
                    {new Date(item.end_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </Text>
            </View>
            <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                {item.description && (
                    <Text style={styles.eventDescription}>{item.description}</Text>
                )}
            </View>
        </View>
    );

    const markedDates = {
        [selectedDate]: {
            selected: true,
            marked: true,
            dotColor: '#007AFF',
        },
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Calendar
                onDayPress={(day) => setSelectedDate(day.dateString)}
                markedDates={markedDates}
                theme={{
                    selectedDayBackgroundColor: '#007AFF',
                    todayTextColor: '#007AFF',
                    dotColor: '#007AFF',
                    arrowColor: '#007AFF',
                }}
            />

            <View style={styles.eventsContainer}>
                <Text style={styles.sectionTitle}>
                    Events for {new Date(selectedDate).toLocaleDateString()}
                </Text>
                <FlatList
                    data={events}
                    renderItem={renderEvent}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.eventsList}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No events scheduled</Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventsContainer: {
        flex: 1,
        padding: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#000',
    },
    eventsList: {
        flexGrow: 1,
    },
    eventItem: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        marginBottom: 10,
    },
    eventTime: {
        width: 80,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: '#eee',
        marginRight: 15,
    },
    timeText: {
        fontSize: 14,
        color: '#666',
    },
    eventInfo: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    eventDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
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
    },
}); 