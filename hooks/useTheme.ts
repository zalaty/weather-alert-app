import { useColorScheme } from 'react-native';
import { LightTheme, DarkTheme, Theme } from '../constants/theme';
import { useAppearanceStore } from '../services/appearance';

export function useTheme(): { theme: Theme; isDark: boolean } {
  const colorScheme = useColorScheme();
  const preference = useAppearanceStore((s) => s.preference);
  // La preferencia guardada manda; en "auto" se sigue al sistema. No depende solo de
  // useColorScheme() para que un claro/oscuro fijado no dependa del override nativo.
  const isDark = preference === 'auto' ? colorScheme === 'dark' : preference === 'dark';
  return {
    theme: isDark ? DarkTheme : LightTheme,
    isDark,
  };
}
