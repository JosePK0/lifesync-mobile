import React, { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Banner, Card } from '../components/ui';
import { colors, radius, recordMeta, shadow } from '../core/theme';
import { useAuth } from '../state/AuthContext';
import { useRecords } from '../state/RecordsContext';
import { usePermission } from '../core/permissions/usePermission';
import { sendTestPushNotification } from '../core/notifications/pushService';
import { errorMessage, isNetworkError } from '../data/api';
import { RecordType } from '../domain/types';

function formatDisplayName(name?: string): string {
  if (!name) return 'Paciente';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const GRID_ROWS: [RecordType, RecordType][] = [
  ['blood_type', 'allergy'],
  ['medication', 'contact'],
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { records, offline, pending, refresh, repo, loading } = useRecords();
  const gps = usePermission('location');
  const insets = useSafeAreaInsets();
  const [sending, setSending] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const count = (t: RecordType) => records.filter((r) => r.type === t).length;
  const blood = records.find((r) => r.type === 'blood_type');
  const criticals = records.filter((r) => r.critical);
  const displayName = formatDisplayName(user?.name);
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('');

  // SOS con degradación gradual: sin GPS no hay rastreo en la nube, pero todo lo demás funciona.
  const sos = async () => {
    setSending(true);
    try {
      let state = gps.state;
      if (state !== 'granted') state = await gps.request();
      if (state !== 'granted') {
        Alert.alert(
          'Ubicación desactivada',
          'No compartiremos tu ubicación en la nube, pero tu historial clínico sigue disponible sin conexión.',
          state === 'blocked' ? [{ text: 'Ahora no' }, { text: 'Abrir ajustes', onPress: gps.openSettings }] : [{ text: 'Entendido' }],
        );
        navigation.navigate('Emergency');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await repo.reportIncident(pos.coords.latitude, pos.coords.longitude);
      Alert.alert('Incidente registrado', 'Tu ubicación fue enviada a la nube.');
      navigation.navigate('Emergency');
    } catch (e) {
      Alert.alert(
        isNetworkError(e) ? 'Sin conexión' : 'No se pudo registrar',
        'Mostrando tu ficha de emergencia local.',
      );
      navigation.navigate('Emergency');
    } finally {
      setSending(false);
    }
  };

  const handleTestPush = async () => {
    setPushLoading(true);
    try {
      await sendTestPushNotification({
        title: '🔔 Push Médico LifeSync',
        body: `Hola ${displayName}, tus alertas médicas push están activas.`,
        level: 'info',
      });
    } catch (e) {
      Alert.alert('Error al enviar Push', errorMessage(e));
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#fff" />}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.navy, colors.navy2]}
        style={[styles.header, { paddingTop: Math.max(insets.top + 14, 48) }]}
      >
        <View style={styles.profileRow}>
          <Pressable onPress={() => navigation.navigate('Perfil')} style={styles.avatar} accessibilityLabel="Ir a perfil">
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
          <View style={{ flex: 1, marginLeft: 14, paddingRight: 48 }}>
            <Text style={styles.hi}>Hola, bienvenido</Text>
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Historial', { type: 'blood_type' })}
          style={styles.bloodBar}
        >
          <View style={styles.bloodBadge}>
            <Ionicons name="water" size={15} color="#fff" />
            <Text style={styles.bloodBadgeText}>{blood?.title ?? 'Sin definir'}</Text>
          </View>
          <Text style={styles.bloodLabel}>Grupo sanguíneo registrado</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </Pressable>
      </LinearGradient>

      <View style={styles.body}>
        {offline && <Banner text="Sin conexión: mostrando datos guardados en tu dispositivo." />}
        {pending > 0 && <Banner tone="info" icon="sync" text={`${pending} cambio(s) pendiente(s) de sincronizar.`} />}

        <Pressable onPress={sos} disabled={sending} accessibilityRole="button" accessibilityLabel="Botón de emergencia SOS">
          <LinearGradient colors={['#EF4444', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.sos, shadow]}>
            <View style={styles.sosIcon}>
              <Ionicons name="warning" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sosTitle}>{sending ? 'Enviando ubicación…' : 'EMERGENCIA SOS'}</Text>
              <Text style={styles.sosSub}>Envía tu ubicación GPS y abre tu ficha médica</Text>
            </View>
            <View style={styles.sosArrow}>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>

        {gps.state !== 'granted' && gps.state !== 'undetermined' && (
          <Banner tone="warning" icon="location-outline" text="GPS desactivado: el rastreo en la nube está deshabilitado." />
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.section}>Tu historial médico</Text>
          <Pressable onPress={() => navigation.navigate('RecordForm', {})} style={styles.newRecordPill}>
            <Ionicons name="add-circle" size={16} color={colors.primary} />
            <Text style={styles.addLink}>Agregar</Text>
          </Pressable>
        </View>

        {GRID_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {row.map((t) => {
              const meta = recordMeta[t];
              const label = t === 'contact' ? 'Contactos SOS' : meta.label;
              return (
                <Pressable
                  key={t}
                  style={styles.gridCol}
                  onPress={() => navigation.navigate('Historial', { type: t })}
                >
                  <Card style={styles.gridCard}>
                    <View style={styles.gridCardTop}>
                      <View style={[styles.iconBox, { backgroundColor: meta.color + '18' }]}>
                        <Ionicons name={meta.icon as any} size={22} color={meta.color} />
                      </View>
                      <View style={styles.arrowCircle}>
                        <Ionicons name="chevron-forward" size={14} color="#64748B" />
                      </View>
                    </View>
                    <View style={{ marginTop: 14 }}>
                      <Text style={styles.count}>{count(t)}</Text>
                      <Text style={styles.cardLabel} numberOfLines={1}>{label}</Text>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        ))}

        <Card style={styles.pushCard}>
          <View style={styles.pushIcon}>
            <Ionicons name="notifications" size={20} color={colors.teal} />
          </View>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.pushTitle}>Probar Push Notification</Text>
            <Text style={styles.pushSub} numberOfLines={1}>Envía una alerta en vivo desde la API</Text>
          </View>
          <Pressable
            onPress={handleTestPush}
            disabled={pushLoading}
            style={({ pressed }) => [styles.pushBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.pushBtnText}>{pushLoading ? '…' : 'Enviar'}</Text>
          </Pressable>
        </Card>

        {criticals.length > 0 && (
          <>
            <Text style={[styles.section, { marginBottom: 10, marginTop: 4 }]}>Información crítica</Text>
            <Card>
              {criticals.slice(0, 4).map((c) => (
                <View key={String(c.id)} style={styles.critRow}>
                  <Ionicons name="alert-circle" size={20} color={colors.danger} />
                  <Text style={styles.critText}>{c.title}</Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  hi: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  name: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 1 },
  bloodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  bloodBadgeText: { color: '#fff', fontWeight: '800', marginLeft: 5, fontSize: 13 },
  bloodLabel: { flex: 1, color: '#E2E8F0', marginLeft: 10, fontSize: 13, fontWeight: '600' },
  body: { paddingHorizontal: 18, paddingTop: 16 },
  sos: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    marginBottom: 18,
  },
  sosIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sosTitle: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
  sosSub: { color: '#FEE4E2', fontSize: 12, marginTop: 2 },
  sosArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  section: { fontSize: 18, fontWeight: '800', color: colors.text },
  newRecordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addLink: { fontSize: 13, fontWeight: '700', color: colors.primary, marginLeft: 4 },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCol: {
    width: '48.3%',
  },
  gridCard: {
    marginBottom: 0,
    height: 132,
    justifyContent: 'space-between',
    padding: 15,
  },
  gridCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { fontSize: 26, fontWeight: '800', color: colors.text, lineHeight: 30 },
  cardLabel: { color: colors.muted, fontSize: 13, marginTop: 2, fontWeight: '600' },
  pushCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginTop: 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    backgroundColor: '#F0FDFA',
  },
  pushIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pushTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  pushSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  pushBtn: {
    backgroundColor: colors.teal,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pushBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  critRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  critText: { marginLeft: 10, fontSize: 15, color: colors.text, fontWeight: '600' },
});
