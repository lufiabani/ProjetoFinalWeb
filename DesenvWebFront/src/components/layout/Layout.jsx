// src/components/layout/Layout.jsx
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
      <div className="flex min-h-0 h-[100dvh] bg-slate-100">
        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
            aria-label="Fechar menu"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}
        <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TopBar onOpenNav={() => setMobileNavOpen(true)} />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
            <Outlet />
          </main>
        </div>
      </div>
  );
}

export default Layout;
