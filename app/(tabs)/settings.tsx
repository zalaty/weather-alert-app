import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius, Theme } from '../../constants/theme';
import {
  PLAY_STORE_APP_URL,
  PLAY_STORE_MARKET_URL,
  PLAY_SUBSCRIPTIONS_URL,
  PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
} from '../../constants/links';
import { useTheme } from '../../hooks/useTheme';
import { useIsPremium } from '../../hooks/useIsPremium';
import { useWeatherStore } from '../../store/weatherStore';
import {
  getLanguagePreference,
  LANGUAGE_NAMES,
  LanguagePreference,
  setAppLanguage,
  setAutomaticLanguage,
  SupportedLanguage,
} from '../../i18n';
import { getCustomerInfo, restorePurchases } from '../../services/purchases';
import { trackEvent } from '../../services/analytics';
import { isNotificationPermissionGranted } from '../../services/notifications';
import { AppearancePreference, setAppearancePreference, useAppearanceStore } from '../../services/appearance';
import type { Units } from '../../utils/units';
import Paywall from '../../components/Paywall';
import LanguageSheet from '../../components/LanguageSheet';
import SegmentedControl from '../../components/ui/SegmentedControl';

const APP_VERSION = Constants.expoConfig?.version ?? '';

async function openUrl(primary: string, fallback?: string): Promise<boolean> {
  try {
    await Linking.openURL(primary);
    return true;
  } catch {
    if (!fallback) return false;
    try {
      await Linking.openURL(fallback);
      return true;
    } catch {
      return false;
    }
  }
}

interface SettingsRowProps {
  label: string;
  value?: string;
  /** 'chevron' abre algo dentro de la app; 'external' sale de ella */
  trailing?: 'chevron' | 'external' | React.ReactNode;
  onPress: () => void;
  accessibilityHint?: string;
  disabled?: boolean;
  theme: Theme;
}

function SettingsRow({ label, value, trailing = 'chevron', onPress, accessibilityHint, disabled, theme }: SettingsRowProps) {
  const s = makeStyles(theme);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      android_ripple={{ color: theme.border }}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!disabled }}
    >
      <Text style={s.rowLabel}>{label}</Text>
      {value ? <Text style={s.rowValue}>{value}</Text> : null}
      {trailing === 'chevron' || trailing === 'external' ? (
        // Iconos vectoriales: "↗"/"›" como texto se pintan como emoji de color en Android
        <Ionicons
          name={trailing === 'external' ? 'open-outline' : 'chevron-forward'}
          size={18}
          color={theme.textSecondary}
          style={s.rowTrailing}
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
      ) : (
        trailing
      )}
    </Pressable>
  );
}

function SectionTitle({ title, theme }: { title: string; theme: Theme }) {
  const s = makeStyles(theme);
  return <Text style={s.sectionTitle} accessibilityRole="header">{title}</Text>;
}

export default function SettingsScreen() {
  const units = useWeatherStore((st) => st.units);
  const setUnits = useWeatherStore((st) => st.setUnits);
  const appearance = useAppearanceStore((st) => st.preference);
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const isPremium = useIsPremium();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);
  const [languagePreference, setLanguagePreferenceState] = useState<LanguagePreference>(getLanguagePreference);
  const [notificationsGranted, setNotificationsGranted] = useState<boolean | null>(null);
  const [restoring, setRestoring] = useState(false);
  const s = makeStyles(theme);

  // Estado del permiso al entrar en la pantalla y al volver a la app (p. ej. desde los ajustes del sistema)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const check = () => {
        isNotificationPermissionGranted()
          .then((granted) => {
            if (!cancelled) setNotificationsGranted(granted);
          })
          .catch(() => {});
      };
      check();
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') check();
      });
      return () => {
        cancelled = true;
        sub.remove();
      };
    }, [])
  );

  const handleUnitsChange = (value: Units) => {
    setUnits(value);
    trackEvent('settings_changed', { setting: 'units', value });
  };

  const handleAppearanceChange = (value: AppearancePreference) => {
    setAppearancePreference(value);
    trackEvent('settings_changed', { setting: 'appearance', value });
  };

  // language_changed (emitido en i18n/index.ts) ya cuenta este cambio: no se duplica con settings_changed
  const handleLanguageSelect = (preference: LanguagePreference) => {
    setLanguageSheetVisible(false);
    if (preference === languagePreference) return;
    setLanguagePreferenceState(preference);
    if (preference === 'auto') setAutomaticLanguage();
    else setAppLanguage(preference);
  };

  const handleManageSubscription = async () => {
    const customerInfo = await getCustomerInfo();
    const fallback = Platform.OS === 'ios' ? 'https://apps.apple.com/account/subscriptions' : PLAY_SUBSCRIPTIONS_URL;
    await openUrl(customerInfo?.managementURL ?? fallback, fallback);
  };

  const handleRateApp = async () => {
    trackEvent('rate_app_tapped');
    if (Platform.OS === 'android') await openUrl(PLAY_STORE_MARKET_URL, PLAY_STORE_APP_URL);
    else await openUrl(PLAY_STORE_APP_URL);
  };

  const handleFeedback = async () => {
    trackEvent('feedback_tapped');
    const deviceInfo = [
      `Avisa ${APP_VERSION}`,
      [Device.osName, Device.osVersion].filter(Boolean).join(' '),
      Device.modelName,
    ]
      .filter(Boolean)
      .join('\n');
    const subject = t('settings.help.feedbackSubject');
    const body = `${t('settings.help.feedbackBody')}\n\n\n---\n${deviceInfo}`;
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const opened = await openUrl(url);
    if (!opened) {
      Alert.alert(t('settings.help.noMailTitle'), t('settings.help.noMailBody', { email: SUPPORT_EMAIL }));
    }
  };

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

  const languageValue =
    languagePreference === 'auto'
      ? `${t('settings.language.automatic')} · ${LANGUAGE_NAMES[i18n.language as SupportedLanguage] ?? ''}`
      : LANGUAGE_NAMES[languagePreference];

  const notificationsValue =
    notificationsGranted == null ? '' : t(notificationsGranted ? 'settings.notifications.on' : 'settings.notifications.off');

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.screenTitle} accessibilityRole="header">{t('settings.title')}</Text>

        {isPremium ? (
          <View style={s.card}>
            <SettingsRow
              theme={theme}
              label={t('settings.premiumActive.title')}
              value={t('settings.premiumActive.manage')}
              trailing="external"
              onPress={handleManageSubscription}
              accessibilityHint={t('settings.a11y.opensOutside')}
            />
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [s.premiumBanner, pressed && s.rowPressed]}
            onPress={() => setPaywallVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`${t('settings.premiumBanner.title')}. ${t('settings.premiumBanner.description')}`}
          >
            <Text style={s.premiumEmoji} importantForAccessibility="no">💎</Text>
            <View style={s.premiumText}>
              <Text style={s.premiumTitle}>{t('settings.premiumBanner.title')}</Text>
              <Text style={s.premiumDescription}>{t('settings.premiumBanner.description')}</Text>
            </View>
            <Text style={s.premiumCta}>{t('settings.premiumBanner.cta')}</Text>
          </Pressable>
        )}

        <View style={s.section}>
          <SectionTitle theme={theme} title={t('settings.sections.preferences')} />
          <View style={s.card}>
            <View style={s.controlBlock}>
              <Text style={s.controlLabel}>{t('settings.units.label')}</Text>
              <SegmentedControl<Units>
                accessibilityLabel={t('settings.units.label')}
                value={units}
                onChange={handleUnitsChange}
                options={[
                  { value: 'metric', label: '°C · km/h', accessibilityLabel: t('settings.units.metricA11y') },
                  { value: 'us', label: '°F · mph', accessibilityLabel: t('settings.units.imperialA11y') },
                ]}
              />
            </View>
            <View style={s.divider} />
            <SettingsRow
              theme={theme}
              label={t('settings.language.label')}
              value={languageValue}
              onPress={() => setLanguageSheetVisible(true)}
            />
            <View style={s.divider} />
            <View style={s.controlBlock}>
              <Text style={s.controlLabel}>{t('settings.appearance.label')}</Text>
              <SegmentedControl<AppearancePreference>
                accessibilityLabel={t('settings.appearance.label')}
                value={appearance}
                onChange={handleAppearanceChange}
                options={[
                  { value: 'auto', label: t('settings.appearance.auto') },
                  { value: 'light', label: t('settings.appearance.light') },
                  { value: 'dark', label: t('settings.appearance.dark') },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={s.section}>
          <SectionTitle theme={theme} title={t('settings.sections.notifications')} />
          <View style={s.card}>
            <SettingsRow
              theme={theme}
              label={t('settings.notifications.label')}
              value={notificationsValue}
              trailing="external"
              onPress={() => Linking.openSettings()}
              accessibilityHint={t('settings.notifications.hint')}
            />
          </View>
        </View>

        <View style={s.section}>
          <SectionTitle theme={theme} title={t('settings.sections.help')} />
          <View style={s.card}>
            <SettingsRow theme={theme} label={t('settings.help.rate')} trailing="external" onPress={handleRateApp} accessibilityHint={t('settings.a11y.opensOutside')} />
            <View style={s.divider} />
            <SettingsRow theme={theme} label={t('settings.help.feedback')} trailing="external" onPress={handleFeedback} accessibilityHint={t('settings.a11y.opensOutside')} />
            <View style={s.divider} />
            <SettingsRow theme={theme} label={t('settings.help.privacy')} trailing="external" onPress={() => openUrl(PRIVACY_POLICY_URL)} accessibilityHint={t('settings.a11y.opensOutside')} />
            {!isPremium && (
              <>
                <View style={s.divider} />
                <SettingsRow
                  theme={theme}
                  label={t('settings.help.restore')}
                  onPress={handleRestore}
                  disabled={restoring}
                  trailing={restoring ? <ActivityIndicator size="small" color={theme.textSecondary} /> : 'chevron'}
                />
              </>
            )}
          </View>
        </View>

        <Text style={s.footer}>{t('settings.footer', { version: APP_VERSION })}</Text>
      </ScrollView>

      <Paywall visible={paywallVisible} source="settings_banner" onClose={() => setPaywallVisible(false)} />
      <LanguageSheet
        visible={languageSheetVisible}
        preference={languagePreference}
        onSelect={handleLanguageSelect}
        onClose={() => setLanguageSheetVisible(false)}
      />
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
    row: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: Spacing.sm,
    },
    rowPressed: { opacity: 0.6 },
    rowLabel: { flexGrow: 1, flexShrink: 1, fontSize: Typography.md, fontWeight: Typography.medium, color: theme.textPrimary },
    // Etiqueta y valor encogen y saltan de línea por dentro: un texto largo (de, pl) no se recorta
    rowValue: { flexShrink: 1, maxWidth: '55%', fontSize: Typography.sm, color: theme.textSecondary, textAlign: 'right' },
    rowTrailing: { width: 18, textAlign: 'center' },
    controlBlock: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
    controlLabel: { fontSize: Typography.md, fontWeight: Typography.medium, color: theme.textPrimary },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginHorizontal: Spacing.md },
    premiumBanner: { minHeight: 48, backgroundColor: theme.card, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: theme.storm },
    premiumEmoji: { fontSize: Typography.xxl },
    premiumText: { flex: 1, gap: 2 },
    premiumTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: theme.textPrimary },
    premiumDescription: { fontSize: Typography.xs, color: theme.textSecondary },
    premiumCta: { flexShrink: 1, maxWidth: '35%', fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.textPrimary, textAlign: 'right' },
    footer: { fontSize: Typography.xs, color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.md },
  });
}
