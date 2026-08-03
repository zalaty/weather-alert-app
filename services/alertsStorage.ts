import AsyncStorage from '@react-native-async-storage/async-storage';

export type AlertType = 'rain' | 'wind' | 'temp_low' | 'temp_high';

const ACTIVE_ALERTS_KEY = 'activeAlerts';
// Clave del formato anterior (single alert, free tier únicamente). Se sigue leyendo
// como fallback para no perder la alerta configurada de usuarios ya instalados.
const LEGACY_ACTIVE_ALERT_KEY = 'activeAlert';

export async function loadActiveAlerts(): Promise<AlertType[]> {
  const saved = await AsyncStorage.getItem(ACTIVE_ALERTS_KEY);
  if (saved) return JSON.parse(saved);

  const legacy = await AsyncStorage.getItem(LEGACY_ACTIVE_ALERT_KEY);
  return legacy ? [legacy as AlertType] : [];
}

export async function saveActiveAlerts(alerts: AlertType[]): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_ALERTS_KEY, JSON.stringify(alerts));
  await AsyncStorage.removeItem(LEGACY_ACTIVE_ALERT_KEY);
}

export interface DoNotDisturbConfig {
  enabled: boolean;
  startHour: number; // 0-23
  endHour: number; // 0-23
}

const DO_NOT_DISTURB_KEY = 'doNotDisturb';

export const DEFAULT_DO_NOT_DISTURB: DoNotDisturbConfig = {
  enabled: false,
  startHour: 22,
  endHour: 7,
};

export async function loadDoNotDisturb(): Promise<DoNotDisturbConfig> {
  const saved = await AsyncStorage.getItem(DO_NOT_DISTURB_KEY);
  return saved ? { ...DEFAULT_DO_NOT_DISTURB, ...JSON.parse(saved) } : DEFAULT_DO_NOT_DISTURB;
}

export async function saveDoNotDisturb(config: DoNotDisturbConfig): Promise<void> {
  await AsyncStorage.setItem(DO_NOT_DISTURB_KEY, JSON.stringify(config));
}

// La franja puede cruzar medianoche (ej. 22h a 7h), así que start > end es un caso válido,
// no un error: en ese caso la franja activa es "desde start hasta las 24h" + "desde las 0h hasta end".
export function isWithinDoNotDisturb(config: DoNotDisturbConfig, now: Date = new Date()): boolean {
  if (!config.enabled || config.startHour === config.endHour) return false;
  const hour = now.getHours();
  if (config.startHour < config.endHour) {
    return hour >= config.startHour && hour < config.endHour;
  }
  return hour >= config.startHour || hour < config.endHour;
}
