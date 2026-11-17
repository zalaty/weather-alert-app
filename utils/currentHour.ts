import type { HourlyWeather } from '../services/weatherApi';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Hora de la previsión que contiene el instante `now` (epoch <= now < epoch + 1 h).
 * Usa `epoch` (datetimeEpoch), así que no depende de la zona horaria del dispositivo.
 * Devuelve undefined si ninguna hora lo contiene (datos de otro día o snapshots sin epoch):
 * quien llama debe caer entonces al valor de las condiciones actuales.
 */
export function pickCurrentHour(hours: HourlyWeather[] | undefined, now: number): HourlyWeather | undefined {
  if (!hours) return undefined;
  return hours.find((h) => h.epoch != null && h.epoch <= now && now < h.epoch + HOUR_MS);
}
