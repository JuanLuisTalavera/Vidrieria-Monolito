import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function ClientesPage() {
  const navigate = useNavigate();

  // Estados de datos
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS'); // 'TODOS' | 'DNI' | 'RUC' | 'CE'

  // Notificaciones Toast
  const [notificacion, setNotificacion] = useState(null);

  // Estados del Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingCliente, setEditingCliente] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario del Modal
  const [form, setForm] = useState({
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    nombre: '',
    telefono: '',
    direccion: '',
  });

  // Notificación tipo toast
  const showToast = (mensaje, tipo = 'success') => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => {
      setNotificacion(null);
    }, 4000);
  };

  // Cargar clientes desde el Backend
  const fetchClientes = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/api/v1/clientes');
      const data = Array.isArray(res.data) ? res.data : [];
      setClientes(data);
    } catch (err) {
      console.error('Error al cargar la cartera de clientes:', err);
      setError('No se pudo conectar con el servidor para obtener los clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancel = false;
    axiosClient
      .get('/api/v1/clientes')
      .then((res) => {
        if (!cancel) {
          setClientes(Array.isArray(res.data) ? res.data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancel) {
          console.error('Error al obtener clientes iniciales:', err);
          setError('No se pudo conectar con el servidor para obtener los clientes.');
          setLoading(false);
        }
      });

    return () => {
      cancel = true;
    };
  }, []);

  // Abrir modal en modo crear
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingCliente(null);
    setForm({
      tipoDocumento: 'DNI',
      numeroDocumento: '',
      nombre: '',
      telefono: '',
      direccion: '',
    });
    setIsModalOpen(true);
  };

  // Abrir modal en modo editar
  const handleOpenEdit = (cliente) => {
    setModalMode('edit');
    setEditingCliente(cliente);

    const docNum = cliente.numeroDocumento || cliente.numero || '';
    const nom = cliente.nombre || cliente.nombreRazonSocial || cliente.razonSocial || '';
    const tel = cliente.telefono || cliente.celular || '';
    const dir = cliente.direccion || '';
    const tipo = cliente.tipoDocumento || (docNum.length === 11 ? 'RUC' : 'DNI');

    setForm({
      tipoDocumento: tipo,
      numeroDocumento: docNum,
      nombre: nom,
      telefono: tel,
      direccion: dir,
    });
    setIsModalOpen(true);
  };

  // Guardar (Crear o Actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.numeroDocumento.trim()) {
      showToast('Ingresa el número de documento.', 'error');
      return;
    }
    if (!form.nombre.trim()) {
      showToast('Ingresa el nombre o razón social.', 'error');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento.trim(),
        numero: form.numeroDocumento.trim(),
        nombre: form.nombre.trim(),
        nombreRazonSocial: form.nombre.trim(),
        razonSocial: form.nombre.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
      };

      if (modalMode === 'create') {
        const res = await axiosClient.post('/api/v1/clientes', payload);
        const nuevoCliente = res.data || payload;
        setClientes((prev) => [nuevoCliente, ...prev]);
        showToast(`Cliente "${payload.nombre}" registrado exitosamente.`);
      } else {
        const id = editingCliente.idCliente ?? editingCliente.id;
        const res = await axiosClient.put(`/api/v1/clientes/${id}`, payload);
        const clienteActualizado = res.data || { ...editingCliente, ...payload };
        setClientes((prev) =>
          prev.map((c) => ((c.idCliente ?? c.id) === id ? clienteActualizado : c))
        );
        showToast(`Cliente "${payload.nombre}" actualizado correctamente.`);
      }

      setIsModalOpen(false);
      // Sincronizar con backend en segundo plano
      fetchClientes(false);
    } catch (err) {
      console.error('Error al guardar cliente:', err);
      const msg = err.response?.data?.message || 'Error al guardar los datos del cliente.';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar cliente
  const handleDelete = async (cliente) => {
    const id = cliente.idCliente ?? cliente.id;
    const nombre = cliente.nombre || cliente.nombreRazonSocial || cliente.razonSocial || 'este cliente';

    const confirmado = window.confirm(
      `¿Estás seguro de eliminar a "${nombre}" de la cartera de clientes?\nEsta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    try {
      await axiosClient.delete(`/api/v1/clientes/${id}`);
      setClientes((prev) => prev.filter((c) => (c.idCliente ?? c.id) !== id));
      showToast(`Cliente "${nombre}" eliminado con éxito.`);
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      const msg = err.response?.data?.message || 'No se pudo eliminar el cliente.';
      showToast(msg, 'error');
    }
  };

  // Acción rápida: Ir al Cotizador con este cliente
  const handleCotizarACliente = (cliente) => {
    const doc = cliente.numeroDocumento || cliente.numero || '';
    navigate(`/cotizador?documento=${encodeURIComponent(doc)}`);
  };

  // Filtrado de clientes
  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      const doc = (c.numeroDocumento || c.numero || '').toLowerCase();
      const nom = (c.nombre || c.nombreRazonSocial || c.razonSocial || '').toLowerCase();
      const tel = (c.telefono || c.celular || '').toLowerCase();
      const dir = (c.direccion || '').toLowerCase();
      const tipo = (c.tipoDocumento || '').toUpperCase();

      const coincideBusqueda =
        busqueda.trim() === '' ||
        nom.includes(busqueda.toLowerCase()) ||
        doc.includes(busqueda.toLowerCase()) ||
        tel.includes(busqueda.toLowerCase()) ||
        dir.includes(busqueda.toLowerCase());

      const coincideTipo =
        filtroTipo === 'TODOS' ||
        tipo === filtroTipo ||
        (filtroTipo === 'RUC' && doc.length === 11) ||
        (filtroTipo === 'DNI' && doc.length === 8);

      return coincideBusqueda && coincideTipo;
    });
  }, [clientes, busqueda, filtroTipo]);

  // Estadísticas rápidas para métricas
  const stats = useMemo(() => {
    const total = clientes.length;
    const rucCount = clientes.filter(
      (c) => (c.tipoDocumento === 'RUC') || ((c.numeroDocumento || c.numero || '').length === 11)
    ).length;
    const dniCount = clientes.filter(
      (c) => (c.tipoDocumento === 'DNI') || ((c.numeroDocumento || c.numero || '').length === 8)
    ).length;
    const conTelefono = clientes.filter((c) => (c.telefono || c.celular || '').trim() !== '').length;

    return { total, rucCount, dniCount, conTelefono };
  }, [clientes]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notificacion && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform duration-300 ${
            notificacion.tipo === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{notificacion.tipo === 'error' ? '⚠️' : '✅'}</span>
          <span>{notificacion.mensaje}</span>
          <button
            onClick={() => setNotificacion(null)}
            className="ml-2 text-xs opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              CRM Comercial
            </span>
            <span className="text-xs text-slate-400">Directorio de Contactos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cartera de Clientes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestiona tu base de clientes para autocompletar cotizaciones y agilizar ventas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer shadow-blue-500/20 text-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
            👥
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Clientes</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
            🪪
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Personas (DNI)</p>
            <p className="text-2xl font-bold text-slate-800">{stats.dniCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
            🏢
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Empresas (RUC)</p>
            <p className="text-2xl font-bold text-slate-800">{stats.rucCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            📱
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Con Teléfono</p>
            <p className="text-2xl font-bold text-slate-800">{stats.conTelefono}</p>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por DNI, RUC, nombre, teléfono o dirección..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros por tipo de documento */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 shrink-0">
          {['TODOS', 'DNI', 'RUC', 'CE'].map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setFiltroTipo(tipo)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filtroTipo === tipo
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tipo === 'TODOS' ? 'Todos' : tipo}
            </button>
          ))}

          <button
            type="button"
            onClick={() => fetchClientes(true)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer ml-1"
            title="Recargar clientes"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabla Dinámica de Clientes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"></div>
            <p className="text-sm font-medium text-slate-500">Cargando cartera de clientes...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="inline-flex p-3 rounded-full bg-rose-100 text-rose-600 mb-3 text-xl">⚠️</div>
            <p className="text-sm font-semibold text-rose-800">{error}</p>
            <button
              onClick={() => fetchClientes(true)}
              className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              Reintentar
            </button>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mb-3">
              🔍
            </div>
            <h3 className="text-base font-bold text-slate-700">No se encontraron clientes</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {busqueda || filtroTipo !== 'TODOS'
                ? 'Intenta ajustar tus filtros de búsqueda para encontrar lo que necesitas.'
                : 'Aún no tienes clientes registrados en el CRM. Agrega el primero para agilizar tus cotizaciones.'}
            </p>
            {busqueda || filtroTipo !== 'TODOS' ? (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setFiltroTipo('TODOS');
                }}
                className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Restablecer filtros
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs"
              >
                + Registrar Primer Cliente
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Cliente / Razón Social</th>
                  <th className="px-5 py-3.5">Documento</th>
                  <th className="px-5 py-3.5">Teléfono / WhatsApp</th>
                  <th className="px-5 py-3.5">Dirección</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {clientesFiltrados.map((cliente) => {
                  const id = cliente.idCliente ?? cliente.id;
                  const doc = cliente.numeroDocumento || cliente.numero || '—';
                  const nom = cliente.nombre || cliente.nombreRazonSocial || cliente.razonSocial || 'Sin nombre';
                  const tel = cliente.telefono || cliente.celular || '';
                  const dir = cliente.direccion || '';
                  const tipo = cliente.tipoDocumento || (doc.length === 11 ? 'RUC' : 'DNI');

                  // Iniciar avatar con la primera letra
                  const inicial = nom.trim().charAt(0).toUpperCase() || 'C';

                  return (
                    <tr key={id || doc} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Cliente / Razón Social */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                            {inicial}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">{nom}</p>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ID: #{id ?? '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tipo y Documento */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                              tipo === 'RUC'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : tipo === 'CE'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {tipo}
                          </span>
                          <span className="font-mono text-slate-700 font-medium text-xs">
                            {doc}
                          </span>
                        </div>
                      </td>

                      {/* Teléfono / WhatsApp */}
                      <td className="px-5 py-3.5">
                        {tel ? (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-700 text-xs font-medium">{tel}</span>
                            {tel.replace(/\D/g, '').length >= 9 && (
                              <a
                                href={`https://wa.me/51${tel.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center p-1 rounded-md text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition"
                                title="Contactar por WhatsApp"
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                </svg>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No registrado</span>
                        )}
                      </td>

                      {/* Dirección */}
                      <td className="px-5 py-3.5">
                        {dir ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 max-w-xs truncate" title={dir}>
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{dir}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Cotizar */}
                          <button
                            type="button"
                            onClick={() => handleCotizarACliente(cliente)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                            title="Abrir cotizador con este cliente"
                          >
                            <span>⚡</span>
                            <span>Cotizar</span>
                          </button>

                          {/* Botón Editar */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cliente)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Editar cliente"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            type="button"
                            onClick={() => handleDelete(cliente)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Eliminar cliente"
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
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {modalMode === 'create' ? '👤' : '✏️'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {modalMode === 'create' ? 'Registrar Nuevo Cliente' : 'Editar Cliente'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalMode === 'create'
                      ? 'Agrega un cliente a la cartera comercial para cotizaciones rápidas.'
                      : 'Modifica la información de contacto del cliente.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tipo de Documento */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo Doc. <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.tipoDocumento}
                    onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:bg-white transition cursor-pointer"
                  >
                    <option value="DNI">DNI (8 dígitos)</option>
                    <option value="RUC">RUC (11 dígitos)</option>
                    <option value="CE">C.E. (Extranjería)</option>
                  </select>
                </div>

                {/* Número de Documento */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Número de Documento <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.numeroDocumento}
                    onChange={(e) => setForm({ ...form, numeroDocumento: e.target.value })}
                    placeholder={form.tipoDocumento === 'RUC' ? '20123456789' : '71234567'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Nombre o Razón Social */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Completo o Razón Social <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. Vidriería San Martín S.A.C. o Juan Pérez"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:bg-white transition"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teléfono / Celular WhatsApp
                </label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="Ej. 987654321"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:bg-white transition"
                />
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dirección o Referencia
                </label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Ej. Jr. Ancash 240, Taller Principal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:bg-white transition"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={guardando}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {guardando ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{modalMode === 'create' ? 'Guardar Cliente' : 'Actualizar Cliente'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
