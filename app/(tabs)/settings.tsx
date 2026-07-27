import { useState } from 'react';
import { ActivityIndicator, Alert, View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius, Theme } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useIsPremium } from '../../hooks/useIsPremium';
import { useWeatherStore } from '../../store/weatherStore';
import { setAppLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../../i18n';
import { restorePurchases } from '../../services/purchases';
import { trackEvent } from '../../services/analytics';
import Paywall from '../../components/Paywall';

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  es: 'Español',
  'es-419': 'Español (Latinoamérica)',
  en: 'English',
  'pt-BR': 'Português (Brasil)',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pl: 'Polski',
  tr: 'Türkçe',
};

interface SettingRowProps {
  label: string;
  description?: string;
  right: React.ReactNode;
  theme: Theme;
}

function SettingRow({ label, description, right, theme }: SettingRowProps) {
  const s = makeStyles(theme);
  return (
    <View style={s.row}>
      <View style={s.rowLeft}>
        <Text style={s.rowLabel}>{label}</Text>
        {description && <Text style={s.rowDescription}>{description}</Text>}
      </View>
      {right}
    </View>
  );
}

export default function SettingsScreen() {
  const { units, toggleUnits } = useWeatherStore();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const isPremium = useIsPremium();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const isMetric = units === 'metric';
  const s = makeStyles(theme);

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);

    if (result.status === 'success') {
      trackEvent('purchases_restored', { found_active: result.isPremium });
      if (result.isPremium) {
        Alert.alert(t('settings.premiumBanner.restoreSuccessTitle'), t('settings.premiumBanner.restoreSuccessBody'));
      } else {
        Alert.alert(t('settings.premiumBanner.restoreNoneTitle'), t('settings.premiumBanner.restoreNoneBody'));
      }
    } else {
      Alert.alert(t('settings.premiumBanner.restoreErrorTitle'), t('settings.premiumBanner.restoreErrorBody'));
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.screenTitle}>{t('settings.title')}</Text>

        {!isPremium && (
          <TouchableOpacity style={s.premiumBanner} onPress={() => setPaywallVisible(true)}>
            <Text style={s.premiumEmoji}>💎</Text>
            <View style={s.premiumText}>
              <Text style={s.premiumTitle}>{t('settings.premiumBanner.title')}</Text>
              <Text style={s.premiumDescription}>{t('settings.premiumBanner.description')}</Text>
            </View>
            <Text style={s.premiumCta}>{t('settings.premiumBanner.cta')}</Text>
          </TouchableOpacity>
        )}

        {!isPremium && (
          <TouchableOpacity style={s.restoreBtn} onPress={handleRestore} disabled={restoring}>
            {restoring ? (
              <ActivityIndicator size="small" color={theme.textSecondary} />
            ) : (
              <Text style={s.restoreBtnText}>{t('settings.premiumBanner.restoreCta')}</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('settings.units.sectionTitle')}</Text>
          <View style={s.card}>
            <SettingRow
              theme={theme}
              label={t('settings.units.metricLabel')}
              description={isMetric ? '°C · km/h · mm' : '°F · mph · in'}
              right={
                <Switch
                  value={isMetric}
                  onValueChange={toggleUnits}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor={theme.card}
                />
              }
            />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('settings.temperature.sectionTitle')}</Text>
          <View style={s.card}>
            <View style={s.segmented}>
              <TouchableOpacity
                style={[s.segment, isMetric && s.segmentActive]}
                onPress={() => !isMetric && toggleUnits()}
              >
                <Text style={[s.segmentText, isMetric && s.segmentTextActive]}>{t('settings.temperature.celsius')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.segment, !isMetric && s.segmentActive]}
                onPress={() => isMetric && toggleUnits()}
              >
                <Text style={[s.segmentText, !isMetric && s.segmentTextActive]}>{t('settings.temperature.fahrenheit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('settings.language.sectionTitle')}</Text>
          <View style={s.card}>
            <View style={s.segmented}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isActive = i18n.language === lang;
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[s.segment, isActive && s.segmentActive]}
                    onPress={() => !isActive && setAppLanguage(lang)}
                  >
                    <Text style={[s.segmentText, isActive && s.segmentTextActive]}>{LANGUAGE_NAMES[lang]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('settings.about.sectionTitle')}</Text>
          <View style={s.card}>
            <SettingRow theme={theme} label={t('settings.about.appLabel')} description={t('settings.about.version', { version: Constants.expoConfig?.version })} right={<Text style={s.rowValue}>☀️</Text>} />
            <View style={s.divider} />
            <SettingRow theme={theme} label={t('settings.about.weatherDataLabel')} description={t('settings.about.weatherDataProvider')} right={<Text style={s.rowValue}>🔌</Text>} />
            <View style={s.divider} />
            <SettingRow theme={theme} label={t('settings.about.autoUpdateLabel')} description={t('settings.about.autoUpdateDescription')} right={<Text style={s.rowValue}>🔄</Text>} />
          </View>
        </View>
      </ScrollView>

      <Paywall visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { flexGrow: 1, padding: Spacing.md, gap: Spacing.lg },
    screenTitle: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: theme.textPrimary },
    section: { gap: Spacing.sm },
    sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: Spacing.xs },
    card: { backgroundColor: theme.card, borderRadius: Radius.lg, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
    rowLeft: { flex: 1, gap: 2 },
    rowLabel: { fontSize: Typography.md, fontWeight: Typography.medium, color: theme.textPrimary },
    rowDescription: { fontSize: Typography.sm, color: theme.textSecondary },
    rowValue: { fontSize: Typography.lg },
    divider: { height: 1, backgroundColor: theme.border, marginHorizontal: Spacing.md },
    segmented: { flexDirection: 'column' },
    segment: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
    segmentActive: { backgroundColor: `${theme.accent}15` },
    segmentText: { fontSize: Typography.md, color: theme.textSecondary, fontWeight: Typography.medium },
    segmentTextActive: { color: theme.accent, fontWeight: Typography.semibold },
    premiumBanner: { backgroundColor: theme.card, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: theme.storm },
    premiumEmoji: { fontSize: Typography.xxl },
    premiumText: { flex: 1, gap: 2 },
    premiumTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: theme.textPrimary },
    premiumDescription: { fontSize: Typography.xs, color: theme.textSecondary },
    premiumCta: { fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.storm },
    restoreBtn: { alignItems: 'center', paddingVertical: Spacing.xs },
    restoreBtnText: { fontSize: Typography.sm, color: theme.textSecondary, fontWeight: Typography.medium },
  });
}