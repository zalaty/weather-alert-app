import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { getIntlLocale } from '../i18n';
import { ALERT_TYPES } from '../constants/alertTypes';
import { useWeatherStore } from '../store/weatherStore';
import { displayAlertNumber, formatAlertValue, formatClockTime, Units } from '../utils/alertUnits';
import { addAlertHistoryEntry } from './alertHistoryStorage';
import {
  AlertEpisodes, AlertThresholds, PlannedAlert, ReconciledAlert,
  hasPlannableHours, isSameEpisode, planAlerts, reconcileWithEpisodes,
} from './alertEngine';
import { AlertType, loadActiveAlerts, loadDoNotDisturb } from './alertsStorage';
import { trackEvent } from './analytics';
import { ALERT_ID_PREFIX, cancelScheduledAlerts, scheduleWeatherAlertAt } from './notifications';
import { WeatherData } from './weatherApi';
import { loadGpsSnapshot } from './weatherPersistence';

// Orquestación con efectos del motor puro de services/alertEngine.ts:
// cancelar lo programado → planAlerts → deduplicar por episodio → reprogramar.
// Como siempre se reprograma desde cero con identificadores estables, no hay duplicados.

const EPISODES_KEY = 'alertEpisodes';
const THRESHOLDS_KEY = 'thresholds';

export interface GpsPlanningData {
  weatherData: WeatherData;
  /** Unidades en que vienen los datos (no necesariamente las que el usuario tiene ahora) */
  units: Units;
}

export interface ReplanOptions {
  /** Datos recién obtenidos por GPS. Nunca pasar aquí los de una ciudad buscada o guardada. */
  gpsData?: GpsPlanningData;
  /** El usuario acaba de activar este interruptor: feedback inmediato, ignorando "no molestar" */
  feedbackFor?: AlertType;
}

// Las alertas están atadas a la ubicación GPS: se planifica con el último dato de GPS de esta
// sesión o, si no lo hay (arranque en frío, ciudad manual en pantalla), con el snapshot persistido.
let lastGpsData: GpsPlanningData | null = null;
let queue: Promise<void> = Promise.resolve();

/** Replanifica las notificaciones de alerta. Las llamadas se ejecutan en serie, nunca solapadas. */
export function replanAlerts(options: ReplanOptions = {}): Promise<void> {
  if (options.gpsData) lastGpsData = options.gpsData;
  queue = queue
    .then(() => run(options))
    .catch((e) => console.error('Error replanning alerts:', e));
  return queue;
}

async function loadThresholds(): Promise<AlertThresholds> {
  const defaults = Object.fromEntries(ALERT_TYPES.map((a) => [a.id, a.defaultThreshold])) as AlertThresholds;
  const saved = await AsyncStorage.getItem(THRESHOLDS_KEY);
  return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
}

async function loadEpisodes(): Promise<AlertEpisodes> {
  const saved = await AsyncStorage.getItem(EPISODES_KEY);
  return saved ? JSON.parse(saved) : {};
}

function alertTitle(type: AlertType): string {
  return i18n.t('alerts.notifications.title', { label: i18n.t(`alerts.types.${type}.label`) });
}

/** "Lluvia prevista a las 17:00 (80 %)", "Viento de 55 km/h previsto a las 15:00"... */
export function alertText(plan: PlannedAlert, displayUnits: Units): string {
  const kind = plan.type === 'rain' ? 'rain' : plan.type === 'wind' ? 'wind' : 'temp';
  const value =
    plan.type === 'rain'
      ? displayAlertNumber('rain', plan.value, displayUnits)
      : formatAlertValue(plan.type, plan.value, displayUnits);
  if (plan.inProgress) return i18n.t(`alerts.notifications.${kind}Now`, { value });
  const time = formatClockTime(plan.eventLocalTime, getIntlLocale(i18n.language));
  return i18n.t(`alerts.notifications.${kind}Forecast`, { value, time });
}

async function recordEpisode(plan: PlannedAlert, fireAt: number, immediate: boolean, nowMs: number, displayUnits: Units) {
  await addAlertHistoryEntry({
    type: plan.type,
    value: displayAlertNumber(plan.type, plan.value, displayUnits),
    threshold: plan.threshold,
    timestamp: nowMs,
    notified: true,
    eventTime: plan.eventAt,
    eventEnd: plan.episodeEndAt,
    episodeKey: `${plan.type}:${plan.eventAt}`,
    units: displayUnits,
  });
  trackEvent('alert_scheduled', {
    alert_type: plan.type,
    threshold: plan.threshold,
    lead_minutes: Math.max(0, Math.round((plan.eventAt - fireAt) / 60000)),
    immediate,
  });
}

async function run(options: ReplanOptions): Promise<void> {
  const source = lastGpsData ?? (await loadGpsSnapshot());
  // Sin datos de GPS con instante absoluto por hora (snapshot antiguo) no se toca nada:
  // se conserva lo ya programado y se espera al siguiente fetch.
  if (!source || !hasPlannableHours(source.weatherData)) return;

  const [activeAlerts, thresholds, dnd, storedEpisodes] = await Promise.all([
    loadActiveAlerts(),
    loadThresholds(),
    loadDoNotDisturb(),
    loadEpisodes(),
  ]);
  const displayUnits = useWeatherStore.getState().units;
  const now = new Date();
  const nowMs = now.getTime();
  let episodes = storedEpisodes;

  // 1) Feedback instantáneo al activar un interruptor: sale siempre (ignora "no molestar"),
  //    pero solo si algo cruza el umbral en las próximas 24 h.
  const feedbackType = options.feedbackFor;
  if (feedbackType && activeAlerts.includes(feedbackType)) {
    const [plan] = planAlerts([feedbackType], thresholds, source.weatherData, source.units, now);
    if (plan) {
      const shown = await scheduleWeatherAlertAt(
        `${ALERT_ID_PREFIX}feedback-${feedbackType}`,
        alertTitle(feedbackType),
        alertText(plan, displayUnits),
        null
      );
      // Si el evento está a menos de LEAD_MINUTES, este aviso ya ES el del episodio: se marca
      // como entregado para que la planificación de abajo no vuelva a notificarlo.
      if (shown && plan.immediate) {
        if (!isSameEpisode(episodes[feedbackType], plan)) {
          await recordEpisode(plan, nowMs, true, nowMs, displayUnits);
        }
        episodes = {
          ...episodes,
          [feedbackType]: { eventAt: plan.eventAt, endAt: plan.episodeEndAt, fireAt: nowMs },
        };
      }
    }
  }

  // 2) Planificación normal
  const planned = planAlerts(activeAlerts, thresholds, source.weatherData, source.units, now, { doNotDisturb: dnd });
  const reconciled = reconcileWithEpisodes(planned, episodes, now, dnd);

  await cancelScheduledAlerts();

  // Los avisos que coinciden en el mismo instante se agrupan en una sola notificación
  const groups = new Map<number, ReconciledAlert[]>();
  for (const alert of reconciled.alerts) {
    const key = alert.immediate ? 0 : alert.fireAt;
    groups.set(key, [...(groups.get(key) ?? []), alert]);
  }

  const delivered: ReconciledAlert[] = [];
  for (const [key, group] of groups) {
    const immediate = key === 0;
    let id: string;
    let title: string;
    let body: string;
    if (group.length === 1) {
      id = `${ALERT_ID_PREFIX}${group[0].plan.type}`;
      title = alertTitle(group[0].plan.type);
      body = alertText(group[0].plan, displayUnits);
    } else {
      id = immediate ? `${ALERT_ID_PREFIX}group` : `${ALERT_ID_PREFIX}group-${key}`;
      title = i18n.t('alerts.notifications.groupedTitle', { count: group.length });
      body = group.map((a) => alertText(a.plan, displayUnits)).join('\n');
    }
    const ok = await scheduleWeatherAlertAt(id, title, body, immediate ? null : new Date(key));
    if (!ok) return; // sin permiso de notificaciones: no se registra nada, se reintentará
    delivered.push(...group);
  }

  await AsyncStorage.setItem(EPISODES_KEY, JSON.stringify(reconciled.episodes));

  for (const alert of delivered) {
    if (alert.isNewEpisode) await recordEpisode(alert.plan, alert.fireAt, alert.immediate, nowMs, displayUnits);
  }

  // Los silenciados por "no molestar" no suenan, pero constan en el historial (una vez por episodio)
  for (const plan of planned) {
    if (!plan.silenced) continue;
    await addAlertHistoryEntry({
      type: plan.type,
      value: displayAlertNumber(plan.type, plan.value, displayUnits),
      threshold: plan.threshold,
      timestamp: nowMs,
      notified: false,
      eventTime: plan.eventAt,
      eventEnd: plan.episodeEndAt,
      episodeKey: `${plan.type}:${plan.eventAt}`,
      units: displayUnits,
    });
  }
}
