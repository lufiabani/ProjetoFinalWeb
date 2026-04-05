import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Loader2, Database, Globe } from 'lucide-react';
import {
  buscarFilmesLocais,
  mapTmdbSearchResultToUpsertDto,
  obterFilmePorTmdb,
  upsertFilmeCache,
} from '../../services/filmesService';
import { getTmdbApiKey, posterUrl, searchMovies } from '../../services/tmdb';
import { useToast } from '../../hooks/useToast';

function useDebouncedValue(value, delay) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

export default function MovieSearch() {
  const [q, setQ] = useState('');
  const debounced = useDebouncedValue(q, 380);
  const [aberto, setAberto] = useState(false);
  const [aCarregar, setACarregar] = useState(false);
  const [locais, setLocais] = useState([]);
  const [tmdb, setTmdb] = useState([]);
  const [erro, setErro] = useState(null);
  const [gravandoTmdbId, setGravandoTmdbId] = useState(null);
  const wrapRef = useRef(null);
  const { success, error: toastError, info } = useToast();

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!debounced || debounced.trim().length < 2) {
      setLocais([]);
      setTmdb([]);
      setErro(null);
      setACarregar(false);
      return;
    }

    let cancelado = false;
    (async () => {
      setACarregar(true);
      setErro(null);
      try {
        const loc = await buscarFilmesLocais(debounced);
        if (cancelado) return;
        setLocais(loc);

        const key = getTmdbApiKey();
        if (key) {
          const ext = await searchMovies(debounced);
          if (cancelado) return;
          setTmdb(ext.slice(0, 12));
        } else {
          setTmdb([]);
        }
      } catch (e) {
        if (cancelado) return;
        const msg = e.response?.data?.mensagem ?? e.message ?? 'Erro na pesquisa';
        setErro(typeof msg === 'string' ? msg : JSON.stringify(msg));
        setLocais([]);
        setTmdb([]);
      } finally {
        if (!cancelado) setACarregar(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [debounced]);

  const garantirNaBase = useCallback(
    async (movie) => {
      const id = movie.id;
      setGravandoTmdbId(id);
      try {
        const existente = await obterFilmePorTmdb(id);
        if (existente) {
          info('Este filme já está na filmoteca.');
          return existente;
        }
        const dto = mapTmdbSearchResultToUpsertDto(movie);
        const gravado = await upsertFilmeCache(dto);
        success('Filme adicionado à filmoteca.');
        return gravado;
      } catch (e) {
        const msg = e.response?.data?.mensagem ?? e.response?.data?.title ?? e.message;
        toastError(typeof msg === 'string' ? msg : 'Não foi possível gravar o filme.');
        return null;
      } finally {
        setGravandoTmdbId(null);
      }
    },
    [info, success, toastError],
  );

  const temResultados = locais.length > 0 || tmdb.length > 0;
  const mostrarPainel = aberto && q.trim().length >= 2;

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/20">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          placeholder="Pesquisar filmes…"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
          autoComplete="off"
        />
        {aCarregar ? <Loader2 className="w-4 h-4 animate-spin text-violet-500" /> : null}
      </div>

      {mostrarPainel ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,420px)] w-full min-w-0 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl sm:left-auto sm:right-0 sm:min-w-[280px] sm:max-w-[min(100vw-2rem,28rem)]">
          {erro ? <p className="px-4 py-3 text-sm text-red-600">{erro}</p> : null}
          {!aCarregar && !erro && !temResultados && debounced.length >= 2 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              Nenhum resultado. {!getTmdbApiKey() ? 'Configure VITE_TMDB_API_KEY para pesquisar no TMDB.' : null}
            </p>
          ) : null}

          {locais.length > 0 ? (
            <div className="px-2 pb-2">
              <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Na tua filmoteca
              </p>
              <ul className="space-y-1">
                {locais.map((f) => (
                  <li key={f.id}>
                    <a
                      href={`#filme-${f.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setAberto(false);
                        setQ('');
                        document.getElementById(`filme-${f.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
                    >
                      <div className="h-12 w-8 flex-shrink-0 overflow-hidden rounded bg-slate-200">
                        {f.posterPath ? (
                          <img
                            src={posterUrl(f.posterPath, 'w92')}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="text-sm font-medium text-slate-800 truncate">{f.titulo}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {tmdb.length > 0 ? (
            <div className="px-2 border-t border-slate-100 pt-2">
              <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                The Movie Database
              </p>
              <ul className="space-y-1">
                {tmdb.map((m) => (
                  <li key={m.id}>
                    <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                      <div className="h-14 w-9 flex-shrink-0 overflow-hidden rounded bg-slate-200">
                        {m.poster_path ? (
                          <img
                            src={posterUrl(m.poster_path, 'w92')}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                        {m.release_date ? (
                          <p className="text-xs text-slate-500">{m.release_date.slice(0, 4)}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        disabled={gravandoTmdbId === m.id}
                        onClick={async () => {
                          const filme = await garantirNaBase(m);
                          if (filme) {
                            setAberto(false);
                            setQ('');
                            requestAnimationFrame(() => {
                              document.getElementById(`filme-${filme.id}`)?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                              });
                            });
                          }
                        }}
                        className="flex-shrink-0 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-60"
                      >
                        {gravandoTmdbId === m.id ? '…' : 'Adicionar'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
