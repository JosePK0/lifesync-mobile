import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Banner } from '../components/ui';
import { colors, radius, shadow } from '../core/theme';
import { firstError, loginSchema } from '../domain/validation';
import { useAuth } from '../state/AuthContext';
import { errorMessage } from '../data/api';

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async () => {
    setApiError('');
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return setErrors(firstError(parsed.error));
    setErrors({});
    setLoading(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
    } catch (e) {
      setApiError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[colors.navy, colors.navy2, '#2B3F6E']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Ionicons name="heart" size={38} color="#fff" />
              <View style={styles.pulse}><Ionicons name="pulse" size={20} color={colors.primary} /></View>
            </View>
            <Text style={styles.brand}>LifeSync</Text>
            <Text style={styles.tagline}>Tu historial médico de emergencia,{'\n'}siempre contigo y protegido.</Text>
          </View>

          <View style={[styles.sheet, shadow]}>
            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.sub}>Inicia sesión para acceder a tu información</Text>
            {!!apiError && <Banner text={apiError} tone="danger" icon="alert-circle" />}
            <Input label="Correo electrónico" icon="mail-outline" placeholder="tu@correo.com" autoCapitalize="none"
              keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} error={errors.email} />
            <View>
              <Input label="Contraseña" icon="lock-closed-outline" placeholder="••••••••" secureTextEntry={!show}
                autoCapitalize="none" value={password} onChangeText={setPassword} error={errors.password} onSubmitEditing={submit} />
              <Pressable onPress={() => setShow(!show)} style={styles.eye} hitSlop={10} accessibilityLabel="Mostrar contraseña">
                <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
              </Pressable>
            </View>
            <Button title="Iniciar sesión" icon="log-in-outline" onPress={submit} loading={loading} style={{ marginTop: 6 }} />
            <View style={styles.sep}><View style={styles.line} /><Text style={styles.or}>o</Text><View style={styles.line} /></View>
            <Button title="Crear una cuenta" variant="secondary" onPress={() => navigation.navigate('Register')} />
            <View style={styles.secure}>
              <Ionicons name="shield-checkmark" size={14} color={colors.success} />
              <Text style={styles.secureText}>Sesión protegida con cifrado de hardware</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'flex-end' },
  hero: { alignItems: 'center', paddingTop: 70, paddingBottom: 30, paddingHorizontal: 30 },
  logo: { width: 84, height: 84, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }], ...shadow },
  pulse: { position: 'absolute', bottom: -6, right: -6, backgroundColor: '#fff', borderRadius: 14, padding: 5 },
  brand: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 18, letterSpacing: 0.5 },
  tagline: { color: '#B8C4E0', textAlign: 'center', marginTop: 8, lineHeight: 21, fontSize: 15 },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 34 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 20 },
  eye: { position: 'absolute', right: 14, top: 38 },
  sep: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { marginHorizontal: 12, color: colors.muted },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  secureText: { color: colors.muted, fontSize: 12, marginLeft: 6 },
});
