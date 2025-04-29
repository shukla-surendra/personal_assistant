import { Text, TextProps, StyleSheet, useColorScheme } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';

interface ThemedTextProps extends TextProps {
    type?: 'title' | 'subtitle' | 'default' | 'defaultSemiBold' | 'link';
}

export function ThemedText({ style, type = 'default', ...props }: ThemedTextProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const getTextStyle = () => {
        switch (type) {
            case 'title':
                return styles.title;
            case 'subtitle':
                return styles.subtitle;
            case 'defaultSemiBold':
                return styles.defaultSemiBold;
            case 'link':
                return styles.link;
            default:
                return styles.default;
        }
    };

    return (
        <Text
            style={[
                getTextStyle(),
                { color: isDark ? '#fff' : '#000' },
                style,
            ]}
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    default: {
        fontSize: 16,
    },
    defaultSemiBold: {
        fontSize: 16,
        fontWeight: '600',
    },
    link: {
        fontSize: 16,
        color: '#007AFF',
    },
});
