import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Card, Empty } from '../components/ui';
import { colors, radius, recordMeta, shadow } from '../core/theme';
import { useRecords } from '../state/RecordsContext';
import { HealthRecord, RecordType } from '../domain/types';
import { errorMessage } from '../data/api';

const filters: ('all' | RecordType)[] = ['all', 'blood_type', 'allergy', 'medication', 'contact'];

export default function RecordsScreen({ navigation, route }: any) {
  const { records, loading, refresh, remove, offline } = useRecords();
  const [filter, setFilter] = useState<'all' | RecordType>('all');

  useEffect(() => {
    if (route.params?.type) setFilter(route.params.type);
  }, [route.params?.type]);

  const data = records.filter((r) => filter === 'all' || r.type === filter);

  const confirmDelete = (r: HealthRecord) =>
    Alert.alert('Eliminar registro', `¿Eliminar "${r.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => remove(r.id).catch((e) => Alert.alert('Error', errorMessage(e))) },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 6 }}>
        <Text style={styles.title}>Historial clínico</Text>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false} data={filters} keyExtractor={(i) => i}
          style={{ marginVertical: 12 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => setFilter(item)} style={[styles.chip, filter === item && styles.chipOn]}>
              <Text style={[styles.chipText, filter === item && { color: '#fff' }]}>{item === 'all' ? 'Todos' : recordMeta[item].label}</Text>
            </Pressable>
          )}
        />
        {offline && <Banner text="Modo sin conexión: los cambios se sincronizarán después." />}
      </View>
      <FlatList
        data={data}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        ListEmptyComponent={<Empty icon="document-text-outline" text="Aún no tienes registros. Toca + para agregar el primero." />}
        renderItem={({ item }) => {
          const m = recordMeta[item.type];
          return (
            <Pressable onPress={() => navigation.navigate('RecordForm', { record: item })}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 12 }}>
                <View style={[styles.icon, { backgroundColor: m.color + '1F' }]}><Ionicons name={m.icon as any} size={22} color={m.color} /></View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={styles.rTitle}>{item.title}</Text>
                  <Text style={styles.rSub} numberOfLines={1}>
                    {[m.label, item.dosage, item.phone, item.remind_at && `⏰ ${item.remind_at}`].filter(Boolean).join(' · ')}
                  </Text>
                  {item.pending && <Text style={styles.pending}>● Pendiente de sincronizar</Text>}
                </View>
                {item.critical && <Ionicons name="alert-circle" size={20} color={colors.danger} style={{ marginRight: 8 }} />}
                <Pressable onPress={() => confirmDelete(item)} hitSlop={10} accessibilityLabel="Eliminar">
                  <Ionicons name="trash-outline" size={20} color={colors.muted} />
                </Pressable>
              </Card>
            </Pressable>
          );
        }}
      />
      <Pressable style={[styles.fab, shadow]} onPress={() => navigation.navigate('RecordForm', {})} accessibilityLabel="Agregar registro">
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  rSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pending: { color: colors.warning, fontSize: 11, marginTop: 3, fontWeight: '600' },
  fab: { position: 'absolute', right: 22, bottom: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
