import { useEffect, useState } from 'react';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initI18n } from '../i18n';
import { useTheme } from '../hooks/useTheme';
import { trackEvent } from '../services/analytics';
import { hydrateAppearance } from '../services/appearance';
import { initPurchases } from '../services/purchases';
import { hydrateWeatherStore } from '../services/weatherPersistence';

// El splash nativo se mantiene hasta que estén listos idioma, unidades y apariencia: así la
// primera pantalla ya sale en el tema elegido, sin pasar por el del sistema.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Mapea el pathname de expo-router (sin el grupo (tabs)) al nombre de pantalla trackeado.
const SCREEN_NAMES: Record<string, string> = {
  '/': 'home',
  '/forecast': 'forecast',
  '/alerts': 'alerts',
  '/settings': 'settings',
};

function ScreenViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const screenName = SCREEN_NAMES[pathname] ?? pathname;
    trackEvent('screen_view', { screen_name: screenName });
  }, [pathname]);

  return null;
}

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);
  const { theme, isDark } = useTheme();

  useEffect(() => {
    // Las unidades, la apariencia y el último tiempo guardado se restauran antes del primer
    // render, para que el primer fetch ya use las unidades correctas, no haya parpadeo de tema
    // y Home se pinte sin pantalla de carga.
    Promise.all([initI18n(), hydrateWeatherStore(), hydrateAppearance()])
      .catch((e) => console.error('Error during app init:', e))
      .finally(() => {
        setI18nReady(true);
        trackEvent('app_opened');
        initPurchases();
      });
  }, []);

  useEffect(() => {
    if (i18nReady) SplashScreen.hideAsync().catch(() => {});
  }, [i18nReady]);

  if (!i18nReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {/* Explícito en vez de "auto": sigue también un claro/oscuro fijado en Ajustes */}
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenViewTracker />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }} />
    </SafeAreaProvider>
  );
}