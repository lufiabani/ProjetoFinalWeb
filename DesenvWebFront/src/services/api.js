// Cliente Axios partilhado: baseURL da API .NET e token Bearer do Keycloak em cada pedido.
import axios from 'axios';
import { getKeycloak } from '../keycloak';

const baseURL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5113'}/api`;

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Renova o JWT se estiver perto de expirar (60s) antes de chamar a API — evita 401 intermitentes.
api.interceptors.request.use(async (config) => {
  const kc = getKeycloak();
  if (kc?.authenticated) {
    await kc.updateToken(60);
    config.headers.Authorization = `Bearer ${kc.token}`;
  }
  return config;
});
