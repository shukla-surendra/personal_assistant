import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CollapsibleProps {
    title: string;
    children: React.ReactNode;
}

export default function Collapsible({ title, children }: CollapsibleProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [animation] = useState(new Animated.Value(0));

    const toggleCollapse = () => {
        setIsOpen(!isOpen);
        Animated.timing(animation, {
            toValue: isOpen ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const height = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={toggleCollapse}
                activeOpacity={0.8}
            >
                <Text style={styles.title}>{title}</Text>
                <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#666"
                />
            </TouchableOpacity>
            <Animated.View
                style={[
                    styles.content,
                    {
                        maxHeight: isOpen ? 'auto' : 0,
                        opacity: animation,
                    },
                ]}
            >
                {children}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
        borderRadius: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f8f8f8',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    content: {
        padding: 15,
    },
}); 