// Cliente leve ao TMDB (fetch) + URLs de imagens; chave só no front para pesquisa/importação (nunca na API).
const TMDB_API = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

export function getTmdbApiKey() {
  return import.meta.env.VITE_TMDB_API_KEY?.trim() || '';
}

// Converte poster_path da API para URL absoluta com tamanho TMDB (w92, w185, w500, …).
export function posterUrl(posterPath, size = 'w500') {
  if (!posterPath) return null;
  return `${IMG_BASE}/${size}${posterPath}`;
}

async function tmdbFetch(path, searchParams) {
  const key = getTmdbApiKey();
  if (!key) {
    throw new Error('Defina VITE_TMDB_API_KEY no ficheiro .env para usar o catálogo TMDB.');
  }
  const url = new URL(`${TMDB_API}${path}`);
  url.searchParams.set('api_key', key);
  url.searchParams.set('language', 'pt-BR');
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v != null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TMDB (${res.status}): ${text.slice(0, 120)}`);
  }
  return res.json();
}

export async function searchMovies(query) {
  const q = query?.trim();
  if (!q || q.length < 2) return [];
  const data = await tmdbFetch('/search/movie', { query: q, include_adult: 'false' });
  return data.results ?? [];
}

// Detalhes completos (genres, runtime) — a pesquisa muitas vezes não traz género suficiente para a nossa API.
export async function getMovieDetails(movieId) {
  if (movieId == null || movieId <= 0) {
    throw new Error('ID do filme TMDB inválido.');
  }
  return tmdbFetch(`/movie/${movieId}`, {});
}

export async function getMovieGenreList() {
  const data = await tmdbFetch('/genre/movie/list', {});
  return data.genres ?? [];
}
