// InicioPage.jsx — orquestra o feed (filmes na plataforma), favoritos, perfil e modal de detalhe/comentários.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Film, LayoutList, LayoutGrid, Search, Quote, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { listarFilmesFeed, obterFilme } from '../../services/filmesService';
import { adicionarFavorito, listarFavoritos, removerFavorito } from '../../services/favoritosService';
import { listarGeneros } from '../../services/generoService';
import { listarComentariosDestaque } from '../../services/comentariosService';
import { posterUrl as posterTmdb } from '../../services/tmdb';
import { useToast } from '../../hooks/useToast';
import BrandLogo from '../layout/BrandLogo';
import FilmeFeedCard from '../filmes/FilmeFeedCard';
import FilmeGridCard from '../filmes/FilmeGridCard';
import FilmeDetalheModal from '../filmes/FilmeDetalheModal';
import PerfilFavoritosPainel from './PerfilFavoritosPainel';

export default function InicioPage() {
  // Perfil Keycloak espelhado na API (/usuarios/me).
  const [perfil, setPerfil] = useState(null);
  const [perfilErro, setPerfilErro] = useState(null);
  const [filmes, setFilmes] = useState([]);
  const [filmesCarregando, setFilmesCarregando] = useState(true);
  const [modalFilme, setModalFilme] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [vistaFilmo, setVistaFilmo] = useState('lista');
  const [ordenacaoFilmo, setOrdenacaoFilmo] = useState('comunidade');
  const [filtroNomeFilmo, setFiltroNomeFilmo] = useState('');
  const [generos, setGeneros] = useState([]);
  const [generoFiltroId, setGeneroFiltroId] = useState('');
  const [comentariosDestaque, setComentariosDestaque] = useState([]);
  const [comentariosCarregando, setComentariosCarregando] = useState(true);
  // Favoritos com Filme incluído (GET /api/favoritos) — estado local, sem Redux/contexto extra.
  const [favoritosLista, setFavoritosLista] = useState([]);

  const { error: toastError } = useToast();

  const recarregarFilmes = useCallback(async () => {
    setFilmesCarregando(true);
    try {
      const data = await listarFilmesFeed(1, 100);
      setFilmes(Array.isArray(data) ? data : []);
    } catch {
      setFilmes([]);
    } finally {
      setFilmesCarregando(false);
    }
  }, []);

  const isFavorito = useCallback(
    (filmeId) =>
      favoritosLista.some((item) => (item.filme?.id ?? item.filmeId) === filmeId),
    [favoritosLista],
  );

  const alternarFavorito = useCallback(
    async (filmeId) => {
      const existe = favoritosLista.some(
        (item) => (item.filme?.id ?? item.filmeId) === filmeId,
      );
      if (existe) {
        await removerFavorito(filmeId);
        setFavoritosLista((prev) =>
          prev.filter((item) => (item.filme?.id ?? item.filmeId) !== filmeId),
        );
        return;
      }
      const criado = await adicionarFavorito(filmeId);
      const filme =
        filmes.find((f) => f.id === filmeId) ||
        (modalFilme?.id === filmeId ? modalFilme : null);
      if (filme) {
        setFavoritosLista((prev) => [...prev, { ...criado, filme }]);
      } else {
        // Sem objeto no feed/modal: volta a carregar a lista com Include do servidor
        const data = await listarFavoritos();
        setFavoritosLista(Array.isArray(data) ? data : []);
      }
    },
    [favoritosLista, filmes, modalFilme],
  );

  // Após favoritar, o feed precisa de totalFavoritos atualizado — aqui fazemos refresh controlado.
  const alternarComAtualizarFeed = useCallback(
    async (filmeId) => {
      try {
        await alternarFavorito(filmeId);
        await recarregarFilmes();
      } catch (e) {
        const msg = e.response?.data?.mensagem ?? e.message;
        toastError(typeof msg === 'string' ? msg : 'Não foi possível atualizar favoritos.');
      }
    },
    [alternarFavorito, recarregarFilmes, toastError],
  );

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
    let ativo = true;
    (async () => {
      try {
        const data = await listarFavoritos();
        if (ativo) setFavoritosLista(Array.isArray(data) ? data : []);
      } catch {
        if (ativo) setFavoritosLista([]);
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
    let ativo = true;
    (async () => {
      try {
        const data = await listarGeneros();
        if (ativo) setGeneros(Array.isArray(data) ? data : []);
      } catch {
        if (ativo) setGeneros([]);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setComentariosCarregando(true);
      try {
        const data = await listarComentariosDestaque(12);
        if (ativo) setComentariosDestaque(Array.isArray(data) ? data : []);
      } catch {
        if (ativo) setComentariosDestaque([]);
      } finally {
        if (ativo) setComentariosCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const abrirModal = useCallback(
    async (resumo) => {
      try {
        const completo = await obterFilme(resumo.id);
        if (!completo) {
          toastError('Não foi possível carregar os detalhes do filme.');
          return;
        }
        setModalFilme(completo);
        setModalAberto(true);
      } catch {
        toastError('Não foi possível carregar os detalhes do filme.');
      }
    },
    [toastError],
  );

  const fecharModal = useCallback(() => {
    setModalAberto(false);
    setModalFilme(null);
  }, []);

  const abrirModalPorId = useCallback(
    async (filmeId) => {
      try {
        const completo = await obterFilme(filmeId);
        if (!completo) {
          toastError('Não foi possível carregar os detalhes do filme.');
          return;
        }
        setModalFilme(completo);
        setModalAberto(true);
      } catch {
        toastError('Não foi possível carregar os detalhes do filme.');
      }
    },
    [toastError],
  );

  const favoritoModal = modalFilme ? isFavorito(modalFilme.id) : false;

  const filmesFiltrados = useMemo(() => {
    const q = filtroNomeFilmo.trim().toLowerCase();
    const porGenero =
      generoFiltroId === ''
        ? filmes
        : filmes.filter((f) => String(f.generoId ?? '') === String(generoFiltroId));
    if (!q) return porGenero;
    return porGenero.filter((f) => {
      const t = (f.titulo ?? '').toLowerCase();
      const o = (f.tituloOriginal ?? f.filmeDescricao?.tituloOriginal ?? '').toLowerCase();
      return t.includes(q) || o.includes(q);
    });
  }, [filmes, filtroNomeFilmo, generoFiltroId]);

  const filmesOrdenados = useMemo(() => {
    const arr = [...filmesFiltrados];
    if (ordenacaoFilmo === 'comunidade') {
      return arr;
    }
    if (ordenacaoFilmo === 'titulo') {
      arr.sort((a, b) =>
        (a.titulo || '').localeCompare(b.titulo || '', 'pt', { sensitivity: 'base' }),
      );
    } else if (ordenacaoFilmo === 'recentes') {
      const ms = (f) => {
        const raw = f.atualizadoEm ?? f.criadoEm;
        if (!raw) return 0;
        const t = new Date(raw).getTime();
        return Number.isNaN(t) ? 0 : t;
      };
      arr.sort((a, b) => ms(b) - ms(a));
    } else if (ordenacaoFilmo === 'estreia') {
      const ms = (f) => {
        if (!f.dataLancamento) return 0;
        const t = new Date(f.dataLancamento).getTime();
        return Number.isNaN(t) ? 0 : t;
      };
      arr.sort((a, b) => ms(b) - ms(a));
    } else if (ordenacaoFilmo === 'notaTmdb') {
      const n = (f) => {
        const v = f.notaMediaTmdb ?? f.filmeDescricao?.notaMediaTmdb;
        if (v == null || Number.isNaN(Number(v))) return -1;
        return Number(v);
      };
      arr.sort((a, b) => n(b) - n(a));
    }
    return arr;
  }, [filmesFiltrados, ordenacaoFilmo]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-3 py-4 sm:px-4 sm:py-6 lg:flex-row lg:gap-8 lg:px-8">
      <div className="min-w-0 flex-1 space-y-6 sm:space-y-8">
        <section className="overflow-hidden rounded-2xl border border-rose-100/80 bg-gradient-to-br from-rose-500 via-fuchsia-600 to-indigo-700 p-5 text-white shadow-lg sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch sm:gap-8 sm:py-1">
            <div className="flex w-full shrink-0 justify-center sm:w-auto sm:justify-start">
              <div className="rounded-3xl bg-white p-3 shadow-xl ring-2 ring-white/60 sm:p-4">
                <BrandLogo
                  className="max-h-[7.5rem] w-auto max-w-[min(18rem,85vw)] object-contain sm:max-h-[8.5rem] sm:max-w-[20rem]"
                  roundedClassName="rounded-2xl"
                />
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 text-center sm:text-left">
              <p className="text-sm font-medium leading-relaxed text-white/95 sm:text-base">
                Explora títulos na base, compara a nota TMDB com o burburinho da comunidade e deixa o teu comentário
                nos filmes que te marcam.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-black/15 px-3 py-2.5 text-xs text-white/95 ring-1 ring-white/25 sm:justify-start sm:text-sm">
                <Sparkles className="h-4 w-4 shrink-0 text-amber-200" />
                <span>
                  Dica: ordena por <span className="font-semibold">Melhor nota TMDB</span> ou filtra por género para
                  afinar a tua descoberta.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 sm:text-lg">
              <Quote className="h-5 w-5 shrink-0 text-fuchsia-600" />
              Comentários em destaque
            </h2>
            <span className="text-xs text-slate-500">Os mais recentes na plataforma</span>
          </div>
          {comentariosCarregando ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : comentariosDestaque.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
              Ainda não há comentários públicos. Sê o primeiro a partilhar uma opinião num filme.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comentariosDestaque.map((c) => {
                const data = c.criadoEm ? new Date(c.criadoEm) : null;
                const dataTxt =
                  data && !Number.isNaN(data.getTime())
                    ? data.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
                    : '';
                const poster = posterTmdb(c.posterPath, 'w92');
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => abrirModalPorId(c.filmeId)}
                    className="flex gap-3 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 text-left transition hover:border-fuchsia-200 hover:bg-white hover:shadow-sm"
                  >
                    <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200">
                      {poster ? (
                        <img src={poster} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                          Sem capa
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-fuchsia-700">{c.tituloFilme}</p>
                      <p className="mt-1 line-clamp-3 text-sm text-slate-800">{c.corpo}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{c.autorNome}</span>
                        {dataTxt ? <span> · {dataTxt}</span> : null}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="lg:hidden">
          <PerfilFavoritosPainel perfil={perfil} perfilErro={perfilErro} favoritosLista={favoritosLista} />
        </div>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800 sm:text-lg">
            <Film className="h-5 w-5 shrink-0 text-fuchsia-600" />
            <span className="min-w-0">Filmes na plataforma</span>
          </h2>
          {filmesCarregando ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : filmes.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
              Ainda não há filmes na base. Quando existirem registos (por exemplo após sincronização ou
              importação), aparecem aqui para todos comentarem.
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:p-3">
                <div
                  className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5"
                  role="group"
                  aria-label="Vista da lista de filmes"
                >
                  <button
                    type="button"
                    onClick={() => setVistaFilmo('lista')}
                    title="Vista em lista"
                    aria-label="Vista em lista"
                    aria-pressed={vistaFilmo === 'lista'}
                    className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors ${
                      vistaFilmo === 'lista'
                        ? 'bg-white text-fuchsia-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setVistaFilmo('grid')}
                    title="Vista em grelha"
                    aria-label="Vista em grelha"
                    aria-pressed={vistaFilmo === 'grid'}
                    className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors ${
                      vistaFilmo === 'grid'
                        ? 'bg-white text-fuchsia-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>

                <label className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[200px] sm:max-w-[240px]">
                  <span className="sr-only">Ordenar por</span>
                  <select
                    value={ordenacaoFilmo}
                    onChange={(e) => setOrdenacaoFilmo(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-500/20"
                  >
                    <option value="comunidade">Popular na comunidade</option>
                    <option value="notaTmdb">Melhor nota TMDB</option>
                    <option value="recentes">Atualizados recentemente</option>
                    <option value="estreia">Data de estreia</option>
                    <option value="titulo">Nome (A–Z)</option>
                  </select>
                </label>

                <label className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[180px] sm:max-w-[220px]">
                  <span className="sr-only">Género</span>
                  <select
                    value={generoFiltroId}
                    onChange={(e) => setGeneroFiltroId(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-500/20"
                  >
                    <option value="">Todos os géneros</option>
                    {generos.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="relative min-w-0 flex-1 sm:min-w-[200px] sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={filtroNomeFilmo}
                    onChange={(e) => setFiltroNomeFilmo(e.target.value)}
                    placeholder="Filtrar por nome…"
                    autoComplete="off"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-fuchsia-400 focus:bg-white focus:ring-2 focus:ring-fuchsia-500/20"
                  />
                </div>
              </div>

              {filmesOrdenados.length === 0 ? (
                <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900">
                  Nenhum filme corresponde ao filtro. Limpa o texto ou experimenta outro termo.
                </p>
              ) : vistaFilmo === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                  {filmesOrdenados.map((f) => (
                    <FilmeGridCard
                      key={f.id}
                      filmeId={f.id}
                      titulo={f.titulo}
                      posterPath={f.posterPath}
                      dataLancamento={f.dataLancamento}
                      notaMediaTmdb={f.notaMediaTmdb}
                      totalVotosTmdb={f.totalVotosTmdb}
                      totalFavoritos={f.totalFavoritos ?? 0}
                      generoNome={f.generoNome}
                      favorito={isFavorito(f.id)}
                      onToggleFavorito={() => alternarComAtualizarFeed(f.id)}
                      onOpen={() => abrirModal(f)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filmesOrdenados.map((f) => (
                    <FilmeFeedCard
                      key={f.id}
                      filmeId={f.id}
                      titulo={f.titulo}
                      posterPath={f.posterPath}
                      dataLancamento={f.dataLancamento}
                      notaMediaTmdb={f.notaMediaTmdb}
                      totalVotosTmdb={f.totalVotosTmdb}
                      totalFavoritos={f.totalFavoritos ?? 0}
                      generoNome={f.generoNome}
                      favorito={isFavorito(f.id)}
                      onToggleFavorito={() => alternarComAtualizarFeed(f.id)}
                      onOpen={() => abrirModal(f)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <aside className="hidden w-72 flex-shrink-0 self-start lg:block">
        <div className="sticky top-4 space-y-4 lg:top-20">
          <PerfilFavoritosPainel perfil={perfil} perfilErro={perfilErro} favoritosLista={favoritosLista} />
        </div>
      </aside>

      <FilmeDetalheModal
        aberto={modalAberto}
        filme={modalFilme}
        favorito={favoritoModal}
        onFechar={fecharModal}
        onToggleFavorito={modalFilme ? () => alternarComAtualizarFeed(modalFilme.id) : undefined}
      />
    </div>
  );
}
