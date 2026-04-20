// Comentários por filme; listagem pode ser anónima, escrita exige sessão (Bearer no api.js).
import { api } from './api';

export async function listarComentariosPorFilme(filmeId) {
  const { data } = await api.get('/comentarios', { params: { filmeId } });
  return Array.isArray(data) ? data : [];
}

export async function criarComentario(payload) {
  const { data } = await api.post('/comentarios', {
    filmeId: Number(payload.filmeId),
    corpo: payload.corpo,
  });
  return data;
}

export async function editarComentario(id, corpo) {
  await api.put(`/comentarios/${id}`, { corpo });
}

export async function apagarComentario(id) {
  await api.delete(`/comentarios/${id}`);
}
