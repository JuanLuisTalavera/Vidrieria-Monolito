import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  const rol = localStorage.getItem('rol');
  const esOperario = rol === 'OPERARIO';

  const handleCerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('TOKEN');
    localStorage.removeItem('rol');
    window.location.href = '/login';
  };

  const getNavClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-600 text-white shadow-sm font-semibold'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="flex print:block min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="bg-slate-900 text-white w-64 min-h-screen p-6 print:hidden flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
              🪟
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight leading-tight">
                ERP Vidriería
              </h2>
              <p className="text-[11px] text-emerald-400 font-medium">Taller & Marquería</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {/* Inicio: Dashboard para Admin o Mi Caja para Operario */}
            {esOperario ? (
              <NavLink to="/" end className={getNavClass}>
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Mi Caja</span>
              </NavLink>
            ) : (
              <NavLink to="/" end className={getNavClass}>
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                <span>Dashboard</span>
              </NavLink>
            )}

            <NavLink to="/cotizador" className={getNavClass}>
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Cotizador</span>
            </NavLink>

            <NavLink to="/pedidos" className={getNavClass}>
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Pedidos</span>
            </NavLink>

            {/* Clientes e Inventario exclusivos para administradores */}
            {rol === 'ADMIN' && (
              <>
                <NavLink to="/clientes" className={getNavClass}>
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Clientes</span>
                </NavLink>

                <NavLink to="/inventario" className={getNavClass}>
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>Inventario</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Footer info in sidebar con Cerrar Sesión */}
        <div className="pt-6 border-t border-slate-800/80 text-xs text-slate-400 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${esOperario ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className="text-slate-300 font-medium">
                {esOperario ? 'Operario' : 'Administrador'}
              </span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded border border-slate-700">
              {rol || 'SESIÓN'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCerrarSesion}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer shadow-xs"
            title="Cerrar sesión actual"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 min-h-screen print:p-0 print:m-0 print:min-h-0 print:w-full print:bg-white overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
