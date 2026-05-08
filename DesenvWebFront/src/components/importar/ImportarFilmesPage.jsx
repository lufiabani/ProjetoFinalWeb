// ImportarFilmesPage.jsx — pesquisa dupla (base local + TMDB) e importação via POST /filmes/cache.
import { useCallback, useEffect, useState } from 'react';
import { ArrowDownToLine, Database, Globe, Loader2, Search } from 'lucide-react';
import {
  buscarFilmesLocais,
  extrairPrimeiroGeneroTmdbId,
  mapTmdbSearchResultToFilme,
  obterFilmePorTmdb,
  upsertFilmeCache,
} from '../../services/filmesService';
import { listarGeneros, sincronizarGenerosDoTmdb } from '../../services/generoService';
import { mensagemErroApi } from '../../services/api';
import { getKeycloak } from '../../keycloak';
import { getMovieDetails, getTmdbApiKey, posterUrl, searchMovies } from '../../services/tmdb';
import { useToast } from '../../hooks/useToast';

// Atrasa o termo de pesquisa para não disparar uma requisição por tecla (alivia API e TMDB).
function useDebouncedValue(value, delay) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), 400);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

export default function ImportarFilmesPage() {
  const [q, setQ] = useState('');
  const debounced = useDebouncedValue(q, 400);
  const [aCarregarLocal, setACarregarLocal] = useState(false);
  const [aCarregarTmdb, setACarregarTmdb] = useState(false);
  const [locais, setLocais] = useState([]);
  const [tmdb, setTmdb] = useState([]);
  const [erroLocal, setErroLocal] = useState(null);
  const [erroTmdb, setErroTmdb] = useState(null);
  const [gravandoTmdbId, setGravandoTmdbId] = useState(null);
  const [generos, setGeneros] = useState([]);
  const { success, error: toastError, info } = useToast();

  // Ao abrir esta página: carrega géneros e, com sessão + chave TMDB, sincroniza a lista oficial (idempotente) — sem botão.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        let lista = await listarGeneros();
        if (cancelado) return;
        setGeneros(Array.isArray(lista) ? lista : []);

        if (getTmdbApiKey() && getKeycloak()?.authenticated) {
          try {
            await sincronizarGenerosDoTmdb();
            lista = await listarGeneros();
            if (!cancelado) setGeneros(Array.isArray(lista) ? lista : []);
          } catch {
            /* mantém a lista já obtida; importação de filmes cria géneros em falta na mesma */
          }
        }
      } catch {
        if (!cancelado) setGeneros([]);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!debounced || debounced.trim().length < 2) {
      setLocais([]);
      setTmdb([]);
      setErroLocal(null);
      setErroTmdb(null);
      setACarregarLocal(false);
      setACarregarTmdb(false);
      return;
    }

    let cancelado = false;

    (async () => {
      setACarregarLocal(true);
      setErroLocal(null);
      try {
        const lista = await buscarFilmesLocais(debounced);
        if (!cancelado) setLocais(Array.isArray(lista) ? lista : []);
      } catch (e) {
        if (!cancelado) {
          setErroLocal(mensagemErroApi(e, 'Erro ao pesquisar na plataforma'));
          setLocais([]);
        }
      } finally {
        if (!cancelado) setACarregarLocal(false);
      }
    })();

    (async () => {
      if (!getTmdbApiKey()) {
        if (!cancelado) {
          setTmdb([]);
          setErroTmdb(null);
          setACarregarTmdb(false);
        }
        return;
      }
      setACarregarTmdb(true);
      setErroTmdb(null);
      try {
        const lista = await searchMovies(debounced);
        if (!cancelado) setTmdb(Array.isArray(lista) ? lista.slice(0, 20) : []);
      } catch (e) {
        if (!cancelado) {
          setErroTmdb(e.message ?? 'Erro no TMDB');
          setTmdb([]);
        }
      } finally {
        if (!cancelado) setACarregarTmdb(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [debounced]);

  const importarDoTmdb = useCallback(
    async (movie) => {
      const id = movie.id;
      const temChave = Boolean(getTmdbApiKey());
      setGravandoTmdbId(id);
      try {
        const existente = await obterFilmePorTmdb(id);
        if (existente) {
          info('Este filme já está na plataforma.');
          return;
        }
        // search/movie muitas vezes não traz géneros — pedimos detalhes ao TMDB; a API cria o género na base se for novo.
        let fonte = movie;
        if (extrairPrimeiroGeneroTmdbId(fonte) == null && temChave) {
          try {
            const detalhes = await getMovieDetails(movie.id);
            fonte = { ...movie, ...detalhes };
          } catch {
            /* segue com fonte = movie */
          }
        }
        if (extrairPrimeiroGeneroTmdbId(fonte) == null) {
          toastError(
            'O TMDB não indicou género para este filme. Escolhe outro título ou verifica os dados no TMDB.',
          );
          return;
        }
        await upsertFilmeCache(mapTmdbSearchResultToFilme(fonte));
        success('Filme importado para a plataforma.');
        if (debounced.trim().length >= 2) {
          try {
            const lista = await buscarFilmesLocais(debounced);
            setLocais(Array.isArray(lista) ? lista : []);
          } catch {
            /* ignorar — lista local atualiza no próximo refresh */
          }
        }
      } catch (e) {
        toastError(mensagemErroApi(e, 'Não foi possível importar.'));
      } finally {
        setGravandoTmdbId(null);
      }
    },
    [debounced, info, success, toastError],
  );

  const aCarregar = aCarregarLocal || aCarregarTmdb;
  const temChaveTmdb = Boolean(getTmdbApiKey());

  return (
    <div className="mx-auto max-w-3xl px-3 py-6 sm:px-4 lg:px-8">
      <header className="mb-8">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-fuchsia-100 p-2 text-fuchsia-700">
            <ArrowDownToLine className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Importar filmes</h1>
            <p className="mt-1 text-sm text-slate-600">
              Procura na <strong>nossa base</strong> ou no <strong>catálogo TMDB</strong> e importa títulos para
              toda a comunidade poder ver e comentar.
            </p>
          </div>
        </div>
      </header>

      <div className="relative mb-8">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Escreve pelo menos 2 caracteres…"
          autoComplete="off"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 shadow-sm outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-500/20"
        />
        {aCarregar ? (
          <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-fuchsia-500" />
        ) : null}
      </div>

      {!temChaveTmdb ? (
        <p className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Para importar do catálogo externo TMDB, define{' '}
          <code className="rounded bg-amber-100 px-1">VITE_TMDB_API_KEY</code> no{' '}
          <code className="rounded bg-amber-100 px-1">.env</code> ou <code className="rounded bg-amber-100 px-1">.env.development</code> e
          reinicia o Vite. Continuas a poder pesquisar filmes que já existem na plataforma.
        </p>
      ) : (
        <p className="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-600">
          {getKeycloak()?.authenticated ? (
            <>
              Com sessão iniciada, a <strong>lista oficial de géneros do TMDB</strong> é atualizada automaticamente ao
              abrires esta página. Ao importar um filme, géneros em falta são criados na mesma.
              {generos.length > 0 ? (
                <span className="text-slate-500"> ({generos.length} género(s) na base.)</span>
              ) : null}
            </>
          ) : (
            <>
              <strong>Inicia sessão</strong> para carregar a lista completa de géneros do TMDB; mesmo sem isso, podes
              importar filmes — cada filme cria o seu género na base se for preciso.
            </>
          )}
        </p>
      )}

      {q.trim().length > 0 && q.trim().length < 2 ? (
        <p className="text-sm text-slate-500">Indica pelo menos 2 caracteres para pesquisar.</p>
      ) : null}

      {debounced.trim().length >= 2 ? (
        <div className="space-y-10">
          <section aria-labelledby="sec-plataforma">
            <h2 id="sec-plataforma" className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800">
              <Database className="h-5 w-5 text-fuchsia-600" />
              Já na plataforma
            </h2>
            {erroLocal ? <p className="text-sm text-red-600">{erroLocal}</p> : null}
            {!aCarregarLocal && !erroLocal && locais.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Nenhum filme com esse nome na nossa base. Se tiveres chave TMDB, importa a partir da secção abaixo.
              </p>
            ) : null}
            {locais.length > 0 ? (
              <ul className="space-y-2">
                {locais.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="h-16 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200">
                      {f.posterPath ? (
                        <img src={posterUrl(f.posterPath, 'w185')} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{f.titulo}</p>
                      <p className="text-xs text-slate-500">ID local: {f.id}</p>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                      Na base
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section aria-labelledby="sec-tmdb">
            <h2 id="sec-tmdb" className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800">
              <Globe className="h-5 w-5 text-fuchsia-600" />
              Catálogo TMDB — importar
            </h2>
            {!temChaveTmdb ? (
              <p className="text-sm text-slate-500">Configura a chave TMDB para ver resultados aqui.</p>
            ) : erroTmdb ? (
              <p className="text-sm text-red-600">{erroTmdb}</p>
            ) : !aCarregarTmdb && tmdb.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Nenhum resultado no TMDB para esta pesquisa.
              </p>
            ) : (
              <ul className="space-y-2">
                {tmdb.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-nowrap"
                  >
                    <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200">
                      {m.poster_path ? (
                        <img src={posterUrl(m.poster_path, 'w185')} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{m.title || m.original_title}</p>
                      {m.release_date ? (
                        <p className="text-xs text-slate-500">{m.release_date.slice(0, 4)}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={gravandoTmdbId === m.id}
                      onClick={() => importarDoTmdb(m)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-700 disabled:opacity-60"
                    >
                      {gravandoTmdbId === m.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowDownToLine className="h-4 w-4" />
                      )}
                      Importar
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {temChaveTmdb ? (
              <p className="mt-4 text-xs text-slate-400">
                Dados do filme ©{' '}
                <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">
                  TMDB
                </a>
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
