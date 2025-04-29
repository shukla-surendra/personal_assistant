import { View, ViewProps, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';

interface ThemedViewProps extends ViewProps {
    type?: 'default' | 'card' | 'section';
}

export function ThemedView({ style, type = 'default', ...props }: ThemedViewProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const getViewStyle = () => {
        switch (type) {
            case 'card':
                return styles.card;
            case 'section':
                return styles.section;
            default:
                return styles.default;
        }
    };

    return (
        <View
            style={[
                getViewStyle(),
                {
                    backgroundColor: isDark ? '#1c1c1e' : '#fff',
                },
                style,
            ]}
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    default: {
        flex: 1,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    section: {
        padding: 16,
        marginVertical: 8,
    },
}); 