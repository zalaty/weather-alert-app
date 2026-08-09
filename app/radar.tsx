import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing, Theme } from '../constants/theme';
import { buildRadarHtml } from '../services/radarHtml';

export default function RadarScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { lat, lon } = useLocalSearchParams<{ lat: string; lon: string }>();
  const s = makeStyles(theme);

  const latitude = parseFloat(lat ?? '');
  const longitude = parseFloat(lon ?? '');
  const hasValidLocation = !Number.isNaN(latitude) && !Number.isNaN(longitude);

  const html = useMemo(() => {
    if (!hasValidLocation) return '';
    return buildRadarHtml(latitude, longitude, {
      loading: t('weatherDetails.radar.loading'),
      loadError: t('weatherDetails.radar.loadError'),
    });
  }, [hasValidLocation, latitude, longitude, t]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton} hitSlop={8}>
          <Text style={s.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t('weatherDetails.radar.screenTitle')}</Text>
        <View style={s.backButton} />
      </View>

      {hasValidLocation ? (
        <WebView
          key={`${latitude}-${longitude}`}
          style={s.webview}
          source={{ html }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          mixedContentMode="always"
          renderLoading={() => (
            <View style={s.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.accent} />
            </View>
          )}
        />
      ) : (
        <View style={s.loadingOverlay}>
          <Text style={s.errorText}>{t('weatherDetails.radar.loadError')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    backButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    backButtonText: { fontSize: Typography.xl, color: theme.textPrimary },
    title: { fontSize: Typography.md, fontWeight: Typography.semibold, color: theme.textPrimary },
    webview: { flex: 1 },
    loadingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    errorText: { fontSize: Typography.md, color: theme.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
  });
}
