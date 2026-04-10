import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessagesSquare, Film, LayoutList, LayoutGrid, Search } from 'lucide-react';
import { api } from '../../services/api';
import { listarFilmesFeed, obterFilme } from '../../services/filmesService';
import { adicionarFavorito, listarFavoritos, removerFavorito } from '../../services/favoritosService';
import { useToast } from '../../hooks/useToast';
import FilmeFeedCard from '../filmes/FilmeFeedCard';
import FilmeGridCard from '../filmes/FilmeGridCard';
import FilmeDetalheModal from '../filmes/FilmeDetalheModal';
import PerfilFavoritosPainel from './PerfilFavoritosPainel';

export default function InicioPage() {
  const [perfil, setPerfil] = useState(null);
  const [perfilErro, setPerfilErro] = useState(null);
  const [filmes, setFilmes] = useState([]);
  const [filmesCarregando, setFilmesCarregando] = useState(true);
  const [modalFilme, setModalFilme] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [vistaFilmo, setVistaFilmo] = useState('lista');
  const [ordenacaoFilmo, setOrdenacaoFilmo] = useState('comunidade');
  const [filtroNomeFilmo, setFiltroNomeFilmo] = useState('');
  // Favoritos: GET /api/favoritos (N:N com Filme incluído) — estado local, sem contexto
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

  const favoritoModal = modalFilme ? isFavorito(modalFilme.id) : false;

  const filmesFiltrados = useMemo(() => {
    const q = filtroNomeFilmo.trim().toLowerCase();
    if (!q) return filmes;
    return filmes.filter((f) => {
      const t = (f.titulo ?? '').toLowerCase();
      const o = (f.tituloOriginal ?? '').toLowerCase();
      return t.includes(q) || o.includes(q);
    });
  }, [filmes, filtroNomeFilmo]);

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
    }
    return arr;
  }, [filmesFiltrados, ordenacaoFilmo]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-3 py-4 sm:px-4 sm:py-6 lg:flex-row lg:gap-8 lg:px-8">
      <div className="min-w-0 flex-1 space-y-6 sm:space-y-8">
        <section className="overflow-hidden rounded-2xl border border-rose-100/80 bg-gradient-to-br from-rose-500 via-fuchsia-600 to-indigo-700 p-4 text-white shadow-lg sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
              <MessagesSquare className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">Feed da comunidade</h1>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/90 sm:text-sm">
                Vê o que já está na nossa base — filmes que alguém guardou nos favoritos — abre um título,
                comenta e troca ideias como numa rede social de cinéfilos.
              </p>
            </div>
          </div>
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
                    <option value="recentes">Atualizados recentemente</option>
                    <option value="estreia">Data de estreia</option>
                    <option value="titulo">Nome (A–Z)</option>
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
                      totalFavoritos={f.totalFavoritos ?? 0}
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
                      totalFavoritos={f.totalFavoritos ?? 0}
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
