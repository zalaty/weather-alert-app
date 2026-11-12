import { AlertType } from '../services/alertsStorage';

export interface AlertTypeMeta {
  id: AlertType;
  emoji: string;
  /** Unidad MÉTRICA en la que se guarda el umbral. Para mostrarlo usa utils/alertUnits.ts */
  unit: string;
  defaultThreshold: number;
  min: number;
  max: number;
  step: number;
}

export const ALERT_TYPES: AlertTypeMeta[] = [
  { id: 'rain', emoji: '🌧️', unit: '%', defaultThreshold: 70, min: 10, max: 100, step: 10 },
  { id: 'wind', emoji: '💨', unit: 'km/h', defaultThreshold: 40, min: 10, max: 120, step: 10 },
  { id: 'temp_low', emoji: '🥶', unit: '°C', defaultThreshold: 5, min: -10, max: 20, step: 1 },
  { id: 'temp_high', emoji: '🥵', unit: '°C', defaultThreshold: 35, min: 25, max: 50, step: 1 },
];
