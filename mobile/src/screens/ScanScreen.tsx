import React, { useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Banner, Button, Screen } from '../components/ui';
import { colors } from '../core/theme';
import { usePermission } from '../core/permissions/usePermission';
import { useRecords } from '../state/RecordsContext';
import { errorMessage } from '../data/api';

export default function ScanScreen({ navigation, route }: any) {
  const { recordId } = route.params;
  const cam = usePermission('camera');
  const { repo, refresh } = useRecords();
  const ref = useRef<CameraView>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (uri: string) => {
    setBusy(true);
    try {
      await repo.uploadImage(recordId, uri);
      await refresh();
      Alert.alert('Receta guardada', 'La imagen se adjuntó al medicamento.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('No se pudo subir', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled) setPhoto(r.assets[0].uri);
  };

  const shoot = async () => {
    try {
      const p = await ref.current?.takePictureAsync({ quality: 0.6 });
      if (p) setPhoto(p.uri);
    } catch {
      Alert.alert('Cámara', 'No se pudo tomar la foto.');
    }
  };

  if (photo) {
    return (
      <Screen>
        <Image source={{ uri: photo }} style={styles.preview} />
        <Button title="Usar esta foto" icon="cloud-upload-outline" onPress={() => upload(photo)} loading={busy} />
        <Button title="Repetir" variant="ghost" onPress={() => setPhoto(null)} style={{ marginTop: 8 }} />
      </Screen>
    );
  }

  // Degradación gradual: sin cámara se ofrece la galería, la app no falla.
  if (cam.state !== 'granted') {
    return (
      <Screen>
        <Banner tone="info" icon="camera-outline" text={cam.state === 'blocked' ? 'La cámara está bloqueada. Actívala en Ajustes o elige una imagen de la galería.' : 'Necesitamos la cámara para escanear tu receta.'} />
        {cam.state === 'blocked'
          ? <Button title="Abrir ajustes" onPress={cam.openSettings} />
          : <Button title="Permitir cámara" icon="camera" onPress={cam.request} loading={cam.state === 'requesting'} />}
        <Button title="Elegir de la galería" variant="secondary" icon="images-outline" onPress={pick} style={{ marginTop: 12 }} />
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={ref} style={{ flex: 1 }} facing="back" />
      <View style={styles.controls}>
        <Button title="Galería" variant="secondary" onPress={pick} style={{ flex: 1, marginRight: 10 }} />
        <Button title="Capturar" icon="camera" onPress={shoot} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', height: 420, borderRadius: 20, marginBottom: 16, backgroundColor: colors.border },
  controls: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row' },
});
