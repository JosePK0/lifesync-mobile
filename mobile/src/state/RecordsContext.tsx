import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { RecordsRepository } from '../data/recordsRepository';
import { HealthRecord, RecordInput } from '../domain/types';
import { useAuth } from './AuthContext';
import { alertCenter, AlertObserver, MedicalAlert } from '../core/observers/AlertCenter';
import { NotificationObserver, ReminderService, scheduleDailyReminders } from '../core/observers/ReminderService';
import { registerDevicePushToken, subscribeRemotePushToAlertCenter } from '../core/notifications/pushService';

interface RecordsState {
  records: HealthRecord[];
  offline: boolean;
  loading: boolean;
  pending: number;
  alerts: MedicalAlert[];
  repo: RecordsRepository;
  refresh: () => Promise<void>;
  create: (i: RecordInput) => Promise<HealthRecord>;
  update: (id: number | string, i: Partial<RecordInput>) => Promise<void>;
  remove: (id: number | string) => Promise<void>;
  clearAlerts: () => void;
}

const Ctx = createContext<RecordsState>(null as unknown as RecordsState);
export const useRecords = () => useContext(Ctx);

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const repo = useMemo(() => new RecordsRepository(user!.id), [user]);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(0);
  const [alerts, setAlerts] = useState<MedicalAlert[]>(alertCenter.getHistory());
  const ref = useRef<HealthRecord[]>([]);
  ref.current = records;

  const refresh = useCallback(async () => {
    try {
      const r = await repo.list();
      setRecords(r.records);
      setOffline(r.offline);
      setPending(await repo.pendingCount());
    } catch {
      /* error no de red: se conserva lo mostrado */
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    refresh();
    // Reintenta sincronizar cuando regresa la conexión
    const unsub = NetInfo.addEventListener((s) => {
      if (s.isConnected && s.isInternetReachable !== false) refresh();
      else setOffline(true);
    });
    return unsub;
  }, [refresh]);

  // OBSERVER: la UI y las notificaciones locales/remotas (FCM) se suscriben al AlertCenter
  useEffect(() => {
    const uiObserver: AlertObserver = { update: () => setAlerts([...alertCenter.getHistory()]) };
    const offUi = alertCenter.subscribe(uiObserver);
    const offNotif = alertCenter.subscribe(new NotificationObserver());
    const offRemotePush = subscribeRemotePushToAlertCenter(alertCenter);
    const reminder = new ReminderService(alertCenter, () => ref.current);
    reminder.start();
    registerDevicePushToken().catch(() => undefined);
    return () => {
      offUi();
      offNotif();
      offRemotePush();
      reminder.stop();
    };
  }, []);

  useEffect(() => {
    scheduleDailyReminders(records).catch(() => undefined);
  }, [records]);

  // Alerta cuando hay datos sin sincronizar por falta de red
  useEffect(() => {
    if (offline && pending > 0) {
      alertCenter.publish({ level: 'info', title: 'Modo sin conexión', message: `${pending} cambio(s) se sincronizarán al reconectar.` });
    }
  }, [offline, pending]);

  const value: RecordsState = {
    records,
    offline,
    loading,
    pending,
    alerts,
    repo,
    refresh,
    create: async (i) => {
      const r = await repo.create(i);
      await refresh();
      return r;
    },
    update: async (id, i) => {
      await repo.update(id, i);
      await refresh();
    },
    remove: async (id) => {
      await repo.remove(id);
      await refresh();
    },
    clearAlerts: () => {
      alertCenter.clear();
      setAlerts([]);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
