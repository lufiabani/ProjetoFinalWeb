// MeusFilmesPage.jsx — filmes guardados no perfil (favoritos), com o mesmo modal de detalhe do feed.
import { useCallback, useEffect, useState } from 'react';
import { Bookmark, Film } from 'lucide-react';
import { obterFilme } from '../../services/filmesService';
import { adicionarFavorito, listarFavoritos, removerFavorito } from '../../services/favoritosService';
import { mensagemErroApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import FilmeGridCard from '../filmes/FilmeGridCard';
import FilmeFeedCard from '../filmes/FilmeFeedCard';
import FilmeDetalheModal from '../filmes/FilmeDetalheModal';

export default function MeusFilmesPage() {
  const [favoritosLista, setFavoritosLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalFilme, setModalFilme] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [vista, setVista] = useState('grid');

  const { error: toastError } = useToast();

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await listarFavoritos();
      setFavoritosLista(Array.isArray(data) ? data : []);
    } catch {
      setFavoritosLista([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const isFavorito = useCallback(
    (filmeId) => favoritosLista.some((item) => (item.filme?.id ?? item.filmeId) === filmeId),
    [favoritosLista],
  );

  const alternarFavorito = useCallback(
    async (filmeId) => {
      const existe = favoritosLista.some((item) => (item.filme?.id ?? item.filmeId) === filmeId);
      if (existe) {
        await removerFavorito(filmeId);
        setFavoritosLista((prev) => prev.filter((item) => (item.filme?.id ?? item.filmeId) !== filmeId));
        return;
      }
      const criado = await adicionarFavorito(filmeId);
      const filme =
        favoritosLista.find((x) => x.filme?.id === filmeId)?.filme ||
        (modalFilme?.id === filmeId ? modalFilme : null);
      if (filme) {
        setFavoritosLista((prev) => [...prev, { ...criado, filme }]);
      } else {
        const data = await listarFavoritos();
        setFavoritosLista(Array.isArray(data) ? data : []);
      }
    },
    [favoritosLista, modalFilme],
  );

  const alternarComFeedback = useCallback(
    async (filmeId) => {
      try {
        await alternarFavorito(filmeId);
      } catch (e) {
        toastError(mensagemErroApi(e, 'Não foi possível atualizar favoritos.'));
      }
    },
    [alternarFavorito, toastError],
  );

  const abrirModal = useCallback(
    async (filmeResumo) => {
      try {
        const completo = await obterFilme(filmeResumo.id);
        if (!completo) {
          toastError('Não foi possível carregar os detalhes do filme.');
          return;
        }
        setModalFilme(completo);
        setModalAberto(true);
      } catch (e) {
        toastError(mensagemErroApi(e, 'Não foi possível carregar os detalhes do filme.'));
      }
    },
    [toastError],
  );

  const fecharModal = useCallback(() => {
    setModalAberto(false);
    setModalFilme(null);
  }, []);

  const favoritoModal = modalFilme ? isFavorito(modalFilme.id) : false;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-fuchsia-50 text-fuchsia-700">
              <Bookmark className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Os meus filmes</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Lista dos títulos que guardaste no perfil. Abre um filme para comentar ou remove da coleção quando
                quiseres.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-0.5 sm:self-center">
            <button
              type="button"
              onClick={() => setVista('grid')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                vista === 'grid' ? 'bg-white text-fuchsia-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grelha
            </button>
            <button
              type="button"
              onClick={() => setVista('lista')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                vista === 'lista' ? 'bg-white text-fuchsia-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lista
            </button>
          </div>
        </div>
      </header>

      {carregando ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : favoritosLista.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center shadow-sm">
          <Film className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-800">Ainda não tens filmes guardados</p>
          <p className="mt-1 text-sm text-slate-500">
            Explora o início, escolhe um título e usa o coração para adicionar aos favoritos.
          </p>
        </div>
      ) : vista === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {favoritosLista.map((item) => {
            const f = item.filme;
            if (!f?.id) return null;
            return (
              <FilmeGridCard
                key={item.id ?? f.id}
                filmeId={f.id}
                titulo={f.titulo}
                posterPath={f.posterPath}
                dataLancamento={f.dataLancamento}
                notaMediaTmdb={f.notaMediaTmdb ?? f.filmeDescricao?.notaMediaTmdb}
                totalFavoritos={f.totalFavoritos ?? 0}
                generoNome={f.genero?.nome}
                totalVotosTmdb={f.filmeDescricao?.totalVotosTmdb}
                favorito
                onToggleFavorito={() => alternarComFeedback(f.id)}
                onOpen={() => abrirModal(f)}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {favoritosLista.map((item) => {
            const f = item.filme;
            if (!f?.id) return null;
            return (
              <FilmeFeedCard
                key={item.id ?? f.id}
                filmeId={f.id}
                titulo={f.titulo}
                posterPath={f.posterPath}
                dataLancamento={f.dataLancamento}
                notaMediaTmdb={f.notaMediaTmdb ?? f.filmeDescricao?.notaMediaTmdb}
                totalFavoritos={f.totalFavoritos ?? 0}
                generoNome={f.genero?.nome}
                totalVotosTmdb={f.filmeDescricao?.totalVotosTmdb}
                favorito
                onToggleFavorito={() => alternarComFeedback(f.id)}
                onOpen={() => abrirModal(f)}
              />
            );
          })}
        </div>
      )}

      <FilmeDetalheModal
        aberto={modalAberto}
        filme={modalFilme}
        favorito={favoritoModal}
        onFechar={fecharModal}
        onToggleFavorito={modalFilme ? () => alternarComFeedback(modalFilme.id) : undefined}
      />
    </div>
  );
}
