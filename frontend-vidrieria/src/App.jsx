import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import CotizadorPage from './pages/CotizadorPage';
import CotizadorObrasPage from './pages/CotizadorObrasPage';
import PedidosPage from './pages/PedidosPage';
import InventarioPage from './pages/InventarioPage';
import ClientesPage from './pages/ClientesPage';
import LoginPage from './pages/LoginPage';
import GestorSistemasObrasPage from './pages/GestorSistemasObrasPage';
import TrazadorVidriosLibrePage from './pages/TrazadorVidriosLibrePage';
import CotizadorVidriosPage from './pages/CotizadorVidriosPage';
import OperarioDashboardPage from './pages/OperarioDashboardPage';
import { PedidoProvider } from './context/PedidoContext';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token') || localStorage.getItem('TOKEN');
  if (!token) return <Navigate replace to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const rol = localStorage.getItem('rol');
  if (rol !== 'ADMIN') return <Navigate replace to="/" />;
  return children;
};

// Componente que resuelve la pantalla de inicio según el rol del usuario
const HomeDashboard = () => {
  const rol = localStorage.getItem('rol');
  return rol === 'ADMIN' ? <DashboardPage /> : <OperarioDashboardPage />;
};

export default function App() {
  return (
    <BrowserRouter>
      <PedidoProvider>
        <Routes>
          {/* Ruta pública de Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas bajo AdminLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Inicio dinámico: Admin ve Dashboard general, Operario ve Mi Caja */}
            <Route index element={<HomeDashboard />} />
            <Route
              path="dashboard"
              element={
                <AdminRoute>
                  <DashboardPage />
                </AdminRoute>
              }
            />
            <Route path="mi-caja" element={<OperarioDashboardPage />} />
            <Route path="cotizador" element={<CotizadorPage />} />
            <Route path="cotizador-vidrios" element={<CotizadorVidriosPage />} />
            <Route path="cotizador-obras" element={<CotizadorObrasPage />} />
            <Route path="trazador-vidrio" element={<TrazadorVidriosLibrePage />} />
            <Route path="trazador-vidrios" element={<Navigate replace to="/trazador-vidrio" />} />
            <Route path="pedidos" element={<PedidosPage />} />
            <Route
              path="clientes"
              element={
                <AdminRoute>
                  <ClientesPage />
                </AdminRoute>
              }
            />
            <Route
              path="inventario"
              element={
                <AdminRoute>
                  <InventarioPage />
                </AdminRoute>
              }
            />
            <Route
              path="sistemas-obras"
              element={
                <AdminRoute>
                  <GestorSistemasObrasPage />
                </AdminRoute>
              }
            />
          </Route>

          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </PedidoProvider>
    </BrowserRouter>
  );
}
