import React from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput,
  TextInputProps, View, ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../core/theme';

export function Button({
  title, onPress, loading, variant = 'primary', icon, disabled, style,
}: {
  title: string; onPress: () => void; loading?: boolean; variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean; style?: ViewStyle;
}) {
  const isPrimary = variant === 'primary' || variant === 'danger';
  const content = (
    <View style={styles.btnInner}>
      {loading ? <ActivityIndicator color={isPrimary ? '#fff' : colors.primary} /> : (
        <>
          {icon && <Ionicons name={icon} size={18} color={isPrimary ? '#fff' : colors.primary} style={{ marginRight: 8 }} />}
          <Text style={[styles.btnText, { color: isPrimary ? '#fff' : variant === 'ghost' ? colors.muted : colors.primary }]}>{title}</Text>
        </>
      )}
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={variant === 'danger' ? ['#F04438', '#B42318'] : [colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.btn, shadow]}
        >{content}</LinearGradient>
      ) : (
        <View style={[styles.btn, variant === 'secondary' && styles.btnSecondary]}>{content}</View>
      )}
    </Pressable>
  );
}

export function Input({ label, error, icon, ...props }: TextInputProps & { label: string; error?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focus && { borderColor: colors.primary }, !!error && { borderColor: colors.danger }]}>
        {icon && <Ionicons name={icon} size={18} color={colors.muted} style={{ marginRight: 10 }} />}
        <TextInput
          {...props}
          placeholderTextColor="#9AA5BC"
          onFocus={(e) => { setFocus(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocus(false); props.onBlur?.(e); }}
          style={[styles.input, props.multiline && { height: 90, textAlignVertical: 'top', paddingTop: 12 }]}
        />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, shadow, style]}>{children}</View>;
}

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const body = scroll ? (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
  ) : <View style={{ flex: 1, padding: 20 }}>{children}</View>;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {body}
    </KeyboardAvoidingView>
  );
}

export function Banner({ text, tone = 'warning', icon = 'cloud-offline' }: { text: string; tone?: 'warning' | 'info' | 'danger'; icon?: keyof typeof Ionicons.glyphMap }) {
  const c = tone === 'danger' ? colors.danger : tone === 'info' ? colors.teal : colors.warning;
  return (
    <View style={[styles.banner, { backgroundColor: c + '1A', borderColor: c + '55' }]}>
      <Ionicons name={icon} size={18} color={c} />
      <Text style={[styles.bannerText, { color: c }]}>{text}</Text>
    </View>
  );
}

export function Empty({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ alignItems: 'center', padding: 32 }}>
      <Ionicons name={icon} size={48} color={colors.border} />
      <Text style={{ color: colors.muted, marginTop: 10, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: radius.md, paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center' },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.primary + '55' },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 22 },
  btnText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5,
    borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14,
  },
  input: { flex: 1, height: 50, fontSize: 16, color: colors.text },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, marginBottom: 14 },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.md, borderWidth: 1, marginBottom: 14 },
  bannerText: { marginLeft: 10, flex: 1, fontSize: 13, fontWeight: '600' },
});
