// Apunta por defecto al servidor en producción con HTTPS (Hostinger).
// Puede sobrescribirse mediante EXPO_PUBLIC_API_URL si se requiere entorno local.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://stjavila.com.mx/dmi-p/lifesync-api/public/api';
