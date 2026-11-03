import { useEffect, useState } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initI18n } from '../i18n';
import { useTheme } from '../hooks/useTheme';
import { trackEvent } from '../services/analytics';
import { initPurchases } from '../services/purchases';
import { hydrateWeatherStore } from '../services/weatherPersistence';

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
  const { theme } = useTheme();

  useEffect(() => {
    // Las unidades y el último tiempo guardado se restauran antes del primer render, para que
    // el primer fetch ya use las unidades correctas y Home se pinte sin pantalla de carga.
    Promise.all([initI18n(), hydrateWeatherStore()]).then(() => {
      setI18nReady(true);
      trackEvent('app_opened');
      initPurchases();
    });
  }, []);

  if (!i18nReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <ScreenViewTracker />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }} />
    </SafeAreaProvider>
  );
}