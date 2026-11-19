import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AlertCenter, AlertObserver, MedicalAlert } from './AlertCenter';
import { HealthRecord } from '../../domain/types';

/** Observador que muestra la alerta como notificación local del sistema. */
export class NotificationObserver implements AlertObserver {
  update(alert: MedicalAlert): void {
    if (alert.remote) return; // las notificaciones push remotas ya las muestra el SO (FCM/APNs)
    Notifications.scheduleNotificationAsync({
      content: { title: alert.title, body: alert.message, sound: true },
      trigger: null,
    }).catch(() => undefined); // sin permiso de notificaciones: degradación silenciosa
  }
}

export function dueMedications(records: HealthRecord[], now: Date): HealthRecord[] {
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return records.filter((r) => r.type === 'medication' && r.remind_at === hhmm);
}

/** Emisor: revisa cada 20 s si toca algún medicamento y publica la alerta. */
export class ReminderService {
  private timer?: ReturnType<typeof setInterval>;
  private lastFired = new Set<string>();

  constructor(private readonly center: AlertCenter, private readonly getRecords: () => HealthRecord[]) {}

  start() {
    this.stop();
    this.timer = setInterval(() => this.tick(new Date()), 20000);
    this.tick(new Date());
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  tick(now: Date) {
    for (const med of dueMedications(this.getRecords(), now)) {
      const key = `${med.id}-${now.toDateString()}-${med.remind_at}`;
      if (this.lastFired.has(key)) continue;
      this.lastFired.add(key);
      this.center.publish({
        level: med.critical ? 'critical' : 'warning',
        title: med.critical ? '⚠️ Medicamento crítico' : '💊 Hora de tu medicamento',
        message: `${med.title}${med.dosage ? ` — ${med.dosage}` : ''}`,
      });
    }
  }
}

/** Programa recordatorios diarios del sistema (funcionan con la app cerrada). */
export async function scheduleDailyReminders(records: HealthRecord[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (Platform.OS === 'web') return;
  for (const r of records) {
    if (r.type !== 'medication' || !r.remind_at) continue;
    const [hour, minute] = r.remind_at.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: { title: '💊 Hora de tu medicamento', body: `${r.title}${r.dosage ? ` — ${r.dosage}` : ''}` },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  }
}
