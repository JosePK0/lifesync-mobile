import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Contenedor seguro respaldado por hardware nativo: Android Keystore / iOS Keychain.
// En web (solo para vista previa en navegador) usa localStorage como respaldo.
const TOKEN_KEY = 'lifesync.jwt';
const CHUNK = 1500; // SecureStore limita ~2KB por valor

const getItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  return SecureStore.getItemAsync(key);
};

const setItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

const deleteItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

export const secureStorage = {
  getToken: () => getItem(TOKEN_KEY),
  setToken: (t: string) => setItem(TOKEN_KEY, t),
  clearToken: () => deleteItem(TOKEN_KEY),

  /** Guarda JSON grande en fragmentos cifrados (caché offline de datos médicos). */
  async setJson(name: string, value: unknown): Promise<void> {
    await this.removeJson(name);
    const s = JSON.stringify(value);
    const parts = Math.max(1, Math.ceil(s.length / CHUNK));
    for (let i = 0; i < parts; i++) {
      await setItem(`${name}.${i}`, s.slice(i * CHUNK, (i + 1) * CHUNK));
    }
    await setItem(`${name}.n`, String(parts));
  },

  async getJson<T>(name: string): Promise<T | null> {
    const n = Number(await getItem(`${name}.n`));
    if (!n) return null;
    let s = '';
    for (let i = 0; i < n; i++) s += (await getItem(`${name}.${i}`)) ?? '';
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  },

  async removeJson(name: string): Promise<void> {
    const n = Number(await getItem(`${name}.n`));
    for (let i = 0; i < n; i++) await deleteItem(`${name}.${i}`);
    await deleteItem(`${name}.n`);
  },
};
