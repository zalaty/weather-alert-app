import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius, Theme } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useWeatherStore } from '../../store/weatherStore';
import { setAppLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../../i18n';

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  es: 'Español',
  'es-419': 'Español (Latinoamérica)',
  en: 'English',
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
  const isMetric = units === 'metric';
  const s = makeStyles(theme);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <Text style={s.screenTitle}>{t('settings.title')}</Text>

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
            <SettingRow theme={theme} label={t('settings.about.appLabel')} description={t('settings.about.version', { version: '1.0.0' })} right={<Text style={s.rowValue}>☀️</Text>} />
            <View style={s.divider} />
            <SettingRow theme={theme} label={t('settings.about.weatherDataLabel')} description={t('settings.about.weatherDataProvider')} right={<Text style={s.rowValue}>🔌</Text>} />
            <View style={s.divider} />
            <SettingRow theme={theme} label={t('settings.about.autoUpdateLabel')} description={t('settings.about.autoUpdateDescription')} right={<Text style={s.rowValue}>🔄</Text>} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { flex: 1, padding: Spacing.md, gap: Spacing.lg },
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
  });
}