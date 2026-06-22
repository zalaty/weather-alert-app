import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius, Theme } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useWeatherStore } from '../../store/weatherStore';
import { scheduleWeatherAlert } from '../../services/notifications';

type AlertType = 'rain' | 'wind' | 'temp_low' | 'temp_high';

interface Alert {
  id: AlertType;
  label: string;
  emoji: string;
  description: string;
  unit: string;
  defaultThreshold: number;
  min: number;
  max: number;
  step: number;
}

const ALERT_TYPES: Alert[] = [
  { id: 'rain', label: 'Lluvia', emoji: '🌧️', description: 'Avísame si la probabilidad de lluvia supera', unit: '%', defaultThreshold: 70, min: 10, max: 100, step: 10 },
  { id: 'wind', label: 'Viento fuerte', emoji: '💨', description: 'Avísame si el viento supera', unit: 'km/h', defaultThreshold: 40, min: 10, max: 120, step: 10 },
  { id: 'temp_low', label: 'Temperatura mínima', emoji: '🥶', description: 'Avísame si la temperatura baja de', unit: '°C', defaultThreshold: 5, min: -10, max: 20, step: 1 },
  { id: 'temp_high', label: 'Temperatura máxima', emoji: '🥵', description: 'Avísame si la temperatura sube de', unit: '°C', defaultThreshold: 35, min: 25, max: 50, step: 1 },
];

export default function AlertsScreen() {
  const { weatherData } = useWeatherStore();
  const { theme } = useTheme();
  const [activeAlert, setActiveAlert] = useState<AlertType | null>(null);
  const [thresholds, setThresholds] = useState<Record<AlertType, number>>({ rain: 70, wind: 40, temp_low: 5, temp_high: 35 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const savedAlert = await AsyncStorage.getItem('activeAlert');
        const savedThresholds = await AsyncStorage.getItem('thresholds');
        if (savedAlert) setActiveAlert(savedAlert as AlertType);
        if (savedThresholds) setThresholds(JSON.parse(savedThresholds));
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
        if (activeAlert) {
          await AsyncStorage.setItem('activeAlert', activeAlert);
        } else {
          await AsyncStorage.removeItem('activeAlert');
        }
        await AsyncStorage.setItem('thresholds', JSON.stringify(thresholds));
      } catch (e) {
        console.error('Error saving alerts:', e);
      }
    }
    save();
  }, [activeAlert, thresholds, loaded]);

  const isFreeTierFull = (type: AlertType) => activeAlert !== null && activeAlert !== type;

  const toggleAlert = (type: AlertType) => {
    if (activeAlert === type) {
      setActiveAlert(null);
    } else if (activeAlert === null) {
      setActiveAlert(type);
      triggerNotificationIfNeeded(type);
    }
  };

  const adjustThreshold = (type: AlertType, delta: number) => {
    const alert = ALERT_TYPES.find((a) => a.id === type)!;
    setThresholds((prev) => ({
      ...prev,
      [type]: Math.min(alert.max, Math.max(alert.min, prev[type] + delta)),
    }));
  };

  const checkAlert = (type: AlertType): boolean => {
    if (!weatherData || activeAlert !== type) return false;
    const { current } = weatherData;
    const threshold = thresholds[type];
    switch (type) {
      case 'rain': return current.precipProb >= threshold;
      case 'wind': return current.windSpeed >= threshold;
      case 'temp_low': return current.temp <= threshold;
      case 'temp_high': return current.temp >= threshold;
    }
  };

  const triggerNotificationIfNeeded = async (type: AlertType) => {
    if (!weatherData) return;
    const { current } = weatherData;
    const threshold = thresholds[type];
    const alert = ALERT_TYPES.find((a) => a.id === type)!;
    let triggered = false;
    let body = '';
    switch (type) {
      case 'rain': triggered = current.precipProb >= threshold; body = `Probabilidad de lluvia: ${current.precipProb}%`; break;
      case 'wind': triggered = current.windSpeed >= threshold; body = `Viento actual: ${current.windSpeed} km/h`; break;
      case 'temp_low': triggered = current.temp <= threshold; body = `Temperatura actual: ${current.temp}°C`; break;
      case 'temp_high': triggered = current.temp >= threshold; body = `Temperatura actual: ${current.temp}°C`; break;
    }
    if (triggered) await scheduleWeatherAlert(`⚠️ Alerta: ${alert.label}`, body);
  };

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.screenTitle}>Alertas</Text>
        <Text style={s.subtitle}>Versión gratuita: 1 alerta activa</Text>

        {ALERT_TYPES.map((alert) => {
          const isActive = activeAlert === alert.id;
          const isLocked = isFreeTierFull(alert.id);
          const isTriggered = checkAlert(alert.id);

          return (
            <View key={alert.id} style={[s.alertCard, isActive && s.alertCardActive, isTriggered && s.alertCardTriggered, isLocked && s.alertCardLocked]}>
              <View style={s.alertHeader}>
                <Text style={s.alertEmoji}>{alert.emoji}</Text>
                <View style={s.alertInfo}>
                  <Text style={[s.alertLabel, isLocked && s.textLocked]}>{alert.label}</Text>
                  <Text style={[s.alertDescription, isLocked && s.textLocked]}>
                    {alert.description} {thresholds[alert.id]}{alert.unit}
                  </Text>
                </View>
                {isLocked ? (
                  <Text style={s.lockIcon}>🔒</Text>
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
                  <Text style={s.triggeredText}>⚠️ Condición activa ahora mismo</Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={s.premiumBanner}>
          <Text style={s.premiumEmoji}>💎</Text>
          <View style={s.premiumText}>
            <Text style={s.premiumTitle}>Alertas ilimitadas</Text>
            <Text style={s.premiumDescription}>Activa todas las alertas y personaliza los umbrales con Premium</Text>
          </View>
          <TouchableOpacity style={s.premiumBtn}>
            <Text style={s.premiumBtnText}>2,99€/mes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  });
}