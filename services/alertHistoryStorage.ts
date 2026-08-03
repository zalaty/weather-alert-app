import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertType } from './alertsStorage';

export interface AlertHistoryEntry {
  type: AlertType;
  value: number;
  threshold: number;
  timestamp: number;
  notified: boolean; // false = se disparó pero se silenció por "no molestar"
}

const ALERT_HISTORY_KEY = 'alertHistory';

// Tope real de almacenamiento, independiente del tier — así un usuario que pasa a Premium no
// pierde historial ya acumulado mientras era free. El límite de tier solo afecta a lo que se
// muestra (ver ALERT_HISTORY_FREE_LIMIT, usado en components/AlertHistorySheet.tsx).
export const ALERT_HISTORY_STORAGE_LIMIT = 100;
export const ALERT_HISTORY_FREE_LIMIT = 5;

export async function loadAlertHistory(): Promise<AlertHistoryEntry[]> {
  const saved = await AsyncStorage.getItem(ALERT_HISTORY_KEY);
  return saved ? JSON.parse(saved) : [];
}

export async function addAlertHistoryEntry(entry: AlertHistoryEntry): Promise<void> {
  const history = await loadAlertHistory();
  const updated = [entry, ...history].slice(0, ALERT_HISTORY_STORAGE_LIMIT);
  await AsyncStorage.setItem(ALERT_HISTORY_KEY, JSON.stringify(updated));
}
