import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sparkles, Film, User } from 'lucide-react';
import { api } from '../../services/api';
import {
  listarFilmes,
  mapTmdbSearchResultToUpsertDto,
  obterFilme,
  obterFilmePorTmdb,
  upsertFilmeCache,
} from '../../services/filmesService';
import { getTmdbApiKey, getTrendingMovies } from '../../services/tmdb';
import { useFavoritos } from '../../contexts/FavoritosContext';
import { useToast } from '../../hooks/useToast';
import FilmeFeedCard from '../filmes/FilmeFeedCard';
import FilmeDetalheModal from '../filmes/FilmeDetalheModal';
import TmdbTrendingCard from '../filmes/TmdbTrendingCard';

export default function InicioPage() {
  const [perfil, setPerfil] = useState(null);
  const [perfilErro, setPerfilErro] = useState(null);
  const [filmes, setFilmes] = useState([]);
  const [filmesCarregando, setFilmesCarregando] = useState(true);
  const [trending, setTrending] = useState([]);
  const [trendingErro, setTrendingErro] = useState(null);
  const [trendingCarregando, setTrendingCarregando] = useState(false);
  const [modalFilme, setModalFilme] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [gravandoTrendingId, setGravandoTrendingId] = useState(null);

  const { isFavorito, alternar, lista: favoritosLista } = useFavoritos();
  const { success, error: toastError } = useToast();

  const tmdbIdsNaBase = useMemo(() => new Set(filmes.map((f) => f.tmdbId).filter(Boolean)), [filmes]);

  const recarregarFilmes = useCallback(async () => {
    setFilmesCarregando(true);
    try {
      const data = await listarFilmes(1, 40);
      setFilmes(Array.isArray(data) ? data : []);
    } catch {
      setFilmes([]);
    } finally {
      setFilmesCarregando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await api.get('/usuarios/me');
        if (ativo) setPerfil(data);
      } catch (e) {
        const msg =
          e.response?.data?.title ??
          e.response?.data?.mensagem ??
          e.response?.data ??
          e.message;
        if (ativo) setPerfilErro(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    recarregarFilmes();
  }, [recarregarFilmes]);

  useEffect(() => {
    if (!getTmdbApiKey()) {
      setTrending([]);
      setTrendingErro(null);
      return;
    }
    let cancelado = false;
    (async () => {
      setTrendingCarregando(true);
      setTrendingErro(null);
      try {
        const data = await getTrendingMovies('week');
        if (!cancelado) setTrending(data.slice(0, 14));
      } catch (e) {
        if (!cancelado) setTrendingErro(e.message ?? 'Falha ao carregar tendências');
      } finally {
        if (!cancelado) setTrendingCarregando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const abrirModal = useCallback(async (resumo) => {
    try {
      const completo = await obterFilme(resumo.id);
      setModalFilme(completo);
      setModalAberto(true);
    } catch {
      toastError('Não foi possível carregar os detalhes do filme.');
    }
  }, [toastError]);

  const fecharModal = useCallback(() => {
    setModalAberto(false);
    setModalFilme(null);
  }, []);

  const adicionarTrending = useCallback(
    async (movie) => {
      setGravandoTrendingId(movie.id);
      try {
        const existente = await obterFilmePorTmdb(movie.id);
        if (existente) {
          await recarregarFilmes();
          success('Já estava na filmoteca.');
          return;
        }
        await upsertFilmeCache(mapTmdbSearchResultToUpsertDto(movie));
        success('Filme guardado na filmoteca.');
        await recarregarFilmes();
      } catch (e) {
        const msg = e.response?.data?.mensagem ?? e.message;
        toastError(typeof msg === 'string' ? msg : 'Erro ao gravar.');
      } finally {
        setGravandoTrendingId(null);
      }
    },
    [recarregarFilmes, success, toastError],
  );

  const favoritoModal = modalFilme ? isFavorito(modalFilme.id) : false;

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 lg:px-8">
      <div className="min-w-0 flex-1 space-y-8">
        <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-6 text-white shadow-lg">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white/15 p-2 backdrop-blur">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Para ti</h1>
              <p className="mt-1 max-w-xl text-sm text-violet-100">
                Tendências da semana no TMDB e os filmes mais recentes na tua filmoteca — estilo feed, como numa rede
                social de cinéfilos.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Film className="h-5 w-5 text-violet-600" />
              Recomendados · TMDB
            </h2>
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-500 hover:text-violet-600"
            >
              Dados © TMDB
            </a>
          </div>
          {!getTmdbApiKey() ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Para ver recomendações e pesquisar no TMDB, adiciona{' '}
              <code className="rounded bg-amber-100 px-1">VITE_TMDB_API_KEY</code> ao{' '}
              <code className="rounded bg-amber-100 px-1">.env.development</code>.
            </p>
          ) : trendingCarregando ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-52 w-[140px] flex-shrink-0 animate-pulse rounded-xl bg-slate-200"
                />
              ))}
            </div>
          ) : trendingErro ? (
            <p className="text-sm text-red-600">{trendingErro}</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
              {trending.map((m) => (
                <TmdbTrendingCard
                  key={m.id}
                  movie={m}
                  jaNaBase={tmdbIdsNaBase.has(m.id)}
                  gravando={gravandoTrendingId === m.id}
                  onAdicionar={adicionarTrending}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Na filmoteca</h2>
          {filmesCarregando ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : filmes.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
              Ainda não há filmes. Usa a pesquisa acima para adicionar a partir do TMDB.
            </p>
          ) : (
            <div className="space-y-3">
              {filmes.map((f) => (
                <FilmeFeedCard
                  key={f.id}
                  filmeId={f.id}
                  titulo={f.titulo}
                  posterPath={f.posterPath}
                  dataLancamento={f.dataLancamento}
                  notaMediaTmdb={f.notaMediaTmdb}
                  favorito={isFavorito(f.id)}
                  onToggleFavorito={() => alternar(f.id)}
                  onOpen={() => abrirModal(f)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="hidden w-72 flex-shrink-0 lg:block">
        <div className="sticky top-20 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <User className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-300">Sessão</p>
                  {perfilErro ? (
                    <p className="text-xs text-rose-300 truncate">Erro ao carregar perfil</p>
                  ) : perfil ? (
                    <>
                      <p className="font-semibold truncate">{perfil.nomeExibicao || perfil.email || 'Utilizador'}</p>
                      <p className="text-xs text-slate-400 truncate">{perfil.email}</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">A carregar…</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Favoritos</p>
              {favoritosLista.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Ainda sem favoritos. Abre um filme e toca no coração.</p>
              ) : (
                <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                  {favoritosLista.slice(0, 8).map((item) => (
                    <li key={item.favoritoId}>
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById(`filme-${item.filme.id}`)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                          });
                        }}
                        className="flex w-full items-center gap-2 rounded-lg py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <span className="line-clamp-2 font-medium">{item.filme.titulo}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </aside>

      <FilmeDetalheModal
        aberto={modalAberto}
        filme={modalFilme}
        favorito={favoritoModal}
        onFechar={fecharModal}
        onToggleFavorito={
          modalFilme
            ? async () => {
                try {
                  await alternar(modalFilme.id);
                } catch (e) {
                  const msg = e.response?.data?.mensagem ?? e.message;
                  toastError(typeof msg === 'string' ? msg : 'Não foi possível atualizar favoritos.');
                }
              }
            : undefined
        }
      />
    </div>
  );
}
