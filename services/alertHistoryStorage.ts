import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertType } from './alertsStorage';

export interface AlertHistoryEntry {
  type: AlertType;
  /** Valor en las unidades de `units` (las entradas antiguas, sin `units`, están en métrico) */
  value: number;
  /** Umbral, siempre en métrico */
  threshold: number;
  /** Cuándo se registró (al programar el aviso, no cuando suena) */
  timestamp: number;
  notified: boolean; // false = se silenció por "no molestar"
  /** Hora prevista del evento (ms epoch). Solo en entradas creadas desde los avisos con antelación */
  eventTime?: number;
  /** Fin previsto del episodio (ms epoch) */
  eventEnd?: number;
  /** Clave tipo+episodio, para no duplicar la entrada en cada replanificación */
  episodeKey?: string;
  units?: 'metric' | 'us';
}

const ALERT_HISTORY_KEY = 'alertHistory';
// Misma tolerancia que EPISODE_TOLERANCE_MS del motor: mismo episodio si los tramos se solapan con este margen
const SAME_EPISODE_MS = 2 * 60 * 60 * 1000;

// Tope real de almacenamiento, independiente del tier — así un usuario que pasa a Premium no
// pierde historial ya acumulado mientras era free. El límite de tier solo afecta a lo que se
// muestra (ver ALERT_HISTORY_FREE_LIMIT, usado en components/AlertHistorySheet.tsx).
export const ALERT_HISTORY_STORAGE_LIMIT = 100;
export const ALERT_HISTORY_FREE_LIMIT = 5;

export async function loadAlertHistory(): Promise<AlertHistoryEntry[]> {
  const saved = await AsyncStorage.getItem(ALERT_HISTORY_KEY);
  return saved ? JSON.parse(saved) : [];
}

/**
 * Añade la entrada salvo que ya exista una del mismo tipo y episodio. Si la existente estaba
 * silenciada y ahora sí se notifica, se actualiza en vez de duplicarse.
 */
export async function addAlertHistoryEntry(entry: AlertHistoryEntry): Promise<void> {
  const history = await loadAlertHistory();

  if (entry.eventTime != null) {
    const existing = history.find(
      (h) =>
        h.type === entry.type &&
        h.eventTime != null &&
        entry.eventTime! <= (h.eventEnd ?? h.eventTime) + SAME_EPISODE_MS &&
        (entry.eventEnd ?? entry.eventTime!) + SAME_EPISODE_MS >= h.eventTime
    );
    if (existing) {
      const extendsEpisode = (entry.eventEnd ?? 0) > (existing.eventEnd ?? 0);
      const nowNotified = !existing.notified && entry.notified;
      if (!extendsEpisode && !nowNotified) return;
      if (extendsEpisode) existing.eventEnd = entry.eventEnd;
      if (nowNotified) existing.notified = true;
      await AsyncStorage.setItem(ALERT_HISTORY_KEY, JSON.stringify(history));
      return;
    }
  }

  const updated = [entry, ...history].slice(0, ALERT_HISTORY_STORAGE_LIMIT);
  await AsyncStorage.setItem(ALERT_HISTORY_KEY, JSON.stringify(updated));
}
