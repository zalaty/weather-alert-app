import type { AlertType } from '../services/alertsStorage';

export type Units = 'metric' | 'us';

// Los umbrales de las alertas se guardan SIEMPRE en métrico (%, km/h, °C). Este es el único
// sitio donde se convierte entre sistemas: el motor compara en métrico y la UI/notificaciones
// formatean en las unidades que el usuario tiene elegidas.

const KMH_PER_MPH = 1.609344;

/** Valor de la previsión (en las unidades en que vino de la API) → métrico */
export function toMetric(type: AlertType, value: number, units: Units): number {
  if (units === 'metric' || type === 'rain') return value;
  if (type === 'wind') return value * KMH_PER_MPH;
  return ((value - 32) * 5) / 9;
}

/** Valor métrico → unidades de visualización */
export function fromMetric(type: AlertType, value: number, units: Units): number {
  if (units === 'metric' || type === 'rain') return value;
  if (type === 'wind') return value / KMH_PER_MPH;
  return (value * 9) / 5 + 32;
}

export function alertUnitLabel(type: AlertType, units: Units): string {
  if (type === 'rain') return '%';
  if (type === 'wind') return units === 'us' ? 'mph' : 'km/h';
  return units === 'us' ? '°F' : '°C';
}

/** Número redondeado en unidades de visualización, sin sufijo */
export function displayAlertNumber(type: AlertType, metricValue: number, units: Units): number {
  const rounded = Math.round(fromMetric(type, metricValue, units));
  return rounded === 0 ? 0 : rounded; // evita "-0"
}

/** "55 km/h", "34 mph", "3°C", "37°F", "80%" */
export function formatAlertValue(type: AlertType, metricValue: number, units: Units): string {
  const n = displayAlertNumber(type, metricValue, units);
  const unit = alertUnitLabel(type, units);
  return type === 'wind' ? `${n} ${unit}` : `${n}${unit}`;
}

/** "HH:MM[:SS]" (hora local de la ubicación) → hora formateada según el locale ("17:00", "05:00 PM") */
export function formatClockTime(time: string, locale: string): string {
  const [h, m] = time.split(':').map(Number);
  // Se formatea en UTC a propósito: la cadena ya es hora local de la ubicación y no debe
  // volver a desplazarse por la zona horaria del dispositivo.
  const date = new Date(Date.UTC(2000, 0, 1, h || 0, m || 0));
  try {
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(date);
  } catch {
    return time.slice(0, 5);
  }
}
