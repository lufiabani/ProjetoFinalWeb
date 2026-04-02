import { BookmarkPlus, Check } from 'lucide-react';
import { posterUrl } from '../../services/tmdb';

export default function TmdbTrendingCard({
  movie,
  jaNaBase,
  gravando,
  onAdicionar,
}) {
  const src = posterUrl(movie.poster_path, 'w342');
  const title = movie.title || movie.original_title;

  return (
    <div className="w-[140px] flex-shrink-0 snap-start">
      <div className="relative overflow-hidden rounded-xl bg-slate-800 shadow-md ring-1 ring-white/10">
        <div className="aspect-[2/3] w-full">
          {src ? (
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center text-xs text-slate-400">
              Sem capa
            </div>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-8">
          <p className="line-clamp-2 text-xs font-medium text-white leading-tight">{title}</p>
        </div>
      </div>
      <div className="mt-2">
        {jaNaBase ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Check className="w-3.5 h-3.5" />
            Na filmoteca
          </span>
        ) : (
          <button
            type="button"
            disabled={gravando}
            onClick={() => onAdicionar?.(movie)}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-violet-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            {gravando ? 'A gravar…' : 'Guardar'}
          </button>
        )}
      </div>
    </div>
  );
}
