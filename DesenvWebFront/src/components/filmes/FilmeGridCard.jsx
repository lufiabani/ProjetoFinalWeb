import { Heart, Star, Users } from 'lucide-react';
import { posterUrl as tmdbPoster } from '../../services/tmdb';

function ano(dataLancamento) {
  if (!dataLancamento) return null;
  const s = String(dataLancamento);
  const y = s.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : null;
}

export default function FilmeGridCard({
  filmeId,
  titulo,
  posterPath,
  dataLancamento,
  notaMediaTmdb,
  totalFavoritos = 0,
  favorito,
  onToggleFavorito,
  onOpen,
  desativarFavorito = false,
}) {
  const src = tmdbPoster(posterPath, 'w342');

  return (
    <article
      id={filmeId != null ? `filme-${filmeId}` : undefined}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-violet-200 hover:shadow-md scroll-mt-20 sm:scroll-mt-24"
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative aspect-[2/3] w-full overflow-hidden bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-inset"
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-slate-500">
            Sem capa
          </div>
        )}
      </button>
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <button type="button" onClick={onOpen} className="min-w-0 text-left">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-violet-700">
            {titulo}
          </h3>
          <div className="mt-1 flex flex-col gap-1 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-1.5">
              {ano(dataLancamento) ? <span>{ano(dataLancamento)}</span> : null}
              {notaMediaTmdb != null ? (
                <span className="inline-flex items-center gap-0.5 text-amber-600">
                  <Star className="w-3 h-3 fill-current" />
                  {Number(notaMediaTmdb).toFixed(1)}
                </span>
              ) : null}
            </div>
            {totalFavoritos > 0 ? (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                <Users className="w-3 h-3" />
                {totalFavoritos}
              </span>
            ) : null}
          </div>
        </button>
        {!desativarFavorito && onToggleFavorito ? (
          <div className="mt-auto flex justify-end border-t border-slate-100 pt-2">
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
              <Heart className={`h-5 w-5 ${favorito ? 'fill-current' : ''}`} />
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
