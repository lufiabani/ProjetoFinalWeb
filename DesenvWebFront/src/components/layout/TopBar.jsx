import MovieSearch from '../filmes/MovieSearch';

export default function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md">
      <p className="hidden sm:block text-sm text-slate-500 truncate">
        Descobre filmes e sincroniza com a tua filmoteca
      </p>
      <div className="flex-1 min-w-0 max-w-xl ml-auto">
        <MovieSearch />
      </div>
    </header>
  );
}
