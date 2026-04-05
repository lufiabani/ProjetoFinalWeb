// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { Film, Home, LogOut, Tag, FileText, UsersRound, X } from 'lucide-react';
import { useKeycloakContext } from '../../contexts/KeycloakContext';

const menuItems = [
  { to: '/inicio', label: 'Início', icon: Home, enabled: true },
  { to: '/categorias', label: 'Categorias', icon: Tag, enabled: false },
  { to: '/detalhes', label: 'Detalhes', icon: FileText, enabled: false },
  { to: '/fornecedores', label: 'Fornecedores', icon: UsersRound, enabled: false },
];

function Sidebar({ mobileOpen, onClose }) {
  const kc = useKeycloakContext();

  const sair = () => {
    kc.logout({ redirectUri: window.location.origin });
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
      <div className="flex items-start justify-between gap-2 border-b border-gray-700 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-violet-600">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight">Filmoteca</h1>
            <p className="text-xs text-gray-400">Keycloak + TMDB</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fecharSeMobile}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Menu</p>
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.to}>
              {item.enabled ? (
                <NavLink
                  to={item.to}
                  onClick={fecharSeMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-violet-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ) : (
                <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600">
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="min-w-0 truncate">{item.label}</span>
                  <span className="ml-auto flex-shrink-0 rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400">
                    Em breve
                  </span>
                </span>
              )}
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
