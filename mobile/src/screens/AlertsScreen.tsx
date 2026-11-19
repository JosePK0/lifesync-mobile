import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Card, Empty } from '../components/ui';
import { colors } from '../core/theme';
import { useRecords } from '../state/RecordsContext';
import { usePermission } from '../core/permissions/usePermission';
import { sendTestPushNotification } from '../core/notifications/pushService';
import { errorMessage } from '../data/api';

const tone = { info: colors.teal, warning: colors.warning, critical: colors.danger } as const;

export default function AlertsScreen() {
  const { alerts, clearAlerts } = useRecords();
  const notif = usePermission('notifications');
  const [testingPush, setTestingPush] = useState(false);

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      await sendTestPushNotification();
    } catch (e) {
      Alert.alert('No se pudo enviar Push', errorMessage(e));
    } finally {
      setTestingPush(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 56 }}>
      <View style={styles.head}>
        <Text style={styles.title}>Alertas médicas</Text>
        <View style={styles.actionsRow}>
          <Pressable onPress={handleTestPush} disabled={testingPush} style={styles.actionPill}>
            <Ionicons name="paper-plane-outline" size={14} color={colors.teal} />
            <Text style={{ color: colors.teal, fontWeight: '700', marginLeft: 6, fontSize: 13 }}>
              {testingPush ? 'Enviando…' : 'Probar Push'}
            </Text>
          </Pressable>
          {alerts.length > 0 && (
            <Pressable onPress={clearAlerts} style={[styles.actionPill, { backgroundColor: '#FFE4E8' }]}>
              <Ionicons name="trash-outline" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700', marginLeft: 5, fontSize: 13 }}>Limpiar</Text>
            </Pressable>
          )}
        </View>
      </View>
      {notif.state !== 'granted' && (
        <View style={{ paddingHorizontal: 20 }}>
          <Banner tone="info" icon="notifications-outline"
            text={notif.state === 'blocked' ? 'Notificaciones bloqueadas: las alertas solo se verán dentro de la app.' : 'Activa las notificaciones para recibir recordatorios de medicamentos.'} />
          <Pressable onPress={notif.state === 'blocked' ? notif.openSettings : notif.request} style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{notif.state === 'blocked' ? 'Abrir ajustes' : 'Activar notificaciones'}</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={alerts}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        ListEmptyComponent={<Empty icon="notifications-off-outline" text="Sin alertas por ahora. Agrega una hora de recordatorio a tus medicamentos o presiona Probar Push." />}
        renderItem={({ item }) => (
          <Card style={{ flexDirection: 'row', padding: 14, borderLeftWidth: 5, borderLeftColor: tone[item.level] }}>
            <Ionicons name={item.level === 'info' ? 'information-circle' : 'alarm'} size={24} color={tone[item.level]} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{item.title}</Text>
              <Text style={{ color: colors.muted, marginTop: 2 }}>{item.message}</Text>
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{new Date(item.at).toLocaleTimeString()}</Text>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  actionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
});
