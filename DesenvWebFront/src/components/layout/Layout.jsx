// src/components/layout/Layout.jsx
import { Outlet } from 'react-router-dom';
import { FavoritosProvider } from '../../contexts/FavoritosContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

function Layout() {
  return (
    <FavoritosProvider>
      <div className="flex h-screen bg-slate-100">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </FavoritosProvider>
  );
}

export default Layout;