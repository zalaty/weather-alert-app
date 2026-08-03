import i18n from '../i18n';
import { CurrentWeather } from './weatherApi';
import { scheduleWeatherAlert } from './notifications';
import { trackEvent } from './analytics';
import { AlertType, loadDoNotDisturb, isWithinDoNotDisturb } from './alertsStorage';
import { addAlertHistoryEntry } from './alertHistoryStorage';

export interface AlertEvaluation {
  type: AlertType;
  value: number;
  threshold: number;
  triggered: boolean;
}

export function evaluateAlert(type: AlertType, threshold: number, current: CurrentWeather): AlertEvaluation {
  let value: number;
  let triggered: boolean;
  switch (type) {
    case 'rain':
      value = current.precipProb;
      triggered = value >= threshold;
      break;
    case 'wind':
      value = current.windSpeed;
      triggered = value >= threshold;
      break;
    case 'temp_low':
      value = current.temp;
      triggered = value <= threshold;
      break;
    case 'temp_high':
      value = current.temp;
      triggered = value >= threshold;
      break;
  }
  return { type, value, threshold, triggered };
}

function alertBody(evaluation: AlertEvaluation): string {
  switch (evaluation.type) {
    case 'rain':
      return i18n.t('alerts.notifications.rainBody', { value: evaluation.value });
    case 'wind':
      return i18n.t('alerts.notifications.windBody', { value: evaluation.value });
    case 'temp_low':
      return i18n.t('alerts.notifications.tempLowBody', { value: evaluation.value });
    case 'temp_high':
      return i18n.t('alerts.notifications.tempHighBody', { value: evaluation.value });
  }
}

export interface NotifyOptions {
  // Si es false (feedback instantáneo al activar un switch), la notificación siempre sale,
  // aunque la franja "no molestar" esté activa — solo checkAndNotify (chequeo periódico
  // silencioso) respeta la franja.
  respectDoNotDisturb: boolean;
}

export async function notifyTriggeredAlerts(triggered: AlertEvaluation[], options: NotifyOptions): Promise<void> {
  if (triggered.length === 0) return;

  const silenced = options.respectDoNotDisturb && isWithinDoNotDisturb(await loadDoNotDisturb());

  await Promise.all(
    triggered.map((e) =>
      addAlertHistoryEntry({
        type: e.type,
        value: e.value,
        threshold: e.threshold,
        timestamp: Date.now(),
        notified: !silenced,
      })
    )
  );

  for (const e of triggered) {
    trackEvent('alert_triggered', { alert_type: e.type, threshold: e.threshold });
  }

  if (silenced) return;

  if (triggered.length === 1) {
    const evaluation = triggered[0];
    const label = i18n.t(`alerts.types.${evaluation.type}.label`);
    const title = i18n.t('alerts.notifications.title', { label });
    await scheduleWeatherAlert(title, alertBody(evaluation));
  } else {
    const labels = triggered.map((e) => i18n.t(`alerts.types.${e.type}.label`)).join(', ');
    const title = i18n.t('alerts.notifications.groupedTitle', { count: triggered.length });
    await scheduleWeatherAlert(title, labels);
  }
}
