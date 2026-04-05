import { User } from 'lucide-react';

export default function PerfilFavoritosPainel({ perfil, perfilErro, favoritosLista }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
            <User className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-300">Sessão</p>
            {perfilErro ? (
              <p className="truncate text-xs text-rose-300">Erro ao carregar perfil</p>
            ) : perfil ? (
              <>
                <p className="truncate font-semibold">
                  {perfil.nomeExibicao || perfil.email || 'Utilizador'}
                </p>
                <p className="truncate text-xs text-slate-400">{perfil.email}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">A carregar…</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Favoritos</p>
        {favoritosLista.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Ainda sem favoritos. Abre um filme e toca no coração.
          </p>
        ) : (
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {favoritosLista.slice(0, 8).map((item) => (
              <li key={item.favoritoId}>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById(`filme-${item.filme.id}`)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                  }}
                  className="flex w-full items-center gap-2 rounded-lg py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span className="line-clamp-2 font-medium">{item.filme.titulo}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
