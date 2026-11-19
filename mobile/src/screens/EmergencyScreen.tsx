import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Empty, Screen } from '../components/ui';
import { colors, recordMeta } from '../core/theme';
import { useRecords } from '../state/RecordsContext';
import { useAuth } from '../state/AuthContext';
import { RecordType } from '../domain/types';

// Ficha de emergencia: se construye 100% con datos locales (funciona sin conexión).
export default function EmergencyScreen() {
  const { records } = useRecords();
  const { user } = useAuth();
  const by = (t: RecordType) => records.filter((r) => r.type === t);
  const blood = by('blood_type')[0];

  return (
    <Screen>
      <Card style={{ backgroundColor: colors.danger }}>
        <Text style={{ color: '#FEE4E2', fontWeight: '700', letterSpacing: 1 }}>FICHA DE EMERGENCIA</Text>
        <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4 }}>{user?.name}</Text>
        <Text style={{ color: '#fff', marginTop: 6, fontSize: 16 }}>Tipo de sangre: <Text style={{ fontWeight: '800' }}>{blood?.title ?? 'No registrado'}</Text></Text>
      </Card>
      {records.length === 0 && <Empty icon="medkit-outline" text="Aún no hay información médica registrada." />}
      {(['allergy', 'medication', 'contact'] as RecordType[]).map((t) =>
        by(t).length ? (
          <View key={t}>
            <Text style={styles.h}>{recordMeta[t].label}</Text>
            <Card>
              {by(t).map((r) => (
                <View key={String(r.id)} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.t}>{r.critical ? '⚠️ ' : ''}{r.title}</Text>
                    {!!(r.dosage || r.details) && <Text style={styles.s}>{[r.dosage, r.details].filter(Boolean).join(' · ')}</Text>}
                  </View>
                  {t === 'contact' && !!r.phone && (
                    <Pressable onPress={() => Linking.openURL(`tel:${r.phone}`)} style={styles.call} accessibilityLabel={`Llamar a ${r.title}`}>
                      <Ionicons name="call" size={18} color="#fff" />
                    </Pressable>
                  )}
                </View>
              ))}
            </Card>
          </View>
        ) : null,
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 17, fontWeight: '800', color: colors.text, marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  t: { fontSize: 16, fontWeight: '700', color: colors.text },
  s: { color: colors.muted, fontSize: 13, marginTop: 2 },
  call: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
});
