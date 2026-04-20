// Chamadas à API de filmes + mapeamento TMDB → corpo de POST /filmes/cache (importação).
import { api } from './api';

// GET /api/filmes — página simples (ordenado por AtualizadoEm no servidor).
export async function listarFilmes(pagina = 1, tamanho = 20) {
  const { data } = await api.get('/filmes', { params: { pagina, tamanho } });
  return data;
}

// Feed com totalFavoritos; se a rota /feed não existir (API antiga), faz fallback para GET /filmes e normaliza campos.
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
    // GET /filmes devolve descrição aninhada; o feed usa campos planos — alinhamos para os cards.
    tituloOriginal: f.tituloOriginal ?? f.filmeDescricao?.tituloOriginal ?? null,
    notaMediaTmdb: f.notaMediaTmdb ?? f.filmeDescricao?.notaMediaTmdb ?? null,
    totalFavoritos: Number(f.totalFavoritos) || 0,
  }));
}

// GET /api/filmes/buscar — o servidor exige q com pelo menos 2 caracteres úteis após trim.
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

// GET /api/filmes/tmdb/{id}; 404 → null (filme ainda não importado), outros erros propagam.
export async function obterFilmePorTmdb(tmdbId) {
  try {
    const { data } = await api.get(`/filmes/tmdb/${tmdbId}`);
    return data;
  } catch (e) {
    if (e.response?.status === 404) return null;
    throw e;
  }
}

// POST /api/filmes/cache — grava ou atualiza filme + descrição na base (requer sessão).
export async function upsertFilmeCache(payload) {
  const { data } = await api.post('/filmes/cache', payload);
  return data;
}

// Pesquisa TMDB traz genre_ids; detalhes traz genres[].id — usamos o primeiro para cumprir regra “um género” na API.
export function extrairPrimeiroGeneroTmdbId(movie) {
  if (Array.isArray(movie.genre_ids) && movie.genre_ids.length > 0) {
    const n = Number(movie.genre_ids[0]);
    return Number.isNaN(n) ? null : n;
  }
  if (Array.isArray(movie.genres) && movie.genres.length > 0 && movie.genres[0].id != null) {
    const n = Number(movie.genres[0].id);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

// Nome do primeiro género (só em detalhes completos) — enviado à API quando cria género novo por TmdbId.
export function extrairPrimeiroGeneroNome(movie) {
  if (Array.isArray(movie.genres) && movie.genres.length > 0 && movie.genres[0].name != null) {
    return String(movie.genres[0].name).trim() || null;
  }
  return null;
}

// Corpo de POST /api/filmes/cache: preferimos generoTmdbId (+ generoNome); a API cria o género em falta.
export function mapTmdbSearchResultToFilme(movie) {
  const release = movie.release_date?.length >= 10 ? movie.release_date.slice(0, 10) : null;
  const generoTmdbId = extrairPrimeiroGeneroTmdbId(movie);
  const generoNome = extrairPrimeiroGeneroNome(movie);
  return {
    tmdbId: movie.id,
    ...(generoTmdbId != null ? { generoTmdbId, ...(generoNome ? { generoNome } : {}) } : {}),
    titulo: movie.title || movie.original_title || 'Sem título',
    posterPath: movie.poster_path || null,
    dataLancamento: release,
    filmeDescricao: {
      tituloOriginal: movie.original_title || null,
      resumo: movie.overview || null,
      backdropPath: movie.backdrop_path || null,
      duracaoMinutos:
        movie.runtime != null && movie.runtime !== 0 ? Number(movie.runtime) : null,
      notaMediaTmdb: movie.vote_average != null ? Number(movie.vote_average) : null,
      totalVotosTmdb: movie.vote_count ?? null,
      idiomaOriginal: movie.original_language || null,
      imdbId: null,
      metadadosTmdbJson: JSON.stringify({ popularity: movie.popularity }),
    },
  };
}
