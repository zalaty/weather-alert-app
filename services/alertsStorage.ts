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
