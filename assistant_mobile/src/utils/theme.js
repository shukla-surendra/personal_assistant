import { useColorScheme } from 'react-native';

export const lightColors = {
    primary: '#007AFF',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    border: '#f0f0f0',
    notification: '#ff3b30',
    error: '#ff3b30',
    success: '#34C759',
    gray: '#666666',
    lightGray: '#f8f8f8',
};

export const darkColors = {
    primary: '#0A84FF',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    border: '#38383A',
    notification: '#FF453A',
    error: '#FF453A',
    success: '#32D74B',
    gray: '#8E8E93',
    lightGray: '#2C2C2E',
};

export const useTheme = () => {
    const colorScheme = useColorScheme();
    return colorScheme === 'dark' ? darkColors : lightColors;
}; 