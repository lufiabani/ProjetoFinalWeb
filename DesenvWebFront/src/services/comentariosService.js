import { api } from './api';

/** @param {number|string} filmeId */
export async function listarComentariosPorFilme(filmeId) {
  const { data } = await api.get('/comentarios', { params: { filmeId } });
  return Array.isArray(data) ? data : [];
}

/** @param {{ filmeId: number|string, corpo: string }} payload */
export async function criarComentario(payload) {
  const { data } = await api.post('/comentarios', {
    filmeId: Number(payload.filmeId),
    corpo: payload.corpo,
  });
  return data;
}

/** @param {number|string} id @param {string} corpo */
export async function editarComentario(id, corpo) {
  await api.put(`/comentarios/${id}`, { corpo });
}

/** @param {number|string} id */
export async function apagarComentario(id) {
  await api.delete(`/comentarios/${id}`);
}
