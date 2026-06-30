import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../api/client';

async function registerFcmToken(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.getPermissionsAsync();
    const finalStatus = status === 'granted'
      ? status
      : (await Notifications.requestPermissionsAsync()).status;
    if (finalStatus !== 'granted') return;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await api.post('/auth/fcm-token', { token, platform: 'expo' });
  } catch {}
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'tenant' | 'landlord' | 'agent' | 'admin' | 'support';
  avatar: string | null;
  is_kyc_verified: boolean;
  is_professionally_verified: boolean;
  referral_code: string | null;
  renter_score?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  hydrated: false,

  hydrate: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    const userRaw = await SecureStore.getItemAsync('auth_user');
    if (token && userRaw) {
      set({ token, user: JSON.parse(userRaw), hydrated: true });
    } else {
      set({ hydrated: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { token, user } = data.data;
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
      set({ token, user, loading: false });
      registerFcmToken();
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (payload) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', payload);
      const { token, user } = data.data;
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
      set({ token, user, loading: false });
      registerFcmToken();
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
    set({ user: null, token: null });
  },

  setUser: (user) => {
    SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    set({ user });
  },
}));
