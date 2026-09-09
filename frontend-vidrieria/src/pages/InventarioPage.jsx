import { useState, useEffect, useMemo } from 'react';
import axiosClient from '../api/axiosClient';

export default function InventarioPage() {
  // Pestaña activa: 'molduras' | 'vidrios'
  const [activeTab, setActiveTab] = useState('molduras');

  // Estados de datos
  const [molduras, setMolduras] = useState([]);
  const [vidrios, setVidrios] = useState([]);
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

  // Formulario para Molduras
  const [formMoldura, setFormMoldura] = useState({
    nombre: '',
    tipoMaterial: 'MOLDURA DE MADERA',
    precioVarilla: '',
    longitudVarilla: '240',
    margenMayorista: '30',
    margenPublico: '50',
    margenCorteChico: '80',
  });

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

  // Carga de datos de la API
  const fetchInventario = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const [resMolduras, resVidrios] = await Promise.all([
        axiosClient.get('/api/v1/materiales'),
        axiosClient.get('/api/v1/vidrios'),
      ]);
      setMolduras(Array.isArray(resMolduras.data) ? resMolduras.data : []);
      setVidrios(Array.isArray(resVidrios.data) ? resVidrios.data : []);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      setError('No se pudo conectar con el servidor para obtener los materiales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancel = false;
    Promise.all([
      axiosClient.get('/api/v1/materiales'),
      axiosClient.get('/api/v1/vidrios'),
    ])
      .then(([resMolduras, resVidrios]) => {
        if (!cancel) {
          setMolduras(Array.isArray(resMolduras.data) ? resMolduras.data : []);
          setVidrios(Array.isArray(resVidrios.data) ? resVidrios.data : []);
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
    if (activeTab === 'molduras') {
      setFormMoldura({
        nombre: '',
        tipoMaterial: 'MOLDURA DE MADERA',
        precioVarilla: '',
        longitudVarilla: '240',
        margenMayorista: '30',
        margenPublico: '50',
        margenCorteChico: '80',
      });
    } else {
      setFormVidrio({
        nombre: '',
        esTemplado: false,
        precioPlancha: '',
        anchoPlancha: '2.14',
        altoPlancha: '3.30',
        margenMayorista: '30',
        margenPublico: '50',
        margenCorteChico: '80',
      });
    }
    setIsModalOpen(true);
  };

  // Abrir Modal para Editar
  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setEditingItem(item);

    if (activeTab === 'molduras') {
      // Inferencia o lectura de costo base y márgenes si no vienen explícitos
      let precioVarillaCalculado = item.precioVarilla;
      let mMay = item.margenMayorista;
      let mPub = item.margenPublico;
      let mChico = item.margenCorteChico;

      // Si el backend no envió precioVarilla directo, inferimos de precioPublicoVarilla con margen 50%
      if (!precioVarillaCalculado && item.precioPublicoVarilla) {
        precioVarillaCalculado = (item.precioPublicoVarilla / 1.5).toFixed(2);
      }

      setFormMoldura({
        nombre: item.nombre || '',
        tipoMaterial: item.tipoMaterial || 'MOLDURA DE MADERA',
        precioVarilla: precioVarillaCalculado !== undefined && precioVarillaCalculado !== null ? String(precioVarillaCalculado) : '',
        longitudVarilla: item.longitudVarilla ? String(item.longitudVarilla) : '240',
        margenMayorista: mMay !== undefined && mMay !== null ? String(Math.round(mMay * 100)) : '30',
        margenPublico: mPub !== undefined && mPub !== null ? String(Math.round(mPub * 100)) : '50',
        margenCorteChico: mChico !== undefined && mChico !== null ? String(Math.round(mChico * 100)) : '80',
      });
    } else {
      // Vidrio
      let precioPlanchaCalc = item.precioPlancha;
      let anchoCalc = item.anchoPlancha || '2.14';
      let altoCalc = item.altoPlancha || '3.30';
      let mMay = item.margenMayorista;
      let mPub = item.margenPublico;
      let mChico = item.margenCorteChico;

      if (!precioPlanchaCalc && item.costoRealM2) {
        const area = Number(anchoCalc) * Number(altoCalc) || 7.062;
        precioPlanchaCalc = (item.costoRealM2 * area).toFixed(2);
      }

      setFormVidrio({
        nombre: item.nombre || '',
        esTemplado: Boolean(item.esTemplado),
        precioPlancha: precioPlanchaCalc !== undefined && precioPlanchaCalc !== null ? String(precioPlanchaCalc) : '',
        anchoPlancha: String(anchoCalc),
        altoPlancha: String(altoCalc),
        margenMayorista: mMay !== undefined && mMay !== null ? String(Math.round(mMay * 100)) : '30',
        margenPublico: mPub !== undefined && mPub !== null ? String(Math.round(mPub * 100)) : '50',
        margenCorteChico: mChico !== undefined && mChico !== null ? String(Math.round(mChico * 100)) : '80',
      });
    }
    setIsModalOpen(true);
  };

  // Guardar (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (activeTab === 'molduras') {
        const precioVarillaNum = parseFloat(formMoldura.precioVarilla) || 0;
        const longitudNum = parseFloat(formMoldura.longitudVarilla) || 240;
        const mayNum = (parseFloat(formMoldura.margenMayorista) || 0) / 100;
        const pubNum = (parseFloat(formMoldura.margenPublico) || 0) / 100;
        const chicoNum = (parseFloat(formMoldura.margenCorteChico) || 0) / 100;

        const payload = {
          nombre: formMoldura.nombre.trim(),
          tipoMaterial: formMoldura.tipoMaterial || 'MOLDURA DE MADERA',
          precioVarilla: precioVarillaNum,
          longitudVarilla: longitudNum,
          margenMayorista: mayNum,
          margenPublico: pubNum,
          margenCorteChico: chicoNum,
        };

        if (modalMode === 'create') {
          await axiosClient.post('/api/v1/materiales', payload);
          showToast(`Moldura "${payload.nombre}" agregada correctamente.`);
        } else {
          await axiosClient.put(`/api/v1/materiales/${editingItem.idMaterial}`, payload);
          showToast(`Moldura "${payload.nombre}" actualizada con éxito.`);
        }
      } else {
        // Vidrio
        const precioPlanchaNum = parseFloat(formVidrio.precioPlancha) || 0;
        const anchoNum = parseFloat(formVidrio.anchoPlancha) || 2.14;
        const altoNum = parseFloat(formVidrio.altoPlancha) || 3.30;
        const mayNum = (parseFloat(formVidrio.margenMayorista) || 0) / 100;
        const pubNum = (parseFloat(formVidrio.margenPublico) || 0) / 100;
        const chicoNum = (parseFloat(formVidrio.margenCorteChico) || 0) / 100;

        const payload = {
          nombre: formVidrio.nombre.trim(),
          esTemplado: formVidrio.esTemplado,
          precioPlancha: precioPlanchaNum,
          anchoPlancha: anchoNum,
          altoPlancha: altoNum,
          margenMayorista: mayNum,
          margenPublico: pubNum,
          margenCorteChico: chicoNum,
        };

        if (modalMode === 'create') {
          await axiosClient.post('/api/v1/vidrios', payload);
          showToast(`Vidrio "${payload.nombre}" agregado correctamente.`);
        } else {
          await axiosClient.put(`/api/v1/vidrios/${editingItem.idVidrio}`, payload);
          showToast(`Vidrio "${payload.nombre}" actualizado con éxito.`);
        }
      }

      setIsModalOpen(false);
      await fetchInventario(false);
    } catch (err) {
      console.error('Error al guardar material:', err);
      const msg = err.response?.data?.message || 'Ocurrió un error al procesar la solicitud.';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar material con confirmación
  const handleDelete = async (item) => {
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

  // Cálculos en vivo para el simulador de precios dentro del modal
  const simuladorMoldura = useMemo(() => {
    const precio = parseFloat(formMoldura.precioVarilla) || 0;
    const longitud = parseFloat(formMoldura.longitudVarilla) || 240;
    const may = (parseFloat(formMoldura.margenMayorista) || 0) / 100;
    const pub = (parseFloat(formMoldura.margenPublico) || 0) / 100;
    const chico = (parseFloat(formMoldura.margenCorteChico) || 0) / 100;

    // Si longitud está en cm (> 10), costo por metro = precio / (longitud / 100)
    // En el backend calcula precioVarilla / longitudVarilla directo
    const costoMetro = longitud > 0 ? precio / longitud : 0;

    return {
      costoMetro: costoMetro.toFixed(2),
      costoVarilla: precio.toFixed(2),
      precioMayoristaVarilla: (precio * (1 + may)).toFixed(2),
      precioPublicoVarilla: (precio * (1 + pub)).toFixed(2),
      precioCorteChicoVarilla: (precio * (1 + chico)).toFixed(2),
      precioMayoristaMetro: (costoMetro * (1 + may)).toFixed(2),
      precioPublicoMetro: (costoMetro * (1 + pub)).toFixed(2),
      precioCorteChicoMetro: (costoMetro * (1 + chico)).toFixed(2),
    };
  }, [formMoldura]);

  const simuladorVidrio = useMemo(() => {
    const precio = parseFloat(formVidrio.precioPlancha) || 0;
    const ancho = parseFloat(formVidrio.anchoPlancha) || 0;
    const alto = parseFloat(formVidrio.altoPlancha) || 0;
    const area = ancho * alto;
    const may = (parseFloat(formVidrio.margenMayorista) || 0) / 100;
    const pub = (parseFloat(formVidrio.margenPublico) || 0) / 100;
    const chico = (parseFloat(formVidrio.margenCorteChico) || 0) / 100;

    const costoM2 = area > 0 ? precio / area : 0;
    const factorPie2 = 10.7639;

    const pmMayorista = costoM2 * (1 + may);
    const pmPublico = costoM2 * (1 + pub);
    const pmChico = costoM2 * (1 + chico);

    return {
      area: area.toFixed(2),
      costoM2: costoM2.toFixed(2),
      precioMayoristaM2: pmMayorista.toFixed(2),
      precioPublicoM2: pmPublico.toFixed(2),
      precioCorteChicoM2: pmChico.toFixed(2),
      precioMayoristaPie2: (pmMayorista / factorPie2).toFixed(2),
      precioPublicoPie2: (pmPublico / factorPie2).toFixed(2),
      precioCorteChicoPie2: (pmChico / factorPie2).toFixed(2),
    };
  }, [formVidrio]);

  // Filtrado de listas por búsqueda
  const moldurasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return molduras;
    const q = busqueda.toLowerCase();
    return molduras.filter(
      (m) =>
        m.nombre?.toLowerCase().includes(q) ||
        m.tipoMaterial?.toLowerCase().includes(q)
    );
  }, [molduras, busqueda]);

  const vidriosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return vidrios;
    const q = busqueda.toLowerCase();
    return vidrios.filter(
      (v) =>
        v.nombre?.toLowerCase().includes(q) ||
        (v.esTemplado ? 'templado' : 'estandar simple').includes(q)
    );
  }, [vidrios, busqueda]);

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
            <span>{activeTab === 'molduras' ? 'Nueva Moldura' : 'Nuevo Vidrio'}</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Información Rápida */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Molduras</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{molduras.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Perfiles y varillas activos</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-lg">
            🪵
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tipos de Vidrio</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{vidrios.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Planchas y cristales activos</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
            🪟
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Márgenes Estándar</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">May: 30%</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">Púb: 50%</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">Retazo: 80%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Recálculo automático contra inflación</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg">
            📈
          </div>
        </div>
      </div>

      {/* Control de Pestañas (Tabs) y Barra de Búsqueda */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl max-w-fit">
            <button
              id="tab-molduras"
              onClick={() => {
                setActiveTab('molduras');
                setBusqueda('');
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'molduras'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🪵 Molduras de Madera</span>
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
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'vidrios'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🪟 Tipos de Vidrio</span>
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
              placeholder={activeTab === 'molduras' ? 'Buscar moldura por nombre...' : 'Buscar tipo de vidrio...'}
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
                        <div className="font-semibold text-slate-900">{m.nombre}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {m.tipoMaterial || 'Moldura'} &bull; ID #{m.idMaterial}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          {m.longitudVarilla ? `${m.longitudVarilla} cm` : '240 cm'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-slate-500 font-mono text-xs">
                          S/ {Number(m.costoRealMetro || 0).toFixed(2)} /m
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-semibold text-slate-800 font-mono">
                          S/ {Number(m.precioMayoristaVarilla || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          S/ {Number(m.precioMayoristaMetro || 0).toFixed(2)}/m
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right bg-emerald-50/30">
                        <div className="font-bold text-emerald-700 font-mono text-base">
                          S/ {Number(m.precioPublicoVarilla || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-emerald-600 font-mono">
                          S/ {Number(m.precioPublicoMetro || 0).toFixed(2)}/m
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-medium text-slate-700 font-mono">
                          S/ {Number(m.precioCorteChicoVarilla || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          S/ {Number(m.precioCorteChicoMetro || 0).toFixed(2)}/m
                        </div>
                      </td>
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
      </div>

      {/* MODAL FORMULARIO DINÁMICO (CREAR / EDITAR) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 transform animate-in fade-in zoom-in-95 duration-200">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  {activeTab === 'molduras' ? '🪵' : '🪟'}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {modalMode === 'create'
                      ? activeTab === 'molduras'
                        ? 'Nueva Moldura'
                        : 'Nuevo Tipo de Vidrio'
                      : activeTab === 'molduras'
                      ? `Editar Moldura: ${editingItem?.nombre || ''}`
                      : `Editar Vidrio: ${editingItem?.nombre || ''}`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Actualiza los costos base y márgenes. Los precios en cotizaciones se recalcularán automáticamente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {/* CAMPOS PARA MOLDURA */}
              {activeTab === 'molduras' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Nombre de la Moldura *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Moldura Dorada Clásica 2cm"
                        value={formMoldura.nombre}
                        onChange={(e) => setFormMoldura({ ...formMoldura, nombre: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Precio de Compra x Varilla (S/) *
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-medium">
                          S/
                        </span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required
                          placeholder="Ej. 12.50"
                          value={formMoldura.precioVarilla}
                          onChange={(e) => setFormMoldura({ ...formMoldura, precioVarilla: e.target.value })}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono font-medium"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Costo que pagas al proveedor por la varilla entera.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Longitud de Varilla (cm) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="1"
                        required
                        placeholder="240"
                        value={formMoldura.longitudVarilla}
                        onChange={(e) => setFormMoldura({ ...formMoldura, longitudVarilla: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Estándar habitual: 240 cm (2.40 m) o 300 cm.
                      </span>
                    </div>
                  </div>

                  {/* Sección Márgenes */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span>📊 Márgenes de Ganancia (%)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Margen Mayorista (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            placeholder="30"
                            value={formMoldura.margenMayorista}
                            onChange={(e) => setFormMoldura({ ...formMoldura, margenMayorista: e.target.value })}
                            className="w-full pr-8 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                          />
                          <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs font-bold">
                            %
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Margen Público (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            placeholder="50"
                            value={formMoldura.margenPublico}
                            onChange={(e) => setFormMoldura({ ...formMoldura, margenPublico: e.target.value })}
                            className="w-full pr-8 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50/20 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono font-semibold"
                          />
                          <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-emerald-600 text-xs font-bold">
                            %
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Margen Retazo/Chico (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            placeholder="80"
                            value={formMoldura.margenCorteChico}
                            onChange={(e) => setFormMoldura({ ...formMoldura, margenCorteChico: e.target.value })}
                            className="w-full pr-8 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                          />
                          <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs font-bold">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Simulador de Precios en Vivo */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>⚡ Vista Previa de Precios de Venta:</span>
                      <span className="text-[11px] font-normal text-slate-500 lowercase">
                        costo metro: S/ {simuladorMoldura.costoMetro}
                      </span>
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Mayorista</span>
                        <span className="text-sm font-bold text-slate-800 font-mono">
                          S/ {simuladorMoldura.precioMayoristaVarilla}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          (S/ {simuladorMoldura.precioMayoristaMetro}/m)
                        </span>
                      </div>
                      <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                        <span className="text-[11px] text-emerald-800 font-medium block">Público</span>
                        <span className="text-sm font-extrabold text-emerald-700 font-mono">
                          S/ {simuladorMoldura.precioPublicoVarilla}
                        </span>
                        <span className="text-[10px] text-emerald-600 block font-mono">
                          (S/ {simuladorMoldura.precioPublicoMetro}/m)
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Corte Chico</span>
                        <span className="text-sm font-bold text-slate-800 font-mono">
                          S/ {simuladorMoldura.precioCorteChicoVarilla}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          (S/ {simuladorMoldura.precioCorteChicoMetro}/m)
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* CAMPOS PARA VIDRIO */}
              {activeTab === 'vidrios' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Nombre del Vidrio / Cristal *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Cristal Incoloro 3mm"
                        value={formVidrio.nombre}
                        onChange={(e) => setFormVidrio({ ...formVidrio, nombre: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Precio Plancha Completa (S/) *
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-medium">
                          S/
                        </span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required
                          placeholder="Ej. 76.50"
                          value={formVidrio.precioPlancha}
                          onChange={(e) => setFormVidrio({ ...formVidrio, precioPlancha: e.target.value })}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <input
                        id="esTempladoCheck"
                        type="checkbox"
                        checked={formVidrio.esTemplado}
                        onChange={(e) => setFormVidrio({ ...formVidrio, esTemplado: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="esTempladoCheck" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                        ¿Es Vidrio Templado?
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Ancho Plancha (m) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        required
                        placeholder="2.14"
                        value={formVidrio.anchoPlancha}
                        onChange={(e) => setFormVidrio({ ...formVidrio, anchoPlancha: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Alto Plancha (m) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        required
                        placeholder="3.30"
                        value={formVidrio.altoPlancha}
                        onChange={(e) => setFormVidrio({ ...formVidrio, altoPlancha: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono"
                      />
                    </div>
                  </div>

                  {/* Sección Márgenes */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span>📊 Márgenes de Ganancia (%)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Margen Mayorista (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            placeholder="30"
                            value={formVidrio.margenMayorista}
                            onChange={(e) => setFormVidrio({ ...formVidrio, margenMayorista: e.target.value })}
                            className="w-full pr-8 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                          />
                          <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs font-bold">
                            %
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Margen Público (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            placeholder="50"
                            value={formVidrio.margenPublico}
                            onChange={(e) => setFormVidrio({ ...formVidrio, margenPublico: e.target.value })}
                            className="w-full pr-8 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50/20 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono font-semibold"
                          />
                          <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-emerald-600 text-xs font-bold">
                            %
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Margen Retazo/Chico (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            placeholder="80"
                            value={formVidrio.margenCorteChico}
                            onChange={(e) => setFormVidrio({ ...formVidrio, margenCorteChico: e.target.value })}
                            className="w-full pr-8 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                          />
                          <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs font-bold">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Simulador de Precios Vidrio */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>⚡ Vista Previa de Precios m² y Pie²:</span>
                      <span className="text-[11px] font-normal text-slate-500 lowercase">
                        área: {simuladorVidrio.area} m² | costo: S/ {simuladorVidrio.costoM2}/m²
                      </span>
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Mayorista</span>
                        <span className="text-sm font-bold text-slate-800 font-mono">
                          S/ {simuladorVidrio.precioMayoristaM2} /m²
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          (S/ {simuladorVidrio.precioMayoristaPie2} /p²)
                        </span>
                      </div>
                      <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                        <span className="text-[11px] text-emerald-800 font-medium block">Público</span>
                        <span className="text-sm font-extrabold text-emerald-700 font-mono">
                          S/ {simuladorVidrio.precioPublicoM2} /m²
                        </span>
                        <span className="text-[10px] text-emerald-600 block font-mono">
                          (S/ {simuladorVidrio.precioPublicoPie2} /p²)
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Corte Chico</span>
                        <span className="text-sm font-bold text-slate-800 font-mono">
                          S/ {simuladorVidrio.precioCorteChicoM2} /m²
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          (S/ {simuladorVidrio.precioCorteChicoPie2} /p²)
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={guardando}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs hover:shadow transition disabled:opacity-50"
                >
                  {guardando && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>
                    {guardando
                      ? 'Guardando...'
                      : modalMode === 'create'
                      ? 'Crear Material'
                      : 'Guardar Cambios'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
