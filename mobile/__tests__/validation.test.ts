import { loginSchema, recordSchema, registerSchema } from '../src/domain/validation';

describe('validaciones de formularios', () => {
  it('rechaza correo inválido', () => {
    expect(loginSchema.safeParse({ email: 'x', password: 'a' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'a' }).success).toBe(true);
  });
  it('exige contraseña fuerte', () => {
    const base = { name: 'Ana', email: 'a@b.com' };
    expect(registerSchema.safeParse({ ...base, password: '1234' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: 'soloLetras' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: 'Segura123' }).success).toBe(true);
  });
  it('bloquea marcado/inyección en el título', () => {
    const ok = { type: 'allergy', title: 'Polen', critical: false };
    expect(recordSchema.safeParse(ok).success).toBe(true);
    expect(recordSchema.safeParse({ ...ok, title: '<script>x</script>' }).success).toBe(false);
    expect(recordSchema.safeParse({ ...ok, type: 'otro' }).success).toBe(false);
  });
  it('valida hora y teléfono', () => {
    const med = { type: 'medication', title: 'Met', critical: false };
    expect(recordSchema.safeParse({ ...med, remind_at: '08:30' }).success).toBe(true);
    expect(recordSchema.safeParse({ ...med, remind_at: '25:00' }).success).toBe(false);
    expect(recordSchema.safeParse({ type: 'contact', title: 'Mamá', critical: false, phone: "1' OR 1=1" }).success).toBe(false);
    expect(recordSchema.safeParse({ type: 'contact', title: 'Mamá', critical: false, phone: '+52 999 123 4567' }).success).toBe(true);
  });
});
