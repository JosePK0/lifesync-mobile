import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, Input, Screen } from '../components/ui';
import { colors, radius, recordMeta } from '../core/theme';
import { firstError, recordSchema } from '../domain/validation';
import { useRecords } from '../state/RecordsContext';
import { errorMessage } from '../data/api';
import { RecordType } from '../domain/types';

const placeholders: Record<RecordType, string> = {
  blood_type: 'Ej. O+',
  allergy: 'Ej. Penicilina',
  medication: 'Ej. Metformina',
  contact: 'Nombre del contacto',
};

// Formulario dinámico: los campos cambian según el tipo de registro.
export default function RecordFormScreen({ navigation, route }: any) {
  const editing = route.params?.record;
  const { create, update } = useRecords();
  const [f, setF] = useState({
    type: (editing?.type ?? 'allergy') as RecordType,
    title: editing?.title ?? '',
    details: editing?.details ?? '',
    phone: editing?.phone ?? '',
    dosage: editing?.dosage ?? '',
    remind_at: editing?.remind_at ?? '',
    critical: editing?.critical ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (v: any) => setF({ ...f, [k]: v });

  const save = async () => {
    setApiError('');
    const parsed = recordSchema.safeParse(f);
    if (!parsed.success) return setErrors(firstError(parsed.error));
    setErrors({});
    const clean = (s?: string | null) => (s && s.trim() ? s.trim() : null);
    const payload = {
      ...parsed.data,
      details: clean(f.details),
      phone: f.type === 'contact' ? clean(f.phone) : null,
      dosage: f.type === 'medication' ? clean(f.dosage) : null,
      remind_at: f.type === 'medication' ? clean(f.remind_at) : null,
    };
    setLoading(true);
    try {
      if (editing) await update(editing.id, payload);
      else await create(payload as any);
      navigation.goBack();
    } catch (e) {
      setApiError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      {!!apiError && <Banner text={apiError} tone="danger" icon="alert-circle" />}
      {!editing && (
        <View style={styles.types}>
          {(Object.keys(recordMeta) as RecordType[]).map((t) => (
            <Pressable key={t} onPress={() => set('type')(t)} style={[styles.type, f.type === t && { backgroundColor: recordMeta[t].color, borderColor: recordMeta[t].color }]}>
              <Ionicons name={recordMeta[t].icon as any} size={20} color={f.type === t ? '#fff' : recordMeta[t].color} />
              <Text style={[styles.typeText, f.type === t && { color: '#fff' }]} numberOfLines={1}>{recordMeta[t].label.split(' ')[0]}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Card>
        <Input label={f.type === 'contact' ? 'Nombre' : 'Nombre / valor'} value={f.title} onChangeText={set('title')} error={errors.title} placeholder={placeholders[f.type]} />
        {f.type === 'contact' && <Input label="Teléfono" value={f.phone ?? ''} onChangeText={set('phone')} error={errors.phone} keyboardType="phone-pad" placeholder="+52 999 123 4567" />}
        {f.type === 'medication' && (
          <>
            <Input label="Dosis" value={f.dosage ?? ''} onChangeText={set('dosage')} error={errors.dosage} placeholder="500 mg cada 8 h" />
            <Input label="Recordatorio diario (HH:MM)" value={f.remind_at ?? ''} onChangeText={set('remind_at')} error={errors.remind_at} placeholder="08:30" keyboardType="numbers-and-punctuation" />
          </>
        )}
        <Input label="Notas" value={f.details ?? ''} onChangeText={set('details')} error={errors.details} multiline placeholder="Detalles adicionales" />
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: colors.text }}>Información crítica</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Se destaca en emergencias y en alertas</Text>
          </View>
          <Switch value={f.critical} onValueChange={set('critical')} trackColor={{ true: colors.primary }} />
        </View>
      </Card>
      <Button title={editing ? 'Guardar cambios' : 'Guardar registro'} icon="save-outline" onPress={save} loading={loading} />
      {editing && f.type === 'medication' && typeof editing.id === 'number' && (
        <Button title="Escanear / adjuntar receta" variant="secondary" icon="camera-outline" style={{ marginTop: 12 }}
          onPress={() => navigation.navigate('Scan', { recordId: editing.id })} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  types: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  type: { width: '23.5%', alignItems: 'center', paddingVertical: 12, borderRadius: radius.md, backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border },
  typeText: { fontSize: 11, fontWeight: '700', marginTop: 4, color: colors.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 4 },
});
