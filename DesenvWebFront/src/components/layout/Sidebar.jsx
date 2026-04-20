// Sidebar.jsx — navegação principal e saída Keycloak (logout com redirect para a origem).
import { NavLink } from 'react-router-dom';
import { Home, LogOut, ArrowDownToLine, X, Bookmark } from 'lucide-react';
import { getKeycloak } from '../../keycloak';
import BrandLogo from './BrandLogo';

const menuItems = [
  { to: '/inicio', label: 'Início', icon: Home },
  { to: '/meus-filmes', label: 'Os meus filmes', icon: Bookmark },
  { to: '/importar', label: 'Importar filmes', icon: ArrowDownToLine },
];

function Sidebar({ mobileOpen, onClose }) {
  const sair = () => {
    getKeycloak()?.logout({ redirectUri: window.location.origin })
  };

  const fecharSeMobile = () => {
    onClose?.();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-full w-[min(100%,16rem)] max-w-[85vw] flex-col bg-gray-900 text-white transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:max-w-none lg:flex-shrink-0 lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="relative border-b border-gray-700 px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
        <button
          type="button"
          onClick={fecharSeMobile}
          className="absolute right-2 top-4 z-10 rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
        <NavLink
          to="/inicio"
          onClick={fecharSeMobile}
          className="flex w-full justify-center outline-none ring-offset-2 ring-offset-gray-900 focus-visible:ring-2 focus-visible:ring-fuchsia-400"
          title="Ir para o início"
        >
          <BrandLogo
            className="max-h-[4.25rem] w-auto max-w-[11.5rem] object-contain object-center"
            roundedClassName="rounded-2xl"
          />
        </NavLink>
        <p className="mt-3 text-center text-xs leading-snug text-gray-400">
          Notas TMDB, comentários e favoritos na comunidade.
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Menu</p>
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={fecharSeMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-fuchsia-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-2 border-t border-gray-700 px-3 py-4">
        <button
          type="button"
          onClick={sair}
          title="Sair da sessão Keycloak"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="truncate sm:hidden">Sair</span>
          <span className="hidden truncate sm:inline">Sair (Keycloak)</span>
        </button>
        <p className="px-3 text-xs text-gray-500">Desenv. Sistemas Web</p>
      </div>
    </aside>
  );
}

export default Sidebar;
