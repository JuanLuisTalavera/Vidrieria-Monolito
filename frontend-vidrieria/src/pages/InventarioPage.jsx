import { useState, useEffect, useMemo } from 'react';
import axiosClient from '../api/axiosClient';
import ModalMaterial from './inventario/components/ModalMaterial';
import ModalVidrio from './inventario/components/ModalVidrio';
import ModalServicio from './inventario/components/ModalServicio';

// Categorías oficiales de materiales en inventario
export const CATEGORIAS_MATERIAL = [
  { id: 'MOLDURA', label: 'Molduras / Cuadros', icon: '🪵', colorBadge: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'PERFIL_ALUMINIO', label: 'Perfiles de Aluminio', icon: '🪟', colorBadge: 'bg-sky-100 text-sky-800 border-sky-200' },
  { id: 'ACCESORIO', label: 'Accesorios / Herrajes', icon: '🔩', colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'OTROS', label: 'Otros Insumos', icon: '📦', colorBadge: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'PRODUCTO_ESTANDAR', label: 'Producto Estándar / Listo', icon: '🛍️', colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
];

export default function InventarioPage() {
  // Pestaña activa: 'molduras' (Materiales) | 'vidrios' (Planchas de Vidrio) | 'servicios' (Servicios y Manufactura)
  const [activeTab, setActiveTab] = useState('molduras');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');

  // Estados de datos
  const [molduras, setMolduras] = useState([]);
  const [vidrios, setVidrios] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Notificaciones feedback
  const [notificacion, setNotificacion] = useState(null);

  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario para Materiales (Molduras, Perfiles, Accesorios, Otros, Producto Estándar)
  const [formMoldura, setFormMoldura] = useState({
    nombre: '',
    tipoMaterial: 'MOLDURA',
    categoria: 'MOLDURA',
    precioVarilla: '',
    longitudVarilla: '240',
    margenMayorista: '30',
    margenPublico: '50',
    margenCorteChico: '80',
  });

  // 1. Identificación de familia del material (Lineal vs Unitario)
  const form = {
    ...formMoldura,
    categoria: formMoldura.categoria || formMoldura.tipoMaterial || 'MOLDURA',
  };
  const esCategoriaLineal = form.categoria === 'MOLDURA' || form.categoria === 'PERFIL_ALUMINIO';

  // Formulario para Vidrios
  const [formVidrio, setFormVidrio] = useState({
    nombre: '',
    esTemplado: false,
    precioPlancha: '',
    anchoPlancha: '2.14',
    altoPlancha: '3.30',
    margenMayorista: '30',
    margenPublico: '50',
    margenCorteChico: '80',
  });

  // Formulario para Servicios y Manufactura
  const [formServicio, setFormServicio] = useState({
    nombre: '',
    descripcion: '',
    tipoCobro: 'METRO_LINEAL',
    precio: '',
  });

  // Helper para dar formato y badge visual a tipos de cobro
  const formatTipoCobro = (tipo) => {
    if (!tipo) return { label: 'Por Unidad', unit: '/und', icon: '🔢', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
    const upper = String(tipo).toUpperCase();
    if (upper.includes('LINEAL') || upper === 'ML') {
      return { label: 'Metro Lineal (m)', unit: '/m', icon: '📏', badge: 'bg-sky-50 text-sky-700 border-sky-200' };
    }
    if (upper.includes('UNIDAD') || upper === 'UND' || upper === 'PIEZA') {
      return { label: 'Por Unidad / Pieza', unit: '/und', icon: '🔢', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (upper.includes('CUADRADO') || upper === 'M2') {
      return { label: 'Metro Cuadrado (m²)', unit: '/m²', icon: '📐', badge: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (upper.includes('GLOBAL') || upper.includes('FIJO')) {
      return { label: 'Servicio Global / Fijo', unit: '/serv', icon: '🌐', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: tipo, unit: '', icon: '⚙️', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  // Helper para normalizar márgenes al abrir modal
  const normalizarMargenAString = (val, defecto = '30') => {
    if (val === undefined || val === null || val === '') return defecto;
    const num = parseFloat(val);
    if (isNaN(num)) return defecto;
    return num <= 1 && num > 0 ? String(Math.round(num * 100)) : String(Math.round(num));
  };

  // Recarga individual de materiales / molduras
  const fetchMateriales = async () => {
    try {
      const res = await axiosClient.get('/api/v1/materiales');
      setMolduras(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al recargar materiales:', err);
    }
  };

  // Recarga individual de tipos de vidrio
  const fetchVidrios = async () => {
    try {
      const res = await axiosClient.get('/api/v1/vidrios');
      setVidrios(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al recargar vidrios:', err);
    }
  };

  // Recarga individual de servicios y manufactura
  const fetchServicios = async () => {
    try {
      const res = await axiosClient.get('/api/v1/servicios-extras');
      setServicios(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al recargar servicios:', err);
    }
  };

  // Carga de datos de la API
  const fetchInventario = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchMateriales(), fetchVidrios(), fetchServicios()]);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      setError('No se pudo conectar con el servidor para obtener los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancel = false;
    Promise.all([
      axiosClient.get('/api/v1/materiales'),
      axiosClient.get('/api/v1/vidrios'),
      axiosClient.get('/api/v1/servicios-extras').catch((err) => {
        console.warn('Endpoint /api/v1/servicios-extras pendiente o no disponible aún:', err);
        return { data: [] };
      }),
    ])
      .then(([resMolduras, resVidrios, resServicios]) => {
        if (!cancel) {
          setMolduras(Array.isArray(resMolduras.data) ? resMolduras.data : []);
          setVidrios(Array.isArray(resVidrios.data) ? resVidrios.data : []);
          setServicios(Array.isArray(resServicios?.data) ? resServicios.data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancel) {
          console.error('Error al cargar inventario:', err);
          setError('No se pudo conectar con el servidor para obtener los materiales.');
          setLoading(false);
        }
      });

    return () => {
      cancel = true;
    };
  }, []);

  const showToast = (mensaje, tipo = 'success') => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => {
      setNotificacion(null);
    }, 4000);
  };

  // Abrir Modal para Crear
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Abrir Modal para Editar
  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Eliminar material o servicio con confirmación
  const handleDelete = async (item) => {
    if (activeTab === 'servicios') {
      const id = item.idServicioExtra ?? item.idExtra ?? item.id;
      const nombre = item.nombre;
      const confirmacion = window.confirm(
        `¿Confirmas que deseas eliminar el servicio "${nombre}"?\nEsta acción lo dará de baja en el sistema.`
      );
      if (!confirmacion) return;

      try {
        await axiosClient.delete(`/api/v1/servicios-extras/${id}`);
        setServicios((prev) => prev.filter((s) => (s.idServicioExtra ?? s.idExtra ?? s.id) !== id));
        showToast(`Servicio "${nombre}" eliminado del catálogo.`);
      } catch (err) {
        console.error('Error al eliminar servicio:', err);
        showToast('No se pudo eliminar el servicio. Inténtalo nuevamente.', 'error');
      }
      return;
    }

    const esMoldura = activeTab === 'molduras';
    const id = esMoldura ? item.idMaterial : item.idVidrio;
    const nombre = item.nombre;

    const confirmacion = window.confirm(
      `¿Confirmas que deseas eliminar "${nombre}"?\nEsta acción lo dará de baja en el sistema y no aparecerá en nuevas cotizaciones.`
    );

    if (!confirmacion) return;

    try {
      const endpoint = esMoldura ? `/api/v1/materiales/${id}` : `/api/v1/vidrios/${id}`;
      await axiosClient.delete(endpoint);

      // Actualización reactiva inmediata en estado local
      if (esMoldura) {
        setMolduras((prev) => prev.filter((m) => m.idMaterial !== id));
      } else {
        setVidrios((prev) => prev.filter((v) => v.idVidrio !== id));
      }

      showToast(`"${nombre}" eliminado del inventario.`);
    } catch (err) {
      console.error('Error al eliminar material:', err);
      showToast('No se pudo eliminar el material. Inténtalo nuevamente.', 'error');
    }
  };

  

  // Filtrado de listas por búsqueda y categoría
  const moldurasFiltradas = useMemo(() => {
    let lista = molduras;
    if (filtroCategoria !== 'TODOS') {
      lista = lista.filter((m) => {
        const cat = (m.tipoMaterial || '').toUpperCase();
        return cat === filtroCategoria || (filtroCategoria === 'MOLDURA' && cat.includes('MOLDURA'));
      });
    }
    if (!busqueda.trim()) return lista;
    const q = busqueda.toLowerCase();
    return lista.filter(
      (m) =>
        m.nombre?.toLowerCase().includes(q) ||
        m.tipoMaterial?.toLowerCase().includes(q)
    );
  }, [molduras, busqueda, filtroCategoria]);

  const vidriosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return vidrios;
    const q = busqueda.toLowerCase();
    return vidrios.filter(
      (v) =>
        v.nombre?.toLowerCase().includes(q) ||
        (v.esTemplado ? 'templado' : 'estandar simple').includes(q)
    );
  }, [vidrios, busqueda]);

  const serviciosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return servicios;
    const q = busqueda.toLowerCase();
    return servicios.filter(
      (s) =>
        s.nombre?.toLowerCase().includes(q) ||
        s.descripcion?.toLowerCase().includes(q) ||
        s.tipoCobro?.toLowerCase().includes(q)
    );
  }, [servicios, busqueda]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notificacion && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-top-4 duration-200 ${
            notificacion.tipo === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {notificacion.tipo === 'error' ? (
            <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{notificacion.mensaje}</span>
          <button
            onClick={() => setNotificacion(null)}
            className="text-slate-400 hover:text-slate-600 ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100/80 text-emerald-700 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Administración de Inventario
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona los costos de compra, medidas y márgenes comerciales de molduras y vidrios en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchInventario(true)}
            disabled={loading}
            title="Refrescar catálogo"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition shadow-2xs disabled:opacity-50"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            id="btn-nuevo-material"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm hover:shadow transition focus:ring-2 focus:ring-emerald-500/30"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>
              {activeTab === 'molduras'
                ? 'Nueva Moldura'
                : activeTab === 'vidrios'
                ? 'Nuevo Vidrio'
                : 'Nuevo Servicio'}
            </span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Información Rápida */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Molduras Cuadros</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {molduras.filter((m) => (m.tipoMaterial || '').toUpperCase().includes('MOLDURA')).length}
            </p>
            <p className="text-[11px] text-slate-500">Madera y poliestireno</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-base">
            🪵
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Perfiles Aluminio</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {molduras.filter((m) => (m.tipoMaterial || '').toUpperCase().includes('PERFIL')).length}
            </p>
            <p className="text-[11px] text-slate-500">Serie 20, 25, mamparas</p>
          </div>
          <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center font-bold text-base">
            🪟
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Accesorios & Otros</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {molduras.filter((m) => {
                const t = (m.tipoMaterial || '').toUpperCase();
                return t.includes('ACCESORIO') || t.includes('OTROS');
              }).length}
            </p>
            <p className="text-[11px] text-slate-500">Herrajes, felpa y tornillos</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-base">
            🔩
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tipos de Vidrio</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{vidrios.length}</p>
            <p className="text-[11px] text-slate-500">Planchas y cristales</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-base">
            ✨
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Servicios / Manufactura</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{servicios.length}</p>
            <p className="text-[11px] text-slate-500">Pulido, biselado, huecos</p>
          </div>
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold text-base">
            ⚙️
          </div>
        </div>
      </div>

      {/* Control de Pestañas (Tabs) y Barra de Búsqueda */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl max-w-fit flex-wrap gap-1">
            <button
              id="tab-molduras"
              onClick={() => {
                setActiveTab('molduras');
                setBusqueda('');
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'molduras'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🪵 Materiales & Perfiles</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'molduras'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {molduras.length}
              </span>
            </button>

            <button
              id="tab-vidrios"
              onClick={() => {
                setActiveTab('vidrios');
                setBusqueda('');
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'vidrios'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🪟 Planchas de Vidrio</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'vidrios'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {vidrios.length}
              </span>
            </button>

            <button
              id="tab-servicios"
              onClick={() => {
                setActiveTab('servicios');
                setBusqueda('');
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'servicios'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>⚙️ Servicios y Manufactura</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'servicios'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {servicios.length}
              </span>
            </button>
          </div>

          {/* Búsqueda rápida */}
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={
                activeTab === 'molduras'
                  ? 'Buscar por nombre o categoría...'
                  : activeTab === 'vidrios'
                  ? 'Buscar tipo de vidrio...'
                  : 'Buscar servicio o manufactura...'
              }
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Barra de Filtros por Categoría para Materiales */}
        {activeTab === 'molduras' && (
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Categoría:
            </span>
            <button
              type="button"
              onClick={() => setFiltroCategoria('TODOS')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filtroCategoria === 'TODOS'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todos ({molduras.length})
            </button>
            {CATEGORIAS_MATERIAL.map((cat) => {
              const count = molduras.filter((m) => {
                const t = (m.tipoMaterial || '').toUpperCase();
                return t === cat.id || (cat.id === 'MOLDURA' && t.includes('MOLDURA'));
              }).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFiltroCategoria(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filtroCategoria === cat.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    filtroCategoria === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Estado de Carga */}
        {loading && (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Cargando catálogo de materiales...</p>
          </div>
        )}

        {/* Mensaje de Error */}
        {!loading && error && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-slate-800 font-semibold">{error}</p>
            <button
              onClick={() => fetchInventario(true)}
              className="mt-3 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* TABLA DE MOLDURAS */}
        {!loading && !error && activeTab === 'molduras' && (
          <div className="overflow-x-auto">
            {moldurasFiltradas.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-base font-medium">No se encontraron molduras</p>
                <p className="text-xs text-slate-400 mt-1">
                  {busqueda ? 'Prueba con otro término de búsqueda.' : 'Haz clic en "Nueva Moldura" para registrar la primera.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Moldura / Perfil</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Longitud</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Costo Metro</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Mayorista</th>
                    <th scope="col" className="px-4 py-3.5 text-right bg-emerald-50/40 text-emerald-800">Público (Venta)</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Corte Chico</th>
                    <th scope="col" className="px-5 py-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {moldurasFiltradas.map((m) => (
                    <tr key={m.idMaterial} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{m.nombre}</span>
                          {/* Badge de Categoría */}
                          {(() => {
                            const catUpper = (m.tipoMaterial || '').toUpperCase();
                            const catInfo = CATEGORIAS_MATERIAL.find((c) => c.id === catUpper) || {
                              label: m.tipoMaterial || 'MOLDURA',
                              colorBadge: 'bg-slate-100 text-slate-700 border-slate-200',
                              icon: '📦',
                            };
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${catInfo.colorBadge}`}>
                                <span>{catInfo.icon}</span>
                                <span>{catInfo.label.split(' ')[0]}</span>
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ID #{m.idMaterial} &bull; {m.tipoMaterial || 'MOLDURA'}
                        </div>
                      </td>
                      {(() => {
                        const catUpper = (m.tipoMaterial || m.categoria || '').toUpperCase();
                        const esLinealRow = catUpper === 'MOLDURA' || catUpper === 'PERFIL_ALUMINIO';
                        const precioUnitarioVal = Number(m.precioPublicoUnitario ?? m.costoDefectoUnitario ?? m.precioVarilla ?? m.precioPublicoVarilla ?? 0);

                        return (
                          <>
                            <td className="px-4 py-4 text-center">
                              {esLinealRow ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                  {m.longitudVarilla ? `${m.longitudVarilla} cm` : '240 cm'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  🔢 Unitario
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              {esLinealRow ? (
                                <span className="text-slate-500 font-mono text-xs">
                                  S/ {Number(m.costoRealMetro || 0).toFixed(2)} /m
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              {esLinealRow ? (
                                <>
                                  <div className="font-semibold text-slate-800 font-mono">
                                    S/ {Number(m.precioMayoristaVarilla || 0).toFixed(2)}
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono">
                                    S/ {Number(m.precioMayoristaMetro || 0).toFixed(2)}/m
                                  </div>
                                </>
                              ) : (
                                <span className="text-slate-400 text-xs italic">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right bg-emerald-50/30">
                              <div className="font-bold text-emerald-700 font-mono text-base">
                                S/ {esLinealRow ? Number(m.precioPublicoVarilla || 0).toFixed(2) : precioUnitarioVal.toFixed(2)}
                              </div>
                              <div className="text-xs text-emerald-600 font-mono">
                                {esLinealRow ? `S/ ${Number(m.precioPublicoMetro || 0).toFixed(2)}/m` : 'por unidad'}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              {esLinealRow ? (
                                <>
                                  <div className="font-medium text-slate-700 font-mono">
                                    S/ {Number(m.precioCorteChicoVarilla || 0).toFixed(2)}
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono">
                                    S/ {Number(m.precioCorteChicoMetro || 0).toFixed(2)}/m
                                  </div>
                                </>
                              ) : (
                                <span className="text-slate-400 text-xs italic">—</span>
                              )}
                            </td>
                          </>
                        );
                      })()}
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Editar moldura y precios"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(m)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar moldura"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TABLA DE VIDRIOS */}
        {!loading && !error && activeTab === 'vidrios' && (
          <div className="overflow-x-auto">
            {vidriosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-base font-medium">No se encontraron tipos de vidrio</p>
                <p className="text-xs text-slate-400 mt-1">
                  {busqueda ? 'Prueba con otro término de búsqueda.' : 'Haz clic en "Nuevo Vidrio" para registrar el primero.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Tipo de Vidrio</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Tipo</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Costo Base m²</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Mayorista</th>
                    <th scope="col" className="px-4 py-3.5 text-right bg-emerald-50/40 text-emerald-800">Público (Venta)</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Corte Chico</th>
                    <th scope="col" className="px-5 py-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {vidriosFiltrados.map((v) => (
                    <tr key={v.idVidrio} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{v.nombre}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ID #{v.idVidrio}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                            v.esTemplado
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {v.esTemplado ? 'Templado' : 'Estándar'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-slate-500 font-mono text-xs">
                          S/ {Number(v.costoRealM2 || 0).toFixed(2)} /m²
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-semibold text-slate-800 font-mono">
                          S/ {Number(v.precioMayoristaM2 || 0).toFixed(2)}/m²
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          S/ {Number(v.precioMayoristaPie2 || 0).toFixed(2)}/p²
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right bg-emerald-50/30">
                        <div className="font-bold text-emerald-700 font-mono text-base">
                          S/ {Number(v.precioPublicoM2 || 0).toFixed(2)}/m²
                        </div>
                        <div className="text-xs text-emerald-600 font-mono">
                          S/ {Number(v.precioPublicoPie2 || 0).toFixed(2)}/p²
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-medium text-slate-700 font-mono">
                          S/ {Number(v.precioCorteChicoM2 || 0).toFixed(2)}/m²
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          S/ {Number(v.precioCorteChicoPie2 || 0).toFixed(2)}/p²
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Editar vidrio y precios"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar vidrio"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TABLA DE SERVICIOS Y MANUFACTURA */}
        {!loading && !error && activeTab === 'servicios' && (
          <div className="overflow-x-auto">
            {serviciosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">
                  ⚙️
                </div>
                <p className="text-base font-semibold text-slate-700">No hay servicios o manufactura registrados</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {busqueda
                    ? 'No se encontraron servicios que coincidan con la búsqueda.'
                    : 'Crea tarifas de manufactura (pulido, biselado, huecos, instalación) para utilizarlas en cotizaciones y pedidos.'}
                </p>
                {!busqueda && (
                  <button
                    onClick={handleOpenCreate}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    <span>+ Agregar Primer Servicio</span>
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Servicio / Manufactura</th>
                    <th scope="col" className="px-5 py-3.5">Descripción</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Tipo de Cobro</th>
                    <th scope="col" className="px-5 py-3.5 text-right bg-emerald-50/40 text-emerald-800">
                      Precio Unitario
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {serviciosFiltrados.map((s) => {
                    const id = s.idServicioExtra ?? s.idExtra ?? s.id;
                    const precio = Number(s.precio ?? s.precioSugerido ?? s.precioBase ?? 0);
                    const cobroInfo = formatTipoCobro(s.tipoCobro);

                    return (
                      <tr key={id || s.nombre} className="hover:bg-slate-50/75 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-sm shrink-0">
                              {cobroInfo.icon}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-900">{s.nombre}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                ID #{id} &bull; {s.categoriaAplicable || 'MANUFACTURA'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-slate-600 max-w-md line-clamp-2 leading-relaxed">
                            {s.descripcion ? s.descripcion : <span className="text-slate-400 italic">Sin descripción</span>}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cobroInfo.badge}`}>
                            <span>{cobroInfo.icon}</span>
                            <span>{cobroInfo.label}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right bg-emerald-50/30">
                          <div className="font-extrabold text-emerald-700 font-mono text-base">
                            S/ {precio.toFixed(2)}
                          </div>
                          <div className="text-[11px] text-emerald-600/80 font-medium">
                            {cobroInfo.unit ? `por ${cobroInfo.unit.replace('/', '')}` : 'tarifa base'}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                              title="Editar precio y datos del servicio"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                              title="Eliminar servicio"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>


      {/* MODALES DE CREACIÓN Y EDICIÓN */}
      <ModalMaterial
        isOpen={isModalOpen && activeTab === 'molduras'}
        onClose={() => setIsModalOpen(false)}
        modoEdicion={modalMode === 'edit'}
        itemToEdit={editingItem}
        onSuccess={fetchMateriales}
        showToast={showToast}
      />

      <ModalVidrio
        isOpen={isModalOpen && activeTab === 'vidrios'}
        onClose={() => setIsModalOpen(false)}
        modoEdicion={modalMode === 'edit'}
        itemToEdit={editingItem}
        onSuccess={fetchVidrios}
        showToast={showToast}
      />

      <ModalServicio
        isOpen={isModalOpen && activeTab === 'servicios'}
        onClose={() => setIsModalOpen(false)}
        modoEdicion={modalMode === 'edit'}
        itemToEdit={editingItem}
        onSuccess={fetchServicios}
        showToast={showToast}
      />

    </div>
  );
}
