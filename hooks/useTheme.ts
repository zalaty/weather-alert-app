import { useColorScheme } from 'react-native';
import { LightTheme, DarkTheme, Theme } from '../constants/theme';

export function useTheme(): { theme: Theme; isDark: boolean } {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return {
    theme: isDark ? DarkTheme : LightTheme,
    isDark,
  };
}