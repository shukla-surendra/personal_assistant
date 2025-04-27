import { View, type ViewProps, type ViewStyle, StyleSheet } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'section' | 'card' | 'userMessage' | 'aiMessage' | 'inputContainer';
};

export function ThemedView({ style, lightColor, darkColor, type = 'default', ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  
  const getTypeStyles = (): ViewStyle => {
    switch (type) {
      case 'userMessage':
        return {
          alignSelf: 'flex-end',
          backgroundColor: '#007AFF',
          borderRadius: 16,
          padding: 12,
          marginVertical: 4,
          maxWidth: '80%',
        };
      case 'aiMessage':
        return {
          alignSelf: 'flex-start',
          backgroundColor: '#F0F0F0',
          borderRadius: 16,
          padding: 12,
          marginVertical: 4,
          maxWidth: '80%',
        };
      case 'inputContainer':
        return {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
        };
      case 'section':
        return {
          backgroundColor: '#F8F8F8',
          borderRadius: 8,
          padding: 16,
        };
      case 'card':
        return {
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        };
      default:
        return {};
    }
  };

  return <View style={[getTypeStyles(), { backgroundColor }, style]} {...otherProps} />;
}
