// Comentários por filme; listagem pode ser anónima, escrita exige sessão (Bearer no api.js).
import { api } from './api';

export async function listarComentariosPorFilme(filmeId) {
  const { data } = await api.get('/comentarios', { params: { filmeId } });
  return Array.isArray(data) ? data : [];
}

// GET /api/comentarios/destaque — comentários recentes com dados do filme (feed inicial).
export async function listarComentariosDestaque(limite = 12) {
  const { data } = await api.get('/comentarios/destaque', { params: { limite } });
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
