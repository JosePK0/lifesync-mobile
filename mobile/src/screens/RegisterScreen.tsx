import React, { useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, Card, Input, Screen } from '../components/ui';
import { colors } from '../core/theme';
import { firstError, registerSchema } from '../domain/validation';
import { useAuth } from '../state/AuthContext';
import { errorMessage } from '../data/api';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  const submit = async () => {
    setApiError('');
    const p = registerSchema.safeParse(f);
    if (!p.success) return setErrors(firstError(p.error));
    setErrors({});
    setLoading(true);
    try {
      await signUp(p.data.name, p.data.email, p.data.password);
    } catch (e) {
      setApiError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>Crea tu cuenta</Text>
      <Text style={{ color: colors.muted, marginVertical: 8, marginBottom: 20 }}>Solo toma un minuto. Tus datos médicos viajan cifrados.</Text>
      <Card>
        {!!apiError && <Banner text={apiError} tone="danger" icon="alert-circle" />}
        <Input label="Nombre completo" icon="person-outline" value={f.name} onChangeText={set('name')} error={errors.name} placeholder="Ana Pérez" />
        <Input label="Correo electrónico" icon="mail-outline" value={f.email} onChangeText={set('email')} error={errors.email}
          autoCapitalize="none" keyboardType="email-address" placeholder="tu@correo.com" />
        <Input label="Contraseña" icon="lock-closed-outline" value={f.password} onChangeText={set('password')} error={errors.password}
          secureTextEntry autoCapitalize="none" placeholder="Mínimo 8 caracteres, letras y números" />
        <Button title="Registrarme" icon="person-add-outline" onPress={submit} loading={loading} />
      </Card>
    </Screen>
  );
}
