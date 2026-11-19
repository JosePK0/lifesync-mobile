import { isRunningInExpoGo } from 'expo';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '../../data/api';
import { secureStorage } from '../../data/secureStorage';
import { AlertCenter, alertCenter, AlertLevel } from '../observers/AlertCenter';

const PUSH_TOKEN_KEY = 'lifesync.push_token';
export const ANDROID_CHANNEL_ID = 'lifesync_alerts';

let hasNativeFcmToken = false;

/** Configura el canal de alta prioridad en Android para FCM y notificaciones locales. */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Alertas médicas y emergencias',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F04438',
    sound: 'default',
  });
}

/**
 * Obtiene el token nativo de Firebase Cloud Messaging (Android) / APNs (iOS)
 * y lo registra en el backend. En Expo Go (Android SDK 53+) configura el canal
 * y usa el buzón en tiempo real para mostrar las notificaciones push del servidor.
 */
export async function registerDevicePushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted && current.canAskAgain !== false) {
      const asked = await Notifications.requestPermissionsAsync();
      granted = asked.granted;
    }
    if (!granted) return null;

    await ensureNotificationChannel();

    if (isRunningInExpoGo() && Platform.OS === 'android') {
      hasNativeFcmToken = false;
      return null;
    }

    let token: string | null = null;
    let platform: 'android' | 'ios' | 'expo' = Platform.OS === 'ios' ? 'ios' : 'android';

    if (Platform.OS === 'ios') {
      // En iOS, getDevicePushTokenAsync devuelve un token APNs hexadecimal crudo que FCM HTTP v1 rechaza.
      // Usamos getExpoPushTokenAsync (respaldado por la llave APNs .p8 en EAS) que FcmService despacha vía Expo -> APNs.
      try {
        const expoToken = await Notifications.getExpoPushTokenAsync({
          projectId: '690fac71-45b4-4520-a0bc-51d4502fb72c',
        });
        if (expoToken?.data) {
          token = expoToken.data;
          platform = 'ios';
        }
      } catch {
        hasNativeFcmToken = false;
      }
    } else {
      try {
        const nativeToken = await Notifications.getDevicePushTokenAsync();
        if (typeof nativeToken.data === 'string' && nativeToken.data.length >= 16) {
          token = nativeToken.data;
        }
      } catch {
        if (!isRunningInExpoGo()) {
          const expoToken = await Notifications.getExpoPushTokenAsync({
            projectId: '690fac71-45b4-4520-a0bc-51d4502fb72c',
          });
          token = expoToken.data;
          platform = 'expo';
        }
      }
    }

    if (!token) {
      hasNativeFcmToken = false;
      return null;
    }

    hasNativeFcmToken = Platform.OS === 'android';
    await secureStorage.setJson(PUSH_TOKEN_KEY, token);
    await api.post('/devices/token', { token, platform });
    return token;
  } catch {
    return null;
  }
}

/** Desregistra el token push del dispositivo al cerrar sesión. */
export async function unregisterDevicePushToken(): Promise<void> {
  hasNativeFcmToken = false;
  try {
    const token = await secureStorage.getJson<string>(PUSH_TOKEN_KEY);
    if (token) {
      await api.delete('/devices/token', { data: { token } }).catch(() => undefined);
      await secureStorage.removeJson(PUSH_TOKEN_KEY);
    }
  } catch {
    /* ignorar errores al cerrar sesión */
  }
}

interface PollItem {
  id: string;
  title: string;
  body: string;
  level?: AlertLevel;
}

/** Revisa si el servidor despachó notificaciones push nuevas hacia este usuario. */
export async function pollServerNotifications(center: AlertCenter = alertCenter): Promise<number> {
  try {
    const { data } = await api.get<{ items?: PollItem[] }>('/notifications/poll');
    const items = data?.items ?? [];
    for (const item of items) {
      const level: AlertLevel = item.level === 'critical' || item.level === 'warning' ? item.level : 'info';
      center.publish({
        level,
        title: item.title || '🔔 Notificación LifeSync',
        message: item.body || '',
        // Si ya tiene FCM nativo activo, el SO muestra el push de Firebase; si está en Expo Go, lo muestra NotificationObserver
        remote: hasNativeFcmToken,
      });
    }
    return items.length;
  } catch {
    return 0;
  }
}

/** Solicita al backend enviar una notificación push de prueba vía `/api/notifications/test`. */
export async function sendTestPushNotification(custom?: { title?: string; body?: string; level?: AlertLevel }): Promise<{
  sent: number;
  failed: number;
  skipped: number;
  inExpoGo: boolean;
}> {
  await registerDevicePushToken();
  const { data } = await api.post<{ stats: { sent: number; failed: number; skipped: number } }>('/notifications/test', custom ?? {});
  const inExpoGo = isRunningInExpoGo();

  // Procesa de inmediato el buzón del servidor para que el banner aparezca al instante
  const pulled = await pollServerNotifications(alertCenter);
  if (pulled === 0 && data.stats.sent === 0) {
    alertCenter.publish({
      level: custom?.level ?? 'info',
      title: custom?.title ?? '🔔 LifeSync Push Activo',
      message: custom?.body ?? 'Tus notificaciones de emergencia médica están configuradas correctamente.',
    });
  }

  return { ...data.stats, inExpoGo };
}

/**
 * Conecta las notificaciones push remotas entrantes (FCM/APNs + buzón en tiempo real de la API)
 * al AlertCenter (Patrón Observer).
 */
export function subscribeRemotePushToAlertCenter(center: AlertCenter): () => void {
  const sub =
    Platform.OS !== 'web'
      ? Notifications.addNotificationReceivedListener((notification) => {
          const trigger = notification.request.trigger;
          const isRemote = trigger && typeof trigger === 'object' && 'type' in trigger && trigger.type === 'push';
          if (!isRemote) return;

          const { title, body, data } = notification.request.content;
          const rawLevel = typeof data?.level === 'string' ? data.level : 'info';
          const level: AlertLevel = rawLevel === 'critical' || rawLevel === 'warning' ? rawLevel : 'info';

          center.publish({
            level,
            title: title || 'Notificación LifeSync',
            message: body || '',
            remote: true,
          });
        })
      : null;

  // Sincronización periódica con el endpoint de push de la API (ideal para pruebas desde Postman/cURL en emulador)
  const timer = setInterval(() => {
    pollServerNotifications(center).catch(() => undefined);
  }, 3500);

  return () => {
    sub?.remove();
    clearInterval(timer);
  };
}
