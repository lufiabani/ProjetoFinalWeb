import { api } from './api';

export async function listarFilmes(pagina = 1, tamanho = 20) {
  const { data } = await api.get('/filmes', { params: { pagina, tamanho } });
  return data;
}

/**
 * Filmes na plataforma com totalFavoritos (GET /filmes/feed).
 * Se o feed não existir (API antiga) ou falhar, usa GET /filmes para o feed continuar a funcionar.
 */
export async function listarFilmesFeed(pagina = 1, tamanho = 100) {
  try {
    const { data, status } = await api.get('/filmes/feed', { params: { pagina, tamanho } });
    if (status === 200 && Array.isArray(data)) return data;
  } catch (e) {
    const code = e.response?.status;
    if (code != null && code !== 404 && code !== 405) throw e;
  }
  const { data } = await api.get('/filmes', { params: { pagina, tamanho } });
  const arr = Array.isArray(data) ? data : [];
  return arr.map((f) => ({
    ...f,
    totalFavoritos: Number(f.totalFavoritos) || 0,
  }));
}

export async function buscarFilmesLocais(q) {
  const termo = (q == null ? '' : String(q)).trim();
  if (termo.length < 2) return [];
  const { data } = await api.get('/filmes/buscar', { params: { q: termo } });
  return Array.isArray(data) ? data : [];
}

export async function obterFilme(id) {
  const { data } = await api.get(`/filmes/${id}`);
  return data;
}

/** @returns {Promise<object|null>} null se 404 */
export async function obterFilmePorTmdb(tmdbId) {
  try {
    const { data } = await api.get(`/filmes/tmdb/${tmdbId}`);
    return data;
  } catch (e) {
    if (e.response?.status === 404) return null;
    throw e;
  }
}

export async function upsertFilmeCache(payload) {
  const { data } = await api.post('/filmes/cache', payload);
  return data;
}

/** Mapeia um item da API search/movie do TMDB para o modelo Filme da API .NET (camelCase). */
export function mapTmdbSearchResultToFilme(movie) {
  const release = movie.release_date?.length >= 10 ? movie.release_date.slice(0, 10) : null;
  return {
    tmdbId: movie.id,
    titulo: movie.title || movie.original_title || 'Sem título',
    tituloOriginal: movie.original_title || null,
    sinopse: movie.overview || null,
    posterPath: movie.poster_path || null,
    backdropPath: movie.backdrop_path || null,
    dataLancamento: release,
    duracaoMinutos: null,
    notaMediaTmdb: movie.vote_average != null ? Number(movie.vote_average) : null,
    totalVotosTmdb: movie.vote_count ?? null,
    idiomaOriginal: movie.original_language || null,
    imdbId: null,
    metadadosTmdbJson: JSON.stringify({ popularity: movie.popularity }),
  };
}
