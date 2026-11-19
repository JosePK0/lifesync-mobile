jest.mock('expo-notifications', () => ({ scheduleNotificationAsync: jest.fn(), SchedulableTriggerInputTypes: { DAILY: 'daily' }, cancelAllScheduledNotificationsAsync: jest.fn() }));
import { AlertCenter } from '../src/core/observers/AlertCenter';
import { dueMedications, ReminderService } from '../src/core/observers/ReminderService';
import { HealthRecord } from '../src/domain/types';

const med = (over: Partial<HealthRecord> = {}): HealthRecord => ({ id: 1, type: 'medication', title: 'Metformina', critical: true, remind_at: '08:30', ...over });

describe('patrón Observer', () => {
  it('notifica a todos los observadores y permite desuscribir', () => {
    const c = new AlertCenter();
    const a = jest.fn();
    const b = jest.fn();
    const offA = c.subscribe({ update: a });
    c.subscribe({ update: b });
    c.publish({ level: 'info', title: 't', message: 'm' });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    offA();
    c.publish({ level: 'info', title: 't', message: 'm' });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
    expect(c.getHistory()).toHaveLength(2);
  });
  it('recordatorio se dispara una sola vez a la hora indicada', () => {
    const c = new AlertCenter();
    const spy = jest.fn();
    c.subscribe({ update: spy });
    const svc = new ReminderService(c, () => [med()]);
    const t = new Date(2026, 0, 1, 8, 30, 0);
    svc.tick(t);
    svc.tick(t);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].level).toBe('critical');
  });
  it('filtra medicamentos por hora', () => {
    expect(dueMedications([med(), med({ id: 2, remind_at: '09:00' })], new Date(2026, 0, 1, 9, 0))).toHaveLength(1);
  });
});
