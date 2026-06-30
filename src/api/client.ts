import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { navigationRef } from '../navigation/RootNavigator';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://ufok.ng/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_user');
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Auth' as never }] });
      }
    }
    return Promise.reject(err);
  },
);

export default api;
