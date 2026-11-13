import type { CurrentWeather, HourlyWeather, WeatherData } from './weatherApi';
import { AlertType, DoNotDisturbConfig, isWithinDoNotDisturb } from './alertsStorage';
import { toMetric, Units } from '../utils/alertUnits';

// Motor de alertas: funciones PURAS (sin red, almacenamiento ni notificaciones) para poder
// testearlas. Los efectos (programar, historial, analytics) viven en services/alertScheduler.ts.

/** Antelación con la que se avisa antes de la hora en que se cruza el umbral */
export const LEAD_MINUTES = 60;
/** Horizonte de previsión que se recorre */
export const WINDOW_HOURS = 24;
/**
 * Un episodio es el tramo continuo de horas que cruzan el umbral, tolerando huecos de hasta
 * este tamaño. La misma tolerancia decide si un cruce pertenece a un episodio ya guardado.
 */
export const EPISODE_TOLERANCE_MS = 2 * 60 * 60 * 1000;
/** Si el aviso caería en una franja "no molestar" que aún no ha empezado, se adelanta a esto antes de su inicio */
export const DND_ADVANCE_MINUTES = 5;

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export type AlertThresholds = Record<AlertType, number>;

export interface PlannedAlert {
  type: AlertType;
  /** Umbral configurado (siempre métrico) */
  threshold: number;
  /** Valor previsto, convertido a métrico */
  value: number;
  /** Inicio del episodio: primera hora que cruza el umbral (ms epoch) */
  eventAt: number;
  /** Fin del episodio: final de la última hora del tramo continuo que cruza el umbral (ms epoch) */
  episodeEndAt: number;
  /** Esa misma hora en hora local de la ubicación, "HH:MM:SS" */
  eventLocalTime: string;
  /** Cuándo debe sonar el aviso (ms epoch). Si es <= now, es inmediato */
  fireAt: number;
  immediate: boolean;
  /** Cuando suene el aviso el episodio ya habrá empezado (no es una previsión futura) */
  inProgress: boolean;
  /** Silenciado por la franja "no molestar": no se notifica, solo consta en el historial */
  silenced: boolean;
}

export interface PlanOptions {
  /** Si se omite, no se aplica la franja (feedback directo a una acción del usuario) */
  doNotDisturb?: DoNotDisturbConfig;
  leadMinutes?: number;
}

function metricValueFor(type: AlertType, source: { precipProb: number; windSpeed: number; temp: number }, units: Units): number {
  switch (type) {
    case 'rain':
      return source.precipProb;
    case 'wind':
      return toMetric('wind', source.windSpeed, units);
    case 'temp_low':
    case 'temp_high':
      return toMetric(type, source.temp, units);
  }
}

function crosses(type: AlertType, metricValue: number, threshold: number): boolean {
  return type === 'temp_low' ? metricValue <= threshold : metricValue >= threshold;
}

/** ¿Se cumple la condición ahora mismo? (banner "condición activa" de la pantalla de alertas) */
export function isConditionActiveNow(type: AlertType, threshold: number, current: CurrentWeather, units: Units): boolean {
  return crosses(type, metricValueFor(type, current, units), threshold);
}

/**
 * Las horas solo sirven para planificar si traen instante absoluto (datetimeEpoch). Los
 * snapshots guardados por versiones anteriores no lo traen: en ese caso no se replanifica.
 */
export function hasPlannableHours(data: WeatherData): boolean {
  const hours = data.daily?.[0]?.hours ?? [];
  return hours.length > 0 && hours.every((h) => typeof h.epoch === 'number');
}

/** Límites (hora del dispositivo) de la franja "no molestar" que contiene a `date` */
function doNotDisturbWindow(config: DoNotDisturbConfig, date: number): { start: number; end: number } {
  const cursor = new Date(date);
  cursor.setMinutes(0, 0, 0);
  let start = cursor.getTime();
  for (let i = 0; i < 25 && isWithinDoNotDisturb(config, new Date(start - HOUR_MS)); i++) start -= HOUR_MS;
  let end = cursor.getTime();
  for (let i = 0; i < 25 && isWithinDoNotDisturb(config, new Date(end)); i++) end += HOUR_MS;
  return { start, end };
}

/**
 * Para cada alerta activa busca la PRIMERA hora (en curso o futura, dentro de 24 h) que cruza
 * su umbral y decide cuándo avisar. Un aviso por tipo, no uno por hora.
 *
 * `units` son las unidades en que vienen los datos de `weatherData`.
 */
export function planAlerts(
  activeAlerts: AlertType[],
  thresholds: AlertThresholds,
  weatherData: WeatherData,
  units: Units,
  now: Date,
  options: PlanOptions = {}
): PlannedAlert[] {
  const nowMs = now.getTime();
  const leadMs = (options.leadMinutes ?? LEAD_MINUTES) * MINUTE_MS;
  const dnd = options.doNotDisturb;

  // weatherData.hourly solo trae las horas de HOY: para cruzar medianoche hacen falta las de mañana.
  const allHours: (HourlyWeather & { epoch: number })[] = [
    ...(weatherData.daily?.[0]?.hours ?? []),
    ...(weatherData.daily?.[1]?.hours ?? []),
  ]
    .filter((h): h is HourlyWeather & { epoch: number } => typeof h.epoch === 'number')
    .filter((h) => h.epoch + HOUR_MS > nowMs)
    .sort((a, b) => a.epoch - b.epoch);
  const windowEnd = nowMs + WINDOW_HOURS * HOUR_MS;

  const planned: PlannedAlert[] = [];

  for (const type of activeAlerts) {
    const threshold = thresholds[type];
    if (typeof threshold !== 'number') continue;
    const hourCrosses = (h: HourlyWeather) => crosses(type, metricValueFor(type, h, units), threshold);

    const hitIndex = allHours.findIndex((h) => h.epoch < windowEnd && hourCrosses(h));
    if (hitIndex === -1) continue;
    const hit = allHours[hitIndex];

    // El episodio se alarga mientras sigan cruzando el umbral, saltando huecos de hasta 2 h
    let last = hit;
    for (const h of allHours.slice(hitIndex + 1)) {
      if (hourCrosses(h)) last = h;
      else if (h.epoch - (last.epoch + HOUR_MS) >= EPISODE_TOLERANCE_MS) break;
    }

    const eventAt = hit.epoch;
    const episodeEndAt = last.epoch + HOUR_MS;
    let fireAt = Math.max(eventAt - leadMs, nowMs);
    let silenced = false;

    if (dnd && isWithinDoNotDisturb(dnd, new Date(fireAt))) {
      const window = doNotDisturbWindow(dnd, fireAt);
      if (window.start > nowMs) {
        // a) La franja aún no ha empezado: se adelanta el aviso a justo antes de que empiece
        fireAt = Math.max(window.start - DND_ADVANCE_MINUTES * MINUTE_MS, nowMs);
      } else if (window.end < episodeEndAt) {
        // b) Ya estamos dentro: se deja para el final de la franja, si el episodio sigue activo entonces
        fireAt = window.end;
      } else {
        // c) El episodio habrá terminado cuando acabe la franja
        silenced = true;
      }
    }

    // Si el aviso suena con el episodio ya empezado, el valor que se muestra es el de esa hora
    const hourAtFire = allHours.find((h) => h.epoch <= fireAt && fireAt < h.epoch + HOUR_MS);
    const shown = fireAt > eventAt && hourAtFire && hourCrosses(hourAtFire) ? hourAtFire : hit;

    planned.push({
      type,
      threshold,
      value: metricValueFor(type, shown, units),
      eventAt,
      episodeEndAt,
      eventLocalTime: hit.time,
      fireAt,
      immediate: fireAt <= nowMs,
      inProgress: eventAt <= fireAt,
      silenced,
    });
  }

  return planned;
}

/** Episodio ya gestionado para un tipo de alerta */
export interface AlertEpisode {
  /** Inicio y fin del tramo continuo que cruza el umbral */
  eventAt: number;
  /** Opcional solo por compatibilidad con lo guardado antes de existir el campo */
  endAt?: number;
  /**
   * Hora de disparo programada (o el instante en que se avisó, si fue inmediato).
   * null = se programó pero se retiró antes de sonar (la previsión dejó de cruzar el umbral):
   * no hay nada entregado, así que si el cruce reaparece hay que volver a programarlo.
   */
  fireAt: number | null;
}

export type AlertEpisodes = Partial<Record<AlertType, AlertEpisode>>;

export interface ReconciledAlert {
  plan: PlannedAlert;
  /** Hora real de disparo (puede ser la del episodio ya guardado, no la recién calculada) */
  fireAt: number;
  immediate: boolean;
  /** Primera vez que se ve este episodio: historial + analytics solo en este caso */
  isNewEpisode: boolean;
}

/**
 * Un cruce pertenece al episodio guardado si sus tramos se solapan con 2 h de margen: empieza
 * antes del fin guardado + 2 h (y no termina más de 2 h antes de su inicio).
 */
export function isSameEpisode(
  episode: AlertEpisode | undefined,
  plan: Pick<PlannedAlert, 'eventAt' | 'episodeEndAt'>
): episode is AlertEpisode {
  if (!episode) return false;
  const storedEnd = episode.endAt ?? episode.eventAt + HOUR_MS;
  return (
    plan.eventAt <= storedEnd + EPISODE_TOLERANCE_MS &&
    plan.episodeEndAt + EPISODE_TOLERANCE_MS >= episode.eventAt
  );
}

/**
 * Cruza el plan recién calculado con los episodios ya gestionados para no repetir avisos:
 *  - mismo episodio y su hora de disparo ya pasó → entregado, no se repite
 *  - mismo episodio y aún no ha sonado → se reprograma a la MISMA hora, nunca como inmediato
 *    (solo se adelanta si el episodio ahora empieza antes o la hora guardada cae en "no molestar")
 *  - mismo episodio retirado antes de sonar (previsión inestable) → se vuelve a programar, sin
 *    contarlo como nuevo
 *  - episodio nuevo → se programa (o se avisa ya) y se registra
 * Todo lo que estaba pendiente y no se reprograma en esta pasada queda marcado como retirado,
 * porque el planificador cancela siempre las notificaciones antes de reprogramar.
 */
export function reconcileWithEpisodes(
  planned: PlannedAlert[],
  episodes: AlertEpisodes,
  now: Date,
  doNotDisturb?: DoNotDisturbConfig
): { alerts: ReconciledAlert[]; episodes: AlertEpisodes } {
  const nowMs = now.getTime();
  const alerts: ReconciledAlert[] = [];
  const next: AlertEpisodes = { ...episodes };
  const rescheduled = new Set<AlertType>();

  for (const plan of planned) {
    const stored = episodes[plan.type];
    const same = isSameEpisode(stored, plan);

    if (same) {
      // El episodio guardado se estira con lo que diga la previsión actual
      const merged: AlertEpisode = {
        eventAt: Math.min(stored.eventAt, plan.eventAt),
        endAt: Math.max(stored.endAt ?? 0, plan.episodeEndAt),
        fireAt: stored.fireAt,
      };
      next[plan.type] = merged;
      if (plan.silenced) continue;

      if (stored.fireAt != null && stored.fireAt <= nowMs) continue; // ya entregado

      if (stored.fireAt == null) {
        // Se retiró antes de sonar: nada entregado, vale el plan nuevo (inmediato incluido)
        merged.fireAt = plan.immediate ? nowMs : plan.fireAt;
        alerts.push({ plan, fireAt: merged.fireAt, immediate: plan.immediate, isNewEpisode: false });
      } else {
        const storedInDnd = !!doNotDisturb && isWithinDoNotDisturb(doNotDisturb, new Date(stored.fireAt));
        let fireAt = stored.fireAt;
        if (plan.fireAt > nowMs) fireAt = storedInDnd ? plan.fireAt : Math.min(stored.fireAt, plan.fireAt);
        // Único caso en que un pendiente sale ya: su hora guardada ha quedado dentro de la franja
        const immediate = storedInDnd && plan.fireAt <= nowMs;
        merged.fireAt = immediate ? nowMs : fireAt;
        alerts.push({ plan, fireAt: merged.fireAt, immediate, isNewEpisode: false });
      }
      rescheduled.add(plan.type);
      continue;
    }

    if (plan.silenced) continue;
    const fireAt = plan.immediate ? nowMs : plan.fireAt;
    next[plan.type] = { eventAt: plan.eventAt, endAt: plan.episodeEndAt, fireAt };
    alerts.push({ plan, fireAt, immediate: plan.immediate, isNewEpisode: true });
    rescheduled.add(plan.type);
  }

  for (const type of Object.keys(next) as AlertType[]) {
    const episode = next[type]!;
    if (!rescheduled.has(type) && episode.fireAt != null && episode.fireAt > nowMs) {
      next[type] = { ...episode, fireAt: null };
    }
  }

  return { alerts, episodes: next };
}
