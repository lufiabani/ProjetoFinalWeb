// TopBar.jsx — barra fixa com menu mobile e pesquisa rápida de filmes já na base.
import { Menu } from 'lucide-react';
import MovieSearch from '../filmes/MovieSearch';

export default function TopBar({ onOpenNav }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white/90 px-2 backdrop-blur-md sm:gap-3 sm:px-4">
      <button
        type="button"
        onClick={onOpenNav}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      <p className="hidden min-w-0 truncate text-sm text-slate-500 md:block">
        Filmes da base · comenta com a comunidade
      </p>
      <div className="min-w-0 flex-1 md:ml-auto md:max-w-xl">
        <MovieSearch />
      </div>
    </header>
  );
}
