// FilmeFeedCard.jsx — cartão em lista (feed) com âncora id=filme-{id} para pesquisa e painel de favoritos.
import { Heart, Star, Users } from 'lucide-react';
import { posterUrl as tmdbPoster } from '../../services/tmdb';

function ano(dataLancamento) {
  if (!dataLancamento) return null;
  const s = String(dataLancamento);
  const y = s.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : null;
}

function rotularVotosTmdb(total) {
  if (total == null || Number.isNaN(Number(total))) return null;
  const n = Number(total);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export default function FilmeFeedCard({
  filmeId,
  titulo,
  posterPath,
  dataLancamento,
  notaMediaTmdb,
  totalVotosTmdb,
  totalFavoritos = 0,
  generoNome,
  favorito,
  onToggleFavorito,
  onOpen,
  desativarFavorito = false,
}) {
  const src = tmdbPoster(posterPath, 'w342');

  return (
    <article
      id={filmeId != null ? `filme-${filmeId}` : undefined}
      className="group flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:border-violet-200 hover:shadow-md scroll-mt-20 sm:gap-4 sm:p-4 sm:scroll-mt-24"
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative h-28 w-[4.5rem] flex-shrink-0 overflow-hidden rounded-xl bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:h-36 sm:w-24"
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">Sem capa</div>
        )}
      </button>
      <div className="min-w-0 flex-1 flex flex-col">
        <button type="button" onClick={onOpen} className="min-w-0 text-left">
          <h3 className="text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-violet-700 sm:text-base">
            {titulo}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
            {ano(dataLancamento) ? <span>{ano(dataLancamento)}</span> : null}
            {generoNome ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {generoNome}
              </span>
            ) : null}
            {notaMediaTmdb != null ? (
              <span className="inline-flex items-center gap-1 text-amber-700" title="Média de votos no TMDB">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="font-semibold">{Number(notaMediaTmdb).toFixed(1)}</span>
                {rotularVotosTmdb(totalVotosTmdb) ? (
                  <span className="font-normal text-slate-500">({rotularVotosTmdb(totalVotosTmdb)} votos)</span>
                ) : null}
              </span>
            ) : null}
            {totalFavoritos > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                <Users className="w-3.5 h-3.5" />
                {totalFavoritos === 1 ? '1 pessoa guardou' : `${totalFavoritos} guardaram`}
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
