import { Heart, Star } from 'lucide-react';
import { posterUrl as tmdbPoster } from '../../services/tmdb';

function ano(dataLancamento) {
  if (!dataLancamento) return null;
  const s = String(dataLancamento);
  const y = s.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : null;
}

export default function FilmeFeedCard({
  filmeId,
  titulo,
  posterPath,
  dataLancamento,
  notaMediaTmdb,
  favorito,
  onToggleFavorito,
  onOpen,
  desativarFavorito = false,
}) {
  const src = tmdbPoster(posterPath, 'w342');

  return (
    <article
      id={filmeId != null ? `filme-${filmeId}` : undefined}
      className="group flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md scroll-mt-24"
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative h-36 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">Sem capa</div>
        )}
      </button>
      <div className="min-w-0 flex-1 flex flex-col">
        <button type="button" onClick={onOpen} className="text-left">
          <h3 className="font-semibold text-slate-900 leading-snug group-hover:text-violet-700 transition-colors">
            {titulo}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {ano(dataLancamento) ? <span>{ano(dataLancamento)}</span> : null}
            {notaMediaTmdb != null ? (
              <span className="inline-flex items-center gap-0.5 text-amber-600">
                <Star className="w-3.5 h-3.5 fill-current" />
                {Number(notaMediaTmdb).toFixed(1)}
              </span>
            ) : null}
          </div>
        </button>
        <div className="mt-auto pt-3 flex justify-end">
          {!desativarFavorito && onToggleFavorito ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorito();
              }}
              className={`rounded-full p-2 transition-colors ${
                favorito
                  ? 'text-rose-500 bg-rose-50 hover:bg-rose-100'
                  : 'text-slate-400 hover:text-rose-500 hover:bg-slate-50'
              }`}
              title={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart className={`w-5 h-5 ${favorito ? 'fill-current' : ''}`} />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
