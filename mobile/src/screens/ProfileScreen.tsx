import React, { useState } from 'react';
import { Alert, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Screen } from '../components/ui';
import { colors } from '../core/theme';
import { useAuth } from '../state/AuthContext';
import { useRecords } from '../state/RecordsContext';
import { errorMessage } from '../data/api';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { repo } = useRecords();
  const [busy, setBusy] = useState<string | null>(null);

  const exportAs = async (format: 'json' | 'csv') => {
    setBusy(format);
    try {
      const content = await repo.exportFile(format);
      await Share.share({ title: `lifesync-historial.${format}`, message: content });
    } catch (e) {
      Alert.alert('No se pudo exportar', errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const logout = () =>
    Alert.alert('Cerrar sesión', 'Se eliminará el token y los datos locales de este dispositivo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: async () => { await repo.clearLocal(); await signOut(); } },
    ]);

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 20 }}>
        <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800' }}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 12, color: colors.text }}>{user?.name}</Text>
        <Text style={{ color: colors.muted }}>{user?.email}</Text>
      </View>
      <Card>
        <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text, marginBottom: 4 }}>Exportar historial</Text>
        <Text style={{ color: colors.muted, marginBottom: 14 }}>JSON para sistemas médicos o CSV para aseguradoras.</Text>
        <Button title="Exportar JSON" icon="code-slash-outline" variant="secondary" loading={busy === 'json'} onPress={() => exportAs('json')} />
        <Button title="Exportar CSV" icon="grid-outline" variant="secondary" loading={busy === 'csv'} onPress={() => exportAs('csv')} style={{ marginTop: 10 }} />
      </Card>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="shield-checkmark" size={22} color={colors.success} />
          <Text style={{ marginLeft: 10, flex: 1, color: colors.muted }}>Token en Keystore/Keychain · tráfico solo HTTPS · datos locales cifrados</Text>
        </View>
      </Card>
      <Button title="Cerrar sesión" variant="danger" icon="log-out-outline" onPress={logout} />
    </Screen>
  );
}
