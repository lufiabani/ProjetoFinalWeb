const TMDB_API = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

export function getTmdbApiKey() {
  return import.meta.env.VITE_TMDB_API_KEY?.trim() || '';
}

export function posterUrl(posterPath, size = 'w500') {
  if (!posterPath) return null;
  return `${IMG_BASE}/${size}${posterPath}`;
}

async function tmdbFetch(path, searchParams) {
  const key = getTmdbApiKey();
  if (!key) {
    throw new Error('Defina VITE_TMDB_API_KEY no .env para pesquisar e ver recomendações do TMDB.');
  }
  const url = new URL(`${TMDB_API}${path}`);
  url.searchParams.set('api_key', key);
  url.searchParams.set('language', 'pt-PT');
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

/** Resultados da pesquisa TMDB (search/movie). */
export async function searchMovies(query) {
  const q = query?.trim();
  if (!q || q.length < 2) return [];
  const data = await tmdbFetch('/search/movie', { query: q, include_adult: 'false' });
  return data.results ?? [];
}

/** Trending movies: timeWindow 'day' | 'week'. */
export async function getTrendingMovies(timeWindow = 'week') {
  const data = await tmdbFetch(`/trending/movie/${timeWindow}`);
  return data.results ?? [];
}
