import { useCallback, useEffect, useState } from 'react';
import { X, Heart, Star, MessageCircle, Pencil, Trash2, Loader2 } from 'lucide-react';
import { posterUrl } from '../../services/tmdb';
import {
  apagarComentario,
  criarComentario,
  editarComentario,
  listarComentariosPorFilme,
} from '../../services/comentariosService';
import { useToast } from '../../hooks/useToast';
import ConfirmDialog from '../ui/ConfirmDialog';

const MAX_CORPO = 8000;

function formatarData(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('pt-PT', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return '';
  }
}

export default function FilmeDetalheModal({
  aberto,
  filme,
  favorito,
  onFechar,
  onToggleFavorito,
}) {
  const { success, error: toastError } = useToast();
  const [comentarios, setComentarios] = useState([]);
  const [comentariosCarregando, setComentariosCarregando] = useState(false);
  const [textoNovo, setTextoNovo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [textoEdicao, setTextoEdicao] = useState('');
  const [gravandoEdicao, setGravandoEdicao] = useState(false);
  const [apagarId, setApagarId] = useState(null);
  const [apagando, setApagando] = useState(false);

  useEffect(() => {
    if (!aberto || !filme?.id) {
      setComentarios([]);
      setTextoNovo('');
      setEditingId(null);
      setTextoEdicao('');
      setApagarId(null);
      return;
    }

    let cancelado = false;
    (async () => {
      setComentariosCarregando(true);
      try {
        const lista = await listarComentariosPorFilme(filme.id);
        if (!cancelado) setComentarios(lista);
      } catch (e) {
        if (!cancelado) {
          setComentarios([]);
          const msg = e.response?.data?.mensagem ?? e.message;
          toastError(typeof msg === 'string' ? msg : 'Não foi possível carregar os comentários.');
        }
      } finally {
        if (!cancelado) setComentariosCarregando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [aberto, filme?.id, toastError]);

  const enviarComentario = useCallback(
    async (e) => {
      e.preventDefault();
      if (!filme?.id || enviando) return;
      const corpo = textoNovo.trim();
      if (!corpo) {
        toastError('Escreve algo antes de publicar.');
        return;
      }
      if (corpo.length > MAX_CORPO) {
        toastError(`O comentário tem no máximo ${MAX_CORPO} caracteres.`);
        return;
      }
      setEnviando(true);
      try {
        const novo = await criarComentario({ filmeId: filme.id, corpo });
        setComentarios((prev) => [novo, ...prev]);
        setTextoNovo('');
        success('Comentário publicado.');
      } catch (err) {
        const msg = err.response?.data?.mensagem ?? err.response?.data?.title ?? err.message;
        toastError(typeof msg === 'string' ? msg : 'Não foi possível publicar o comentário.');
      } finally {
        setEnviando(false);
      }
    },
    [filme?.id, textoNovo, enviando, success, toastError],
  );

  const iniciarEdicao = useCallback((c) => {
    setEditingId(c.id);
    setTextoEdicao(c.corpo ?? '');
  }, []);

  const cancelarEdicao = useCallback(() => {
    setEditingId(null);
    setTextoEdicao('');
  }, []);

  const guardarEdicao = useCallback(async () => {
    if (editingId == null || gravandoEdicao) return;
    const corpo = textoEdicao.trim();
    if (!corpo) {
      toastError('O comentário não pode ficar vazio.');
      return;
    }
    if (corpo.length > MAX_CORPO) {
      toastError(`O comentário tem no máximo ${MAX_CORPO} caracteres.`);
      return;
    }
    setGravandoEdicao(true);
    try {
      await editarComentario(editingId, corpo);
      const agora = new Date().toISOString();
      setComentarios((prev) =>
        prev.map((c) =>
          c.id === editingId ? { ...c, corpo, editadoEm: agora } : c,
        ),
      );
      cancelarEdicao();
      success('Comentário atualizado.');
    } catch (err) {
      const msg = err.response?.data?.mensagem ?? err.message;
      toastError(typeof msg === 'string' ? msg : 'Não foi possível guardar.');
    } finally {
      setGravandoEdicao(false);
    }
  }, [editingId, textoEdicao, gravandoEdicao, cancelarEdicao, success, toastError]);

  const confirmarApagar = useCallback(async () => {
    if (apagarId == null || apagando) return;
    setApagando(true);
    try {
      await apagarComentario(apagarId);
      setComentarios((prev) => prev.filter((c) => c.id !== apagarId));
      setApagarId(null);
      success('Comentário removido.');
    } catch (err) {
      const msg = err.response?.data?.mensagem ?? err.message;
      toastError(typeof msg === 'string' ? msg : 'Não foi possível apagar.');
    } finally {
      setApagando(false);
    }
  }, [apagarId, apagando, success, toastError]);

  if (!aberto || !filme) return null;

  const src = posterUrl(filme.posterPath, 'w500');

  return (
    <>
      {/* pointer-events: painel clicável por cima do backdrop (evita stacking estranho com flex/blur) */}
      <div className="fixed inset-0 z-50 isolate">
        <button
          type="button"
          className="absolute inset-0 z-0 bg-slate-900/70"
          onClick={onFechar}
          aria-label="Fechar"
        />
        <div className="relative z-10 flex min-h-full w-full items-end justify-center p-0 sm:items-center sm:p-4 pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filme-modal-titulo"
          >
          <div className="sticky top-0 flex justify-end bg-gradient-to-b from-white to-transparent p-2 z-10">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="-mt-8 px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-200 shadow sm:w-28">
                {src ? (
                  <img src={src} alt="" className="w-full aspect-[2/3] object-cover" />
                ) : (
                  <div className="aspect-[2/3] flex items-center justify-center text-xs text-slate-500 p-2 text-center">
                    Sem capa
                  </div>
                )}
              </div>
              <div className="min-w-0 w-full text-center sm:w-auto sm:text-left">
                <h2
                  id="filme-modal-titulo"
                  className="text-base font-bold leading-tight text-slate-900 sm:text-lg"
                >
                  {filme.titulo}
                </h2>
                {filme.tituloOriginal && filme.tituloOriginal !== filme.titulo ? (
                  <p className="mt-0.5 text-sm text-slate-500">{filme.tituloOriginal}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap justify-center gap-2 text-sm text-slate-600 sm:justify-start">
                  {filme.dataLancamento ? <span>{String(filme.dataLancamento).slice(0, 4)}</span> : null}
                  {filme.notaMediaTmdb != null ? (
                    <span className="inline-flex items-center gap-0.5 text-amber-600">
                      <Star className="w-4 h-4 fill-current" />
                      {Number(filme.notaMediaTmdb).toFixed(1)} TMDB
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            {filme.sinopse ? (
              <p className="mt-4 text-sm text-slate-700 leading-relaxed">{filme.sinopse}</p>
            ) : (
              <p className="mt-4 text-sm text-slate-400 italic">Sem sinopse.</p>
            )}
            {onToggleFavorito ? (
              <button
                type="button"
                onClick={onToggleFavorito}
                className={`mt-6 w-full flex items-center justify-center gap-2 rounded-xl py-3 font-medium transition-colors ${
                  favorito
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-violet-600 text-white hover:bg-violet-700'
                }`}
              >
                <Heart className={`w-5 h-5 ${favorito ? 'fill-current' : ''}`} />
                {favorito ? 'Nos teus favoritos' : 'Adicionar aos favoritos'}
              </button>
            ) : null}

            <section className="mt-8 border-t border-slate-200 pt-6" aria-labelledby="comentarios-titulo">
              <h3
                id="comentarios-titulo"
                className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500"
              >
                <MessageCircle className="w-4 h-4" />
                Discussão
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Comentários visíveis para toda a comunidade com sessão iniciada.
              </p>

              {comentariosCarregando ? (
                <div className="mt-4 space-y-3">
                  <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                </div>
              ) : comentarios.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Ainda não há comentários neste filme.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {comentarios.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span className="font-medium text-slate-800">{c.autorNome ?? 'Utilizador'}</span>
                          <span className="text-slate-400 mx-1.5">·</span>
                          <time className="text-xs text-slate-500" dateTime={c.criadoEm}>
                            {formatarData(c.criadoEm)}
                          </time>
                          {c.editadoEm && c.editadoEm !== c.criadoEm ? (
                            <span className="text-xs text-slate-400 ml-1">(editado)</span>
                          ) : null}
                        </div>
                        {c.souAutor ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => iniciarEdicao(c)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-violet-600"
                              aria-label="Editar comentário"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setApagarId(c.id)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-red-600"
                              aria-label="Apagar comentário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {editingId === c.id ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={textoEdicao}
                            onChange={(e) => setTextoEdicao(e.target.value)}
                            rows={3}
                            maxLength={MAX_CORPO}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={gravandoEdicao}
                              onClick={guardarEdicao}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-60"
                            >
                              {gravandoEdicao ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : null}
                              Salvar
                            </button>
                            <button
                              type="button"
                              disabled={gravandoEdicao}
                              onClick={cancelarEdicao}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-slate-700 whitespace-pre-wrap break-words">{c.corpo}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={enviarComentario} className="mt-6 space-y-2">
                <label htmlFor="novo-comentario" className="sr-only">
                  Novo comentário
                </label>
                <textarea
                  id="novo-comentario"
                  value={textoNovo}
                  onChange={(e) => setTextoNovo(e.target.value)}
                  placeholder="Escreve um comentário…"
                  rows={3}
                  maxLength={MAX_CORPO}
                  disabled={enviando}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">
                    {textoNovo.length}/{MAX_CORPO}
                  </span>
                  <button
                    type="submit"
                    disabled={enviando || !textoNovo.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Publicar
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={apagarId != null}
        onClose={() => !apagando && setApagarId(null)}
        onConfirm={confirmarApagar}
        title="Apagar comentário"
        message="Tens a certeza? Esta ação não pode ser desfeita."
      />
    </>
  );
}
