export const colors = {
  primary: '#E5384F',
  primaryDark: '#B8213A',
  navy: '#0F1B33',
  navy2: '#1C2E52',
  teal: '#14B8A6',
  bg: '#F3F6FB',
  card: '#FFFFFF',
  text: '#0F1B33',
  muted: '#6B7690',
  border: '#E1E7F0',
  danger: '#D92D20',
  warning: '#F79009',
  success: '#12B76A',
};

export const radius = { sm: 10, md: 16, lg: 24 };

export const shadow = {
  shadowColor: '#0F1B33',
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};

export const recordMeta = {
  blood_type: { label: 'Tipo de sangre', icon: 'water', color: '#E5384F' },
  allergy: { label: 'Alergias', icon: 'warning', color: '#F79009' },
  medication: { label: 'Medicamentos', icon: 'medkit', color: '#7A5AF8' },
  contact: { label: 'Contactos de emergencia', icon: 'call', color: '#14B8A6' },
} as const;
