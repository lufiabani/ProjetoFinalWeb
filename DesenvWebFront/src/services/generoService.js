// Lista e sincronização de géneros na API (espelho da lista oficial TMDB).
import { api } from './api';
import { getMovieGenreList, getTmdbApiKey } from './tmdb';

export async function listarGeneros() {
  const { data } = await api.get('/generos');
  return Array.isArray(data) ? data : [];
}

// POST /api/generos/sync — requer login; envia o JSON nativo do TMDB para a API normalizar.
export async function sincronizarGenerosDoTmdb() {
  if (!getTmdbApiKey()) {
    throw new Error('Defina VITE_TMDB_API_KEY no .env para buscar géneros no TMDB.');
  }
  const lista = await getMovieGenreList();
  // Corpo no formato nativo TMDB ({ id, name }) — o servidor também aceita tmdbId/nome.
  await api.post('/generos/sync', lista);
}
