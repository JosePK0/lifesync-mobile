import { api } from './api';
import { secureStorage } from './secureStorage';
import { User } from '../domain/types';

interface AuthResponse {
  access_token: string;
  user: User;
}

export const authRepository = {
  async login(email: string, password: string): Promise<User> {
    const { data } = await api.post<AuthResponse>('/oauth/token', { grant_type: 'password', username: email, password });
    await secureStorage.setToken(data.access_token);
    return data.user;
  },
  async register(name: string, email: string, password: string): Promise<User> {
    const { data } = await api.post<AuthResponse>('/auth/register', { name, email, password });
    await secureStorage.setToken(data.access_token);
    return data.user;
  },
  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
  logout: () => secureStorage.clearToken(),
};
