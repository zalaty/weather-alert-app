import { AlertType } from '../services/alertsStorage';

export interface AlertTypeMeta {
  id: AlertType;
  emoji: string;
  defaultThreshold: number;
  min: number;
  max: number;
  step: number;
}

export const ALERT_TYPES: AlertTypeMeta[] = [
  { id: 'rain', emoji: '🌧️', defaultThreshold: 70, min: 10, max: 100, step: 10 },
  { id: 'wind', emoji: '💨', defaultThreshold: 40, min: 10, max: 120, step: 10 },
  { id: 'temp_low', emoji: '🥶', defaultThreshold: 5, min: -10, max: 20, step: 1 },
  { id: 'temp_high', emoji: '🥵', defaultThreshold: 35, min: 25, max: 50, step: 1 },
];
