import { z } from 'zod';

// Validación sintáctica local (mejora UX y rendimiento); el servidor vuelve a validar.
export const loginSchema = z.object({
  email: z.string().trim().email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().trim().email('Correo inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Za-z]/, 'Debe incluir letras')
    .regex(/[0-9]/, 'Debe incluir números'),
});

const noMarkup = /^[^<>{}$;`]+$/u;

export const recordSchema = z.object({
  type: z.enum(['blood_type', 'allergy', 'medication', 'contact']),
  title: z.string().trim().min(1, 'Campo requerido').max(150).regex(noMarkup, 'Caracteres no permitidos'),
  details: z.string().max(2000).optional().nullable(),
  phone: z
    .string()
    .regex(/^\+?[0-9 ()\-]{7,20}$/, 'Teléfono inválido')
    .optional()
    .nullable()
    .or(z.literal('')),
  dosage: z.string().max(100).optional().nullable(),
  remind_at: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa formato HH:MM (24 h)')
    .optional()
    .nullable()
    .or(z.literal('')),
  critical: z.boolean(),
});

export function firstError(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? 'form');
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}
