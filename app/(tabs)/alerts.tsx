import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView,
} from 'react-native';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius, Theme } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useIsPremium } from '../../hooks/useIsPremium';
import { useWeatherStore } from '../../store/weatherStore';
import { trackEvent } from '../../services/analytics';
import {
  AlertType, loadActiveAlerts, saveActiveAlerts,
  DoNotDisturbConfig, DEFAULT_DO_NOT_DISTURB, loadDoNotDisturb, saveDoNotDisturb,
} from '../../services/alertsStorage';
import { AlertHistoryEntry, loadAlertHistory } from '../../services/alertHistoryStorage';
import { evaluateAlert, notifyTriggeredAlerts } from '../../services/alertEngine';
import { ALERT_TYPES } from '../../constants/alertTypes';
import Paywall from '../../components/Paywall';
import AlertHistorySheet from '../../components/AlertHistorySheet';

function alertLabel(id: AlertType, t: TFunction): string {
  return t(`alerts.types.${id}.label`);
}

function alertDescription(id: AlertType, t: TFunction): string {
  return t(`alerts.types.${id}.description`);
}

export default function AlertsScreen() {
  const { weatherData } = useWeatherStore();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isPremium = useIsPremium();
  const [activeAlerts, setActiveAlerts] = useState<AlertType[]>([]);
  const [thresholds, setThresholds] = useState<Record<AlertType, number>>({ rain: 70, wind: 40, temp_low: 5, temp_high: 35 });
  const [dnd, setDnd] = useState<DoNotDisturbConfig>(DEFAULT_DO_NOT_DISTURB);
  const [loaded, setLoaded] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const savedAlerts = await loadActiveAlerts();
        const savedThresholds = await AsyncStorage.getItem('thresholds');
        const savedDnd = await loadDoNotDisturb();
        setActiveAlerts(savedAlerts);
        if (savedThresholds) setThresholds(JSON.parse(savedThresholds));
        setDnd(savedDnd);
      } catch (e) {
        console.error('Error loading alerts:', e);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    async function save() {
      try {
        await saveActiveAlerts(activeAlerts);
        await AsyncStorage.setItem('thresholds', JSON.stringify(thresholds));
        await saveDoNotDisturb(dnd);
      } catch (e) {
        console.error('Error saving alerts:', e);
      }
    }
    save();
  }, [activeAlerts, thresholds, dnd, loaded]);

  const openHistory = () => {
    loadAlertHistory().then(setHistory);
    setHistoryVisible(true);
  };

  const openPaywallFromHistory = () => {
    setHistoryVisible(false);
    setPaywallVisible(true);
  };

  const adjustDndHour = (edge: 'startHour' | 'endHour', delta: number) => {
    setDnd((prev) => ({ ...prev, [edge]: (prev[edge] + delta + 24) % 24 }));
  };

  // Free tier: solo 1 alerta activa a la vez. Con Premium no hay límite.
  const isFreeTierFull = (type: AlertType) =>
    !isPremium && activeAlerts.length > 0 && !activeAlerts.includes(type);

  const toggleAlert = (type: AlertType) => {
    if (activeAlerts.includes(type)) {
      setActiveAlerts((prev) => prev.filter((t) => t !== type));
      return;
    }
    if (!isPremium && activeAlerts.length >= 1) {
      trackEvent('alert_limit_reached', { attempted_alert_type: type });
      setPaywallVisible(true);
      return;
    }
    setActiveAlerts((prev) => [...prev, type]);
    trackEvent('alert_created', { alert_type: type, threshold: thresholds[type] });
    triggerNotificationIfNeeded(type);
  };

  const adjustThreshold = (type: AlertType, delta: number) => {
    const alert = ALERT_TYPES.find((a) => a.id === type)!;
    setThresholds((prev) => ({
      ...prev,
      [type]: Math.min(alert.max, Math.max(alert.min, prev[type] + delta)),
    }));
  };

  const checkAlert = (type: AlertType): boolean => {
    if (!weatherData || !activeAlerts.includes(type)) return false;
    return evaluateAlert(type, thresholds[type], weatherData.current).triggered;
  };

  const triggerNotificationIfNeeded = async (type: AlertType) => {
    if (!weatherData) return;
    const evaluation = evaluateAlert(type, thresholds[type], weatherData.current);
    if (!evaluation.triggered) return;
    // Feedback instantáneo de una acción directa del usuario: ignora la franja "no molestar"
    // a propósito (a diferencia del chequeo periódico en hooks/useWeather.ts).
    await notifyTriggeredAlerts([evaluation], { respectDoNotDisturb: false });
  };

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.screenTitle}>{t('alerts.title')}</Text>
        <Text style={s.subtitle}>{isPremium ? t('alerts.premiumTierSubtitle') : t('alerts.freeTierSubtitle')}</Text>

        {ALERT_TYPES.map((alert) => {
          const isActive = activeAlerts.includes(alert.id);
          const isLocked = isFreeTierFull(alert.id);
          const isTriggered = checkAlert(alert.id);

          return (
            <View key={alert.id} style={[s.alertCard, isActive && s.alertCardActive, isTriggered && s.alertCardTriggered, isLocked && s.alertCardLocked]}>
              <View style={s.alertHeader}>
                <Text style={s.alertEmoji}>{alert.emoji}</Text>
                <View style={s.alertInfo}>
                  <Text style={[s.alertLabel, isLocked && s.textLocked]}>{alertLabel(alert.id, t)}</Text>
                  <Text style={[s.alertDescription, isLocked && s.textLocked]}>
                    {alertDescription(alert.id, t)} {thresholds[alert.id]}{alert.unit}
                  </Text>
                </View>
                {isLocked ? (
                  <TouchableOpacity onPress={() => toggleAlert(alert.id)}>
                    <Text style={s.lockIcon}>🔒</Text>
                  </TouchableOpacity>
                ) : (
                  <Switch
                    value={isActive}
                    onValueChange={() => toggleAlert(alert.id)}
                    trackColor={{ false: theme.border, true: theme.accent }}
                    thumbColor={theme.card}
                  />
                )}
              </View>

              {isActive && (
                <View style={s.thresholdRow}>
                  <TouchableOpacity style={s.thresholdBtn} onPress={() => adjustThreshold(alert.id, -alert.step)}>
                    <Text style={s.thresholdBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.thresholdValue}>{thresholds[alert.id]}{alert.unit}</Text>
                  <TouchableOpacity style={s.thresholdBtn} onPress={() => adjustThreshold(alert.id, alert.step)}>
                    <Text style={s.thresholdBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isTriggered && (
                <View style={s.triggeredBanner}>
                  <Text style={s.triggeredText}>{t('alerts.conditionActive')}</Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={s.dndCard}>
          <View style={s.dndHeader}>
            <View style={s.dndInfo}>
              <Text style={s.dndTitle}>{t('alerts.doNotDisturb.sectionTitle')}</Text>
              <Text style={s.dndDescription}>{t('alerts.doNotDisturb.description')}</Text>
            </View>
            <Switch
              value={dnd.enabled}
              onValueChange={(enabled) => setDnd((prev) => ({ ...prev, enabled }))}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={theme.card}
            />
          </View>

          {dnd.enabled && (
            <View style={s.dndTimeRow}>
              <View style={s.dndTimeCol}>
                <Text style={s.dndTimeLabel}>{t('alerts.doNotDisturb.from')}</Text>
                <View style={s.dndStepper}>
                  <TouchableOpacity style={s.thresholdBtn} onPress={() => adjustDndHour('startHour', -1)}>
                    <Text style={s.thresholdBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.dndTimeValue}>{String(dnd.startHour).padStart(2, '0')}:00</Text>
                  <TouchableOpacity style={s.thresholdBtn} onPress={() => adjustDndHour('startHour', 1)}>
                    <Text style={s.thresholdBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={s.dndTimeCol}>
                <Text style={s.dndTimeLabel}>{t('alerts.doNotDisturb.to')}</Text>
                <View style={s.dndStepper}>
                  <TouchableOpacity style={s.thresholdBtn} onPress={() => adjustDndHour('endHour', -1)}>
                    <Text style={s.thresholdBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.dndTimeValue}>{String(dnd.endHour).padStart(2, '0')}:00</Text>
                  <TouchableOpacity style={s.thresholdBtn} onPress={() => adjustDndHour('endHour', 1)}>
                    <Text style={s.thresholdBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity style={s.historyBtn} onPress={openHistory}>
          <Text style={s.historyBtnIcon}>🕘</Text>
          <Text style={s.historyBtnText}>{t('alerts.history.viewButton')}</Text>
        </TouchableOpacity>

        {!isPremium && (
          <View style={s.premiumBanner}>
            <Text style={s.premiumEmoji}>💎</Text>
            <View style={s.premiumText}>
              <Text style={s.premiumTitle}>{t('alerts.premium.title')}</Text>
              <Text style={s.premiumDescription}>{t('alerts.premium.description')}</Text>
            </View>
            <TouchableOpacity style={s.premiumBtn} onPress={() => setPaywallVisible(true)}>
              <Text style={s.premiumBtnText}>{t('alerts.premium.price')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AlertHistorySheet
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        history={history}
        isPremium={isPremium}
        onUpgradePress={openPaywallFromHistory}
      />
      <Paywall visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { padding: Spacing.md, gap: Spacing.md },
    screenTitle: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: theme.textPrimary },
    subtitle: { fontSize: Typography.sm, color: theme.textSecondary, marginTop: -Spacing.sm },
    alertCard: { backgroundColor: theme.card, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm, borderWidth: 2, borderColor: 'transparent' },
    alertCardActive: { borderColor: theme.accent },
    alertCardTriggered: { borderColor: theme.storm },
    alertCardLocked: { opacity: 0.5 },
    alertHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    alertEmoji: { fontSize: Typography.xxl },
    alertInfo: { flex: 1, gap: 2 },
    alertLabel: { fontSize: Typography.md, fontWeight: Typography.semibold, color: theme.textPrimary },
    alertDescription: { fontSize: Typography.sm, color: theme.textSecondary },
    textLocked: { color: theme.textSecondary },
    lockIcon: { fontSize: Typography.lg },
    thresholdRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: theme.border },
    thresholdBtn: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' },
    thresholdBtnText: { fontSize: Typography.xl, color: theme.textLight, fontWeight: Typography.bold, lineHeight: 24 },
    thresholdValue: { fontSize: Typography.xl, fontWeight: Typography.bold, color: theme.textPrimary, minWidth: 80, textAlign: 'center' },
    triggeredBanner: { backgroundColor: `${theme.storm}20`, borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center' },
    triggeredText: { fontSize: Typography.sm, color: theme.storm, fontWeight: Typography.semibold },
    premiumBanner: { backgroundColor: theme.card, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: theme.storm, marginTop: Spacing.sm },
    premiumEmoji: { fontSize: Typography.xxl },
    premiumText: { flex: 1, gap: 2 },
    premiumTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: theme.textPrimary },
    premiumDescription: { fontSize: Typography.xs, color: theme.textSecondary },
    premiumBtn: { backgroundColor: theme.storm, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
    premiumBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: theme.textLight },
    dndCard: { backgroundColor: theme.card, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
    dndHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    dndInfo: { flex: 1, gap: 2 },
    dndTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: theme.textPrimary },
    dndDescription: { fontSize: Typography.sm, color: theme.textSecondary },
    dndTimeRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: theme.border },
    dndTimeCol: { alignItems: 'center', gap: Spacing.xs },
    dndTimeLabel: { fontSize: Typography.xs, color: theme.textSecondary, fontWeight: Typography.medium },
    dndStepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    dndTimeValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: theme.textPrimary, minWidth: 60, textAlign: 'center' },
    historyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: theme.card, borderRadius: Radius.lg, padding: Spacing.md },
    historyBtnIcon: { fontSize: Typography.md },
    historyBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: theme.textPrimary },
  });
}