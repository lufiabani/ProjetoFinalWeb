import axios from 'axios';
import { getKeycloak } from '../keycloak';

const baseURL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5113'}/api`;

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const kc = getKeycloak();
  if (kc?.authenticated) {
    await kc.updateToken(60);
    config.headers.Authorization = `Bearer ${kc.token}`;
  }
  return config;
});
