import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Prefijo de todos los identificadores de nuestras alertas (para cancelar solo las nuestras) */
export const ALERT_ID_PREFIX = 'avisa-alert-';
const ALERTS_CHANNEL_ID = 'weather-alerts';

let channelReady: Promise<void> | null = null;

/** Canal de Android con importancia alta (sonido + aviso emergente). No-op en iOS. */
function ensureAlertsChannel(): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();
  if (!channelReady) {
    channelReady = Notifications.setNotificationChannelAsync(ALERTS_CHANNEL_ID, {
      name: 'Avisa',
      importance: Notifications.AndroidImportance.HIGH,
    })
      .then(() => undefined)
      .catch(() => {
        channelReady = null;
      });
  }
  return channelReady;
}

/** Consulta el permiso sin pedirlo */
export async function isNotificationPermissionGranted(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function requestNotificationPermission(): Promise<boolean> {
  // El canal va ANTES de pedir el permiso: en Android 13+ el diálogo del sistema puede no
  // mostrarse si la app aún no ha creado ningún canal.
  await ensureAlertsChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();

  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Notificación local de alerta con identificador estable. Con `date` futura queda programada
 * en el sistema y suena aunque la app esté cerrada; con `date` null (o ya pasada) sale al momento.
 * No se pide el permiso de alarmas exactas: unos minutos de retraso son aceptables.
 */
export async function scheduleWeatherAlertAt(
  id: string,
  title: string,
  body: string,
  date: Date | null,
): Promise<boolean> {
  const hasPermission = await requestNotificationPermission(); // crea también el canal
  if (!hasPermission) return false;

  const isFuture = date != null && date.getTime() > Date.now();

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: true },
    trigger: isFuture
      ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: date!, channelId: ALERTS_CHANNEL_ID }
      : Platform.OS === 'android'
        ? { channelId: ALERTS_CHANNEL_ID }
        : null,
  });
  return true;
}

/** Cancela solo las alertas programadas por nosotros que aún no han sonado */
export async function cancelScheduledAlerts(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(ALERT_ID_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}
