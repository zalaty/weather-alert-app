import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { create } from 'zustand';

export type AppearancePreference = 'auto' | 'light' | 'dark';

const APPEARANCE_KEY = 'appearance';

interface AppearanceStore {
  preference: AppearancePreference;
}

export const useAppearanceStore = create<AppearanceStore>(() => ({ preference: 'auto' }));

function isAppearancePreference(value: string | null): value is AppearancePreference {
  return value === 'auto' || value === 'light' || value === 'dark';
}

function applyToNative(preference: AppearancePreference) {
  // null = 'unspecified': devuelve el control al sistema en vez de fijar claro u oscuro.
  // Al fijarlo también a nivel nativo, la barra de navegación, los diálogos del sistema y los
  // Modal siguen la misma apariencia que la UI.
  try {
    Appearance.setColorScheme(preference === 'auto' ? null : preference);
  } catch {
    // Sin módulo nativo (tests): useTheme sigue respetando la preferencia por sí mismo
  }
}

/** Se llama antes del primer render (app/_layout.tsx) para que no haya parpadeo al arrancar */
export async function hydrateAppearance(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(APPEARANCE_KEY);
    if (isAppearancePreference(saved) && saved !== 'auto') {
      applyToNative(saved);
      useAppearanceStore.setState({ preference: saved });
    }
  } catch {
    // Sin preferencia legible: se queda en automático
  }
}

export function setAppearancePreference(preference: AppearancePreference): void {
  applyToNative(preference);
  useAppearanceStore.setState({ preference });
  AsyncStorage.setItem(APPEARANCE_KEY, preference).catch(() => {});
}
