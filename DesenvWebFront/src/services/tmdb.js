const TMDB_API = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

/** Chave opcional: necessária para pesquisar e importar a partir do catálogo TMDB. */
export function getTmdbApiKey() {
  return import.meta.env.VITE_TMDB_API_KEY?.trim() || '';
}

/** Constrói URL de poster a partir do path guardado na base (formato TMDB). */
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

/** Resultados da pesquisa TMDB (search/movie), para importar na nossa API. */
export async function searchMovies(query) {
  const q = query?.trim();
  if (!q || q.length < 2) return [];
  const data = await tmdbFetch('/search/movie', { query: q, include_adult: 'false' });
  return data.results ?? [];
}
