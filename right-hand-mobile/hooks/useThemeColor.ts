/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from 'react-native';

const lightColors = {
  background: '#FFFFFF',
  text: '#000000',
  primary: '#007AFF',
  secondary: '#F0F0F0',
  border: '#E5E5E5',
};

const darkColors = {
  background: '#000000',
  text: '#FFFFFF',
  primary: '#0A84FF',
  secondary: '#1C1C1E',
  border: '#38383A',
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof lightColors | keyof typeof darkColors
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return theme === 'light' ? lightColors[colorName] : darkColors[colorName];
}
