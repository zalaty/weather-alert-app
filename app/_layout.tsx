import { useEffect, useState } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initI18n } from '../i18n';
import { trackEvent } from '../services/analytics';

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

  useEffect(() => {
    initI18n().then(() => {
      setI18nReady(true);
      trackEvent('app_opened');
    });
  }, []);

  if (!i18nReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ScreenViewTracker />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}