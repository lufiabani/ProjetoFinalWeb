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
  await api.delete(`/favoritos/${filmeId}`);
}
