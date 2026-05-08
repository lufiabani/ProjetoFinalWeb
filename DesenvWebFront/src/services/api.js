// Cliente Axios partilhado: baseURL da API .NET e token Bearer do Keycloak em cada pedido.
import axios from 'axios';
import { getKeycloak } from '../keycloak';

const baseURL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5113'}/api`;

// Sem Content-Type global: GET com "application/json" força preflight CORS e o Safari acusa "access control checks".
export const api = axios.create({
  baseURL,
});

function pickTrimmedString(v) {
  return typeof v === 'string' && v.trim() ? v.trim() : '';
}

/** Primeira mensagem útil de erros de validação ASP.NET (`errors: { prop: ["msg"] }`). */
function primeiraMensagemValidacao(errors) {
  if (!errors || typeof errors !== 'object') return '';
  for (const v of Object.values(errors)) {
    if (Array.isArray(v) && v.length && typeof v[0] === 'string') return v[0];
    if (typeof v === 'string') return v;
  }
  return '';
}

/**
 * Texto amigável a partir de erros Axios contra a API .NET (ProblemDetails, validação, `mensagem` custom).
 */
export function mensagemErroApi(error, fallback = 'Ocorreu um erro.') {
  if (error == null) return fallback;
  const data = error.response?.data;
  if (typeof data === 'string') {
    const t = pickTrimmedString(data);
    return t || fallback;
  }
  if (data && typeof data === 'object') {
    const m =
      pickTrimmedString(data.mensagem) ||
      pickTrimmedString(data.detail) ||
      pickTrimmedString(data.title);
    if (m) return m;
    const v = primeiraMensagemValidacao(data.errors);
    if (v) return v;
  }
  if (!error.response && typeof error.message === 'string') return error.message || fallback;
  return fallback;
}

/** Evita vários `login()` em sequência se o refresh falhar em paralelo. */
let reauthRedirecionamentoAgendado = false;

// Renova o JWT se estiver perto de expirar (60s) antes de chamar a API — evita 401 intermitentes.
api.interceptors.request.use(async (config) => {
  const kc = getKeycloak();
  if (kc?.authenticated) {
    await kc.updateToken(60);
    config.headers.Authorization = `Bearer ${kc.token}`;
  }
  return config;
});

// 401: tenta forçar refresh do token e repetir o pedido uma vez; se falhar, reautentica no Keycloak.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error ?? {};
    if (response?.status !== 401 || !config || config.__retry401) {
      return Promise.reject(error);
    }
    const kc = getKeycloak();
    if (!kc?.authenticated) {
      return Promise.reject(error);
    }
    config.__retry401 = true;
    try {
      await kc.updateToken(-1);
      config.headers = config.headers ?? {};
      config.headers.Authorization = kc.token ? `Bearer ${kc.token}` : config.headers.Authorization;
      return api.request(config);
    } catch {
      if (!reauthRedirecionamentoAgendado) {
        reauthRedirecionamentoAgendado = true;
        kc.login({ redirectUri: window.location.href });
      }
      return Promise.reject(error);
    }
  },
);
