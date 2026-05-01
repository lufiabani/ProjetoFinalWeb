// TopBar.jsx — barra fixa: menu (abre drawer em todos os ecrãs), marca (logo) e pesquisa na base.
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import MovieSearch from '../filmes/MovieSearch';
import BrandLogo from './BrandLogo';

export default function TopBar({ onOpenNav, sidebarOpen = false }) {
  return (
    <header className="sticky top-0 z-30 flex h-[3.25rem] shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white/90 px-2 backdrop-blur-md sm:h-14 sm:gap-3 sm:px-4">
      <button
        type="button"
        onClick={onOpenNav}
        className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        aria-label="Abrir menu lateral"
        aria-expanded={sidebarOpen}
        aria-controls="app-sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>
      <Link
        to="/inicio"
        className="hidden shrink-0 rounded-lg py-1 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-fuchsia-500 md:block"
        title="Início"
      >
        <BrandLogo
          className="max-h-9 w-auto max-w-[9rem] object-contain object-left sm:max-h-10"
          roundedClassName="rounded-xl"
        />
      </Link>
      <p className="hidden min-w-0 truncate text-xs text-slate-500 lg:block lg:max-w-[10rem] xl:max-w-none">
        Partilha opiniões sobre o que vês na comunidade.
      </p>
      <div className="min-w-0 flex-1 md:ml-auto md:max-w-xl">
        <MovieSearch />
      </div>
    </header>
  );
}
