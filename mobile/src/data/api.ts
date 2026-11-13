import axios, { AxiosError } from 'axios';
import { API_URL } from '../core/config';
import { secureStorage } from './secureStorage';
import { isTokenExpired } from '../domain/parsing';

export const api = axios.create({ baseURL: API_URL, timeout: 12000, headers: { Accept: 'application/json' } });

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

// Interceptor HTTP global: extrae el JWT del contenedor seguro e inyecta Authorization: Bearer
api.interceptors.request.use(async (config) => {
  const token = await secureStorage.getToken();
  if (token && !isTokenExpired(token)) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const cfg = error.config as (typeof error.config & { _fallbackTried?: boolean }) | undefined;
    if (!error.response && cfg && !cfg._fallbackTried && (cfg.baseURL ?? API_URL).includes('localhost:8010')) {
      cfg._fallbackTried = true;
      cfg.baseURL = 'http://10.0.2.2:8010/api';
      return api.request(cfg);
    }
    if (error.response?.status === 401) onUnauthorized?.();
    return Promise.reject(error);
  },
);

export function isNetworkError(e: unknown): boolean {
  return axios.isAxiosError(e) && !e.response;
}

export function errorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    if (!e.response) return 'Sin conexión con el servidor. Tus datos locales siguen disponibles.';
    const d = e.response.data as { message?: string; errors?: Record<string, string[]> };
    if (d?.errors) return Object.values(d.errors)[0]?.[0] ?? 'Datos inválidos';
    if (d?.message) return d.message;
    return `Error del servidor (${e.response.status})`;
  }
  return 'Ocurrió un error inesperado';
}
