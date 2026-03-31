// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { Film, Home, LogOut, Tag, FileText, UsersRound } from 'lucide-react';
import { useKeycloakContext } from '../../contexts/KeycloakContext';

const menuItems = [
  { to: '/inicio', label: 'Início', icon: Home, enabled: true },
  { to: '/categorias', label: 'Categorias', icon: Tag, enabled: false },
  { to: '/detalhes', label: 'Detalhes', icon: FileText, enabled: false },
  { to: '/fornecedores', label: 'Fornecedores', icon: UsersRound, enabled: false },
];

function Sidebar() {
  const kc = useKeycloakContext();

  const sair = () => {
    kc.logout({ redirectUri: window.location.origin });
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Filmoteca</h1>
            <p className="text-xs text-gray-400">Keycloak + TMDB</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Menu
        </p>
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.to}>
              {item.enabled ? (
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-violet-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ) : (
                <span className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 cursor-not-allowed">
                  <item.icon className="w-5 h-5" />
                  {item.label}
                  <span className="ml-auto text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                    Em breve
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t border-gray-700 space-y-2">
        <button
          type="button"
          onClick={sair}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair (Keycloak)
        </button>
        <p className="px-3 text-xs text-gray-500">Desenv. Sistemas Web</p>
      </div>
    </aside>
  );
}

export default Sidebar;
