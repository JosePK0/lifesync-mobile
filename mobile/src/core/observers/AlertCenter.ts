// Patrón OBSERVER: AlertCenter es el sujeto; los observadores se suscriben y
// reciben cada alerta médica local sin acoplarse al emisor.
export type AlertLevel = 'info' | 'warning' | 'critical';

export interface MedicalAlert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  at: number;
  remote?: boolean;
}

export interface AlertObserver {
  update(alert: MedicalAlert): void;
}

export class AlertCenter {
  private observers = new Set<AlertObserver>();
  private history: MedicalAlert[] = [];

  subscribe(o: AlertObserver): () => void {
    this.observers.add(o);
    return () => this.observers.delete(o);
  }

  publish(input: Omit<MedicalAlert, 'id' | 'at'>): MedicalAlert {
    const alert: MedicalAlert = { ...input, id: `${Date.now()}-${this.history.length}`, at: Date.now() };
    this.history = [alert, ...this.history].slice(0, 50);
    this.observers.forEach((o) => o.update(alert));
    return alert;
  }

  getHistory(): MedicalAlert[] {
    return this.history;
  }

  clear(): void {
    this.history = [];
  }

  observerCount(): number {
    return this.observers.size;
  }
}

export const alertCenter = new AlertCenter();
