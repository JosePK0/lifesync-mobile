import { api, isNetworkError } from './api';
import { secureStorage } from './secureStorage';
import { parseRecords } from '../domain/parsing';
import { HealthRecord, RecordInput } from '../domain/types';

type Op =
  | { op: 'create'; tempId: string; data: RecordInput }
  | { op: 'update'; id: number | string; data: Partial<RecordInput> }
  | { op: 'delete'; id: number | string };

const cacheKey = (uid: number) => `lifesync.records.${uid}`;
const queueKey = (uid: number) => `lifesync.queue.${uid}`;

/**
 * Repositorio offline-first: lee de la nube y cachea cifrado en hardware seguro;
 * si no hay red, sirve la caché y encola las escrituras para sincronizar luego.
 */
export class RecordsRepository {
  constructor(private readonly uid: number) {}

  private async cache(): Promise<HealthRecord[]> {
    return (await secureStorage.getJson<HealthRecord[]>(cacheKey(this.uid))) ?? [];
  }
  private saveCache = (r: HealthRecord[]) => secureStorage.setJson(cacheKey(this.uid), r);
  private async queue(): Promise<Op[]> {
    return (await secureStorage.getJson<Op[]>(queueKey(this.uid))) ?? [];
  }
  private saveQueue = (q: Op[]) => secureStorage.setJson(queueKey(this.uid), q);

  async pendingCount(): Promise<number> {
    return (await this.queue()).length;
  }

  /** Devuelve registros y si provienen de la caché (offline). */
  async list(): Promise<{ records: HealthRecord[]; offline: boolean }> {
    try {
      await this.sync();
      const { data } = await api.get('/records');
      const records = parseRecords(data);
      await this.saveCache(records);
      return { records, offline: false };
    } catch (e) {
      if (isNetworkError(e)) return { records: await this.cache(), offline: true };
      throw e;
    }
  }

  async create(input: RecordInput): Promise<HealthRecord> {
    try {
      const { data } = await api.post('/records', input);
      const rec = parseRecords([data])[0];
      await this.saveCache([rec, ...(await this.cache())]);
      return rec;
    } catch (e) {
      if (!isNetworkError(e)) throw e;
      const tempId = `local-${Date.now()}`;
      const rec: HealthRecord = { ...input, id: tempId, pending: true };
      await this.saveQueue([...(await this.queue()), { op: 'create', tempId, data: input }]);
      await this.saveCache([rec, ...(await this.cache())]);
      return rec;
    }
  }

  async update(id: number | string, input: Partial<RecordInput>): Promise<void> {
    const apply = async () =>
      this.saveCache((await this.cache()).map((r) => (r.id === id ? { ...r, ...input } : r)));
    if (typeof id === 'string') {
      // aún no sincronizado: modifica la operación create encolada
      const q = (await this.queue()).map((o) => (o.op === 'create' && o.tempId === id ? { ...o, data: { ...o.data, ...input } } : o));
      await this.saveQueue(q);
      return apply();
    }
    try {
      await api.put(`/records/${id}`, input);
    } catch (e) {
      if (!isNetworkError(e)) throw e;
      await this.saveQueue([...(await this.queue()), { op: 'update', id, data: input }]);
    }
    await apply();
  }

  async remove(id: number | string): Promise<void> {
    const dropCache = async () => this.saveCache((await this.cache()).filter((r) => r.id !== id));
    if (typeof id === 'string') {
      await this.saveQueue((await this.queue()).filter((o) => !(o.op === 'create' && o.tempId === id)));
      return dropCache();
    }
    try {
      await api.delete(`/records/${id}`);
    } catch (e) {
      if (!isNetworkError(e)) throw e;
      await this.saveQueue([...(await this.queue()), { op: 'delete', id }]);
    }
    await dropCache();
  }

  /** Reenvía operaciones pendientes. Se detiene si vuelve a fallar la red. */
  async sync(): Promise<void> {
    let q = await this.queue();
    while (q.length) {
      const o = q[0];
      try {
        if (o.op === 'create') await api.post('/records', o.data);
        else if (o.op === 'update') await api.put(`/records/${o.id}`, o.data);
        else await api.delete(`/records/${o.id}`);
      } catch (e) {
        if (isNetworkError(e)) throw e;
        // error de validación/permiso: se descarta la operación para no bloquear la cola
      }
      q = q.slice(1);
      await this.saveQueue(q);
    }
  }

  async uploadImage(id: number, uri: string): Promise<void> {
    const form = new FormData();
    const name = uri.split('/').pop() ?? 'receta.jpg';
    const type = name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    form.append('image', { uri, name, type } as unknown as Blob);
    await api.post(`/records/${id}/image`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  }

  async exportFile(format: 'json' | 'csv'): Promise<string> {
    const { data } = await api.get<string>('/records/export', { params: { format }, responseType: 'text', transformResponse: (r) => r });
    return data;
  }

  async reportIncident(lat: number, lng: number): Promise<void> {
    await api.post('/incidents', { latitude: lat, longitude: lng });
  }

  async clearLocal(): Promise<void> {
    await secureStorage.removeJson(cacheKey(this.uid));
    await secureStorage.removeJson(queueKey(this.uid));
  }
}
