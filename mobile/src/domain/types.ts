export type RecordType = 'blood_type' | 'allergy' | 'medication' | 'contact';

export interface HealthRecord {
  id: number | string; // string => creado offline (pendiente de sincronizar)
  type: RecordType;
  title: string;
  details?: string | null;
  phone?: string | null;
  dosage?: string | null;
  remind_at?: string | null;
  critical: boolean;
  image_path?: string | null;
  pending?: boolean;
}

export type RecordInput = Omit<HealthRecord, 'id' | 'image_path' | 'pending'>;

export interface User {
  id: number;
  name: string;
  email: string;
}
