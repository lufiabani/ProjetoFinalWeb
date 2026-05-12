// CRUD mínimo de favoritos do utilizador autenticado (filme tem de existir na base antes).
import { api } from './api';

export async function listarFavoritos() {
  const { data } = await api.get('/favoritos');
  return data;
}

export async function adicionarFavorito(filmeId) {
  const { data } = await api.post('/favoritos', { filmeId });
  return data;
}

export async function removerFavorito(filmeId) {
  const { data } = await api.delete(`/favoritos/${filmeId}`);
  return data;
}
