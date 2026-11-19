import { HealthRecord, RecordType } from './types';

const TYPES: RecordType[] = ['blood_type', 'allergy', 'medication', 'contact'];

/** Parseo defensivo de la respuesta del servidor: descarta elementos corruptos. */
export function parseRecords(raw: unknown): HealthRecord[] {
  if (!Array.isArray(raw)) return [];
  const out: HealthRecord[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    if ((typeof o.id !== 'number' && typeof o.id !== 'string') || typeof o.title !== 'string') continue;
    if (!TYPES.includes(o.type as RecordType)) continue;
    out.push({
      id: o.id,
      type: o.type as RecordType,
      title: o.title,
      details: (o.details as string) ?? null,
      phone: (o.phone as string) ?? null,
      dosage: (o.dosage as string) ?? null,
      remind_at: (o.remind_at as string) ?? null,
      critical: Boolean(o.critical),
      image_path: (o.image_path as string) ?? null,
    });
  }
  return out;
}

/** Lee `exp` (segundos) de un JWT sin verificar firma (la verifica el servidor). */
export function decodeJwtExp(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = typeof atob === 'function' ? atob(padded) : (globalThis as any).Buffer.from(padded, 'base64').toString('binary');
    const exp = JSON.parse(json).exp;
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null | undefined, nowMs = Date.now(), skewSec = 30): boolean {
  if (!token) return true;
  const exp = decodeJwtExp(token);
  if (exp === null) return true;
  return exp - skewSec <= Math.floor(nowMs / 1000);
}
