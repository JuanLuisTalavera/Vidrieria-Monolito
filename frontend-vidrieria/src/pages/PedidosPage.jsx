import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

// Configuración de los estados del taller de marquería
const ESTADOS_TALLER = [
  {
    id: 'COTIZADO',
    label: 'Cotizado',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-500/20',
    dotClass: 'bg-amber-400',
    next: 'EN_TALLER',
    actionLabel: 'Pasar a Taller',
    actionButtonClass: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs focus:ring-amber-400',
  },
  {
    id: 'EN_TALLER',
    label: 'En Taller',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-500/20',
    dotClass: 'bg-blue-500 animate-pulse',
    next: 'LISTO',
    actionLabel: 'Marcar Listo',
    actionButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-xs focus:ring-blue-400',
  },
  {
    id: 'LISTO',
    label: 'Listo',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-500/20',
    dotClass: 'bg-emerald-500',
    next: 'ENTREGADO',
    actionLabel: 'Entregar',
    actionButtonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs focus:ring-emerald-400',
  },
  {
    id: 'ENTREGADO',
    label: 'Entregado',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-500/20',
    dotClass: 'bg-purple-500',
    next: null,
    actionLabel: null,
    actionButtonClass: '',
  },
];

const ESTADOS_MAP = ESTADOS_TALLER.reduce((acc, curr) => {
  acc[curr.id] = curr;
  return acc;
}, {});

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actualizandoId, setActualizandoId] = useState(null);
  const [feedbackNotif, setFeedbackNotif] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // Estado para el Modal de Historial de Pagos
  const [modalPagosAbierto, setModalPagosAbierto] = useState(false);
  const [pedidoParaPagos, setPedidoParaPagos] = useState(null);
  const [cargandoPagos, setCargandoPagos] = useState(false);
  const [listaPagos, setListaPagos] = useState([]);

  // Estados para Modal "Registrar Pago / Abonar"
  const [modalAbonoAbierto, setModalAbonoAbierto] = useState(false);
  const [pedidoParaAbono, setPedidoParaAbono] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [metodoPagoAbono, setMetodoPagoAbono] = useState('EFECTIVO');
  const [conceptoAbono, setConceptoAbono] = useState('');
  const [registrandoAbono, setRegistrandoAbono] = useState(false);
  const [errorAbono, setErrorAbono] = useState(null);

  // Formateador de Fecha y Hora para el modal de pagos
  const formatFechaHora = (fecha) => {
    if (!fecha) return '—';
    if (Array.isArray(fecha)) {
      const dd = String(fecha[2] ?? 1).padStart(2, '0');
      const mm = String(fecha[1] ?? 1).padStart(2, '0');
      const yyyy = fecha[0] ?? 2026;
      const hh = String(fecha[3] ?? 0).padStart(2, '0');
      const min = String(fecha[4] ?? 0).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    }
    try {
      const d = new Date(fecha);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      // ignore
    }
    return String(fecha);
  };

  // Consultar y mostrar los pagos de un pedido
  const handleVerPagos = async (pedido) => {
    setPedidoParaPagos(pedido);
    setModalPagosAbierto(true);
    setCargandoPagos(true);
    setListaPagos([]);

    try {
      // 1. Siempre consultar el endpoint del backend para obtener la lista real de todos los pagos
      const res = await axiosClient.get(`/api/v1/pedidos/${pedido.idPedido}/pagos`);
      const dataPagos = Array.isArray(res.data)
        ? res.data
        : (res.data?.content || res.data?.pagos || res.data?.data || []);

      if (Array.isArray(dataPagos) && dataPagos.length > 0) {
        setListaPagos(dataPagos);
        setCargandoPagos(false);
        return;
      }
    } catch (err) {
      console.warn(`No se pudieron cargar pagos de /api/v1/pedidos/${pedido.idPedido}/pagos:`, err);
    }

    // 2. Si el pedido ya trae el array de pagos en su entidad
    if (Array.isArray(pedido.pagos) && pedido.pagos.length > 0) {
      setListaPagos(pedido.pagos);
      setCargandoPagos(false);
      return;
    }

    // 3. Fallback inteligente con los datos del pedido
    const pagosFallback = [];
    const adelanto = Number(pedido.montoAdelanto || 0);
    const total = Number(pedido.total || 0);
    const saldo = Number(
      pedido.saldoPendiente != null
        ? pedido.saldoPendiente
        : pedido.saldo != null
        ? pedido.saldo
        : total - adelanto
    );

    if (adelanto > 0) {
      pagosFallback.push({
        id: `adelanto-${pedido.idPedido}`,
        tipoPago: 'ADELANTO',
        monto: adelanto,
        metodoPago: pedido.metodoPago || 'EFECTIVO',
        fechaPago: pedido.fechaCreacion || pedido.fechaRegistro || pedido.fecha,
        nota: 'Adelanto inicial registrado al crear el pedido',
      });
    }

    if ((saldo <= 0 || pedido.estado === 'ENTREGADO') && total > adelanto) {
      pagosFallback.push({
        id: `saldo-${pedido.idPedido}`,
        tipoPago: 'SALDO',
        monto: total - adelanto,
        metodoPago: pedido.metodoPago || 'EFECTIVO',
        fechaPago: pedido.fechaEntrega || pedido.fechaActualizacion || pedido.fechaRegistro,
        nota: 'Liquidación final del saldo al retirar o entregar el trabajo',
      });
    }

    setListaPagos(pagosFallback);
    setCargandoPagos(false);
  };

  // Abrir modal para registrar un nuevo pago o abono
  const handleAbrirModalAbonar = (pedido) => {
    const saldo = Number(
      pedido.saldoPendiente != null
        ? pedido.saldoPendiente
        : pedido.saldo != null
        ? pedido.saldo
        : Math.max(0, Number(pedido.total || 0) - Number(pedido.montoAdelanto || 0))
    );
    setPedidoParaAbono(pedido);
    setMontoAbono(saldo > 0 ? saldo.toFixed(2) : '');
    setMetodoPagoAbono('EFECTIVO');
    setConceptoAbono(`Abono a saldo de Pedido #${pedido.idPedido}`);
    setErrorAbono(null);
    setModalAbonoAbierto(true);
  };

  // Enviar nuevo pago vía POST a /api/v1/pedidos/{id}/pagos
  const handleRegistrarAbono = async (e) => {
    e?.preventDefault();
    if (!pedidoParaAbono) return;

    const montoNum = parseFloat(montoAbono);
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorAbono('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    setRegistrandoAbono(true);
    setErrorAbono(null);

    try {
      const payload = {
        monto: montoNum,
        metodoPago: metodoPagoAbono,
        tipoPago: 'SALDO',
        concepto: conceptoAbono || `Abono de saldo de Pedido #${pedidoParaAbono.idPedido}`,
        montoPagado: montoNum,
        medioPago: metodoPagoAbono,
      };

      await axiosClient.post(
        `/api/v1/pedidos/${pedidoParaAbono.idPedido}/pagos`,
        payload
      );

      // Cerrar modal
      setModalAbonoAbierto(false);
      const idPed = pedidoParaAbono.idPedido;
      setPedidoParaAbono(null);

      // Alerta de éxito
      setFeedbackNotif({
        idPedido: idPed,
        mensaje: `¡Pago de S/ ${montoNum.toFixed(2)} (${metodoPagoAbono}) registrado con éxito en Pedido #${idPed}!`,
      });
      setTimeout(() => {
        setFeedbackNotif(null);
      }, 4000);

      // Recargar lista de pedidos para que el saldo se actualice visualmente
      await fetchPedidos();

      // Si el modal de pagos está abierto para este pedido, actualizarlo
      if (modalPagosAbierto && pedidoParaPagos?.idPedido === idPed) {
        handleVerPagos({ ...pedidoParaPagos, idPedido: idPed });
      }
    } catch (err) {
      console.error('Error al registrar abono:', err);
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : '') ||
        'No se pudo registrar el pago. Por favor intenta de nuevo.';
      setErrorAbono(msg);
    } finally {
      setRegistrandoAbono(false);
    }
  };

  const fetchPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/api/v1/pedidos');
      setPedidos(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error al obtener los pedidos:', err);
      setError('No se pudo cargar la lista de pedidos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const cargarPedidosIniciales = async () => {
      try {
        const response = await axiosClient.get('/api/v1/pedidos');
        if (isMounted) {
          setPedidos(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        console.error('Error al obtener los pedidos:', err);
        if (isMounted) {
          setError('No se pudo cargar la lista de pedidos. Por favor, intenta de nuevo.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    cargarPedidosIniciales();

    return () => {
      isMounted = false;
    };
  }, []);

  // Función para actualizar estado vía PATCH y refrescar UI inmediatamente
  const handleCambiarEstado = async (idPedido, nuevoEstado) => {
    if (!nuevoEstado) return;
    setActualizandoId(idPedido);
    setError(null);

    try {
      const response = await axiosClient.patch(
        `/api/v1/pedidos/${idPedido}/estado?estado=${nuevoEstado}`
      );

      const dataActualizada =
        response.data && typeof response.data === 'object' && response.data.idPedido
          ? response.data
          : { estado: nuevoEstado };

      // Actualizar estado local usando .map sin recargar página
      setPedidos((prev) =>
        prev.map((pedido) =>
          pedido.idPedido === idPedido
            ? { ...pedido, ...dataActualizada, estado: nuevoEstado }
            : pedido
        )
      );

      // Si el modal está abierto para este pedido, actualizarlo también
      setSelectedPedido((prev) =>
        prev && prev.idPedido === idPedido
          ? { ...prev, ...dataActualizada, estado: nuevoEstado }
          : prev
      );

      // Feedback visual inmediato
      const nombreEstado = ESTADOS_MAP[nuevoEstado]?.label || nuevoEstado;
      setFeedbackNotif({
        idPedido,
        mensaje: `Pedido #${idPedido} cambió a "${nombreEstado}"`,
      });
      setTimeout(() => {
        setFeedbackNotif(null);
      }, 3500);
    } catch (err) {
      console.error(`Error al actualizar estado del pedido #${idPedido}:`, err);
      const errDetail =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : '') ||
        'Error de conexión con el servidor.';
      setError(`No se pudo actualizar el pedido #${idPedido}. ${errDetail}`);
    } finally {
      setActualizandoId(null);
    }
  };

  // Función para liquidar el saldo del pedido y marcarlo como ENTREGADO
  const handleLiquidar = async (idPedido) => {
    const confirmar = window.confirm(
      '¿Estás seguro de liquidar el saldo de este pedido? Se marcará como pagado y ENTREGADO.'
    );
    if (!confirmar) return;

    setActualizandoId(idPedido);
    setError(null);

    try {
      const response = await axiosClient.patch(`/api/v1/pedidos/${idPedido}/liquidar`);

      const dataActualizada =
        response.data && typeof response.data === 'object' && response.data.idPedido
          ? response.data
          : { saldoPendiente: 0, estado: 'ENTREGADO' };

      // Actualizar pedidos localmente con .map para refrescar la UI de inmediato
      setPedidos((prev) =>
        prev.map((pedido) =>
          pedido.idPedido === idPedido
            ? {
                ...pedido,
                ...dataActualizada,
                saldoPendiente: 0,
                estado: dataActualizada.estado || 'ENTREGADO',
              }
            : pedido
        )
      );

      // Si el modal está abierto para este pedido, actualizarlo también
      setSelectedPedido((prev) =>
        prev && prev.idPedido === idPedido
          ? {
              ...prev,
              ...dataActualizada,
              saldoPendiente: 0,
              estado: dataActualizada.estado || 'ENTREGADO',
            }
          : prev
      );

      setFeedbackNotif({
        idPedido,
        mensaje: `¡Pedido #${idPedido} liquidado con éxito! Saldo en S/ 0.00 y marcado como ENTREGADO.`,
      });
      setTimeout(() => {
        setFeedbackNotif(null);
      }, 3500);
    } catch (err) {
      console.error(`Error al liquidar el pedido #${idPedido}:`, err);
      const errDetail =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : '') ||
        'Error al procesar la liquidación en el servidor.';
      setError(`No se pudo liquidar el pedido #${idPedido}. ${errDetail}`);
    } finally {
      setActualizandoId(null);
    }
  };

  const getBadgeStyle = (estado) => {
    const normalizado = (estado || '').toUpperCase().trim();
    if (ESTADOS_MAP[normalizado]) {
      return ESTADOS_MAP[normalizado].badgeClass;
    }
    switch (normalizado) {
      case 'PENDIENTE':
        return 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-500/20';
      case 'EN_PROCESO':
      case 'EN PROCESO':
        return 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-500/20';
      case 'COMPLETADO':
      case 'FINALIZADO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-500/20';
      case 'ENTREGADO':
        return 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-500/20';
      case 'CANCELADO':
        return 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-500/20';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getDotStyle = (estado) => {
    const normalizado = (estado || '').toUpperCase().trim();
    return ESTADOS_MAP[normalizado]?.dotClass || 'bg-slate-400';
  };

  const getEstadoLabel = (estado) => {
    const normalizado = (estado || '').toUpperCase().trim();
    return ESTADOS_MAP[normalizado]?.label || estado?.replace('_', ' ') || 'SIN ESTADO';
  };

  // Renderizado de icono para botón de siguiente estado
  const renderNextIcon = (estadoSiguiente) => {
    switch (estadoSiguiente) {
      case 'EN_TALLER':
        return (
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
            />
          </svg>
        );
      case 'LISTO':
        return (
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'ENTREGADO':
        return (
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        );
    }
  };

  // Lógica de filtrado por nombre de cliente y por estado
  const pedidosFiltrados = pedidos.filter((pedido) => {
    // Coincidencia con clienteNombre (insensible a mayúsculas/minúsculas)
    const matchBusqueda =
      busqueda.trim() === '' ||
      (pedido.clienteNombre || '')
        .toLowerCase()
        .includes(busqueda.toLowerCase().trim()) ||
      String(pedido.idPedido || '').includes(busqueda.toLowerCase().trim());

    // Coincidencia con filtroEstado ('TODOS' o el estado seleccionado)
    const estadoNormalizado = (pedido.estado || '').toUpperCase().trim();
    const matchEstado =
      filtroEstado === 'TODOS' ||
      estadoNormalizado === filtroEstado.toUpperCase().trim();

    return matchBusqueda && matchEstado;
  });

  return (
    <div className="w-full min-h-screen bg-slate-50 p-6 sm:p-8 print:p-0 print:m-0 print:min-h-0 print:bg-white print:w-full relative">
      {/* Notificación flotante de retroalimentación inmediata */}
      {feedbackNotif && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 text-white text-xs sm:text-sm font-medium rounded-xl shadow-2xl border border-slate-700 backdrop-blur-sm transition-all">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{feedbackNotif.mensaje}</span>
        </div>
      )}

      {/* Contenedor principal de la página (oculto al imprimir) */}
      <div className="print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Listado de Pedidos
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Flujo de trabajo de marquería: Cotizado → En Taller → Listo → Entregado
            </p>
          </div>

          <button
            onClick={fetchPedidos}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium shadow-xs transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
            title="Actualizar listado"
          >
            <svg
              className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Actualizar
          </button>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mb-6 flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={fetchPedidos}
              className="text-sm font-semibold underline hover:text-red-900 cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Sección de Controles (Búsqueda y Filtro de Estados) */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Input de Búsqueda por Nombre de Cliente */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre de cliente..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs transition-all"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Limpiar búsqueda"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Select de Filtro por Estado */}
          <div className="relative w-full md:w-56">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-sm text-slate-700 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs transition-all cursor-pointer"
            >
              <option value="TODOS">Todos</option>
              <option value="COTIZADO">Cotizado</option>
              <option value="EN_TALLER">En Taller</option>
              <option value="LISTO">Listo</option>
              <option value="ENTREGADO">Entregado</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Estado: Cargando */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center shadow-xs">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-base font-semibold text-slate-700">Cargando pedidos...</p>
            <p className="text-xs text-slate-400 mt-1">Consultando la base de datos</p>
          </div>
        ) : pedidos.length === 0 ? (
          /* Estado Vacío General (Sin pedidos en BD) */
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              No hay pedidos registrados aún
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              Los pedidos generados desde el cotizador aparecerán listados aquí.
            </p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          /* Estado Vacío por Búsqueda/Filtro */
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              No se encontraron pedidos
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              No hay pedidos que coincidan con la búsqueda o filtro seleccionado.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setFiltroEstado('TODOS');
              }}
              className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          /* Tabla de Pedidos */
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th scope="col" className="px-5 py-3.5">ID</th>
                    <th scope="col" className="px-5 py-3.5">Cliente</th>
                    <th scope="col" className="px-5 py-3.5">Teléfono</th>
                    <th scope="col" className="px-5 py-3.5">Trabajo</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Total (S/)</th>
                    <th scope="col" className="px-5 py-3.5 text-center">Estado</th>
                    <th scope="col" className="px-5 py-3.5 text-center min-w-[320px]">Flujo & Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {pedidosFiltrados.map((pedido) => {
                    const estadoActualKey = (pedido.estado || 'COTIZADO').toUpperCase().trim();
                    const configActual = ESTADOS_MAP[estadoActualKey];
                    const nextEstadoId = configActual?.next;
                    const configSiguiente = nextEstadoId ? ESTADOS_MAP[nextEstadoId] : null;
                    const isUpdatingThis = actualizandoId === pedido.idPedido;

                    return (
                      <tr
                        key={pedido.idPedido}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-5 py-4 font-mono font-medium text-slate-600">
                          #{pedido.idPedido}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {pedido.clienteNombre || 'Sin nombre'}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {pedido.clienteTelefono || '—'}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 font-medium text-slate-700">
                            {pedido.tipoTrabajo || 'GENERAL'}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900 text-right">
                          <div>S/ {Number(pedido.total ?? 0).toFixed(2)}</div>
                          {Number(pedido.montoAdelanto || 0) > 0 && (
                            <div className="text-[11px] font-normal text-blue-600">
                              Adelanto: S/ {Number(pedido.montoAdelanto).toFixed(2)}
                            </div>
                          )}
                          {pedido.saldoPendiente != null && Number(pedido.saldoPendiente) > 0 && (
                            <div className="text-[11px] font-normal text-rose-600">
                              Saldo: S/ {Number(pedido.saldoPendiente).toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(
                              pedido.estado
                            )}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${getDotStyle(
                                pedido.estado
                              )}`}
                            />
                            {getEstadoLabel(pedido.estado)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Botón dinámico de acción de taller (1 Clic) */}
                            {configSiguiente ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCambiarEstado(pedido.idPedido, nextEstadoId)
                                }
                                disabled={isUpdatingThis}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${configActual.actionButtonClass}`}
                                title={`Avanzar pedido a "${configSiguiente.label}"`}
                              >
                                {isUpdatingThis ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  renderNextIcon(nextEstadoId)
                                )}
                                <span>{configActual.actionLabel}</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg">
                                <svg
                                  className="w-3.5 h-3.5 text-purple-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.5"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Finalizado
                              </span>
                            )}

                            {/* Botón Registrar Pago / Abonar - Visible si saldo > 0 */}
                            {Number(pedido.saldoPendiente != null ? pedido.saldoPendiente : Math.max(0, Number(pedido.total || 0) - Number(pedido.montoAdelanto || 0))) > 0 && (
                              <button
                                type="button"
                                onClick={() => handleAbrirModalAbonar(pedido)}
                                disabled={isUpdatingThis}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 print:hidden shrink-0"
                                title={`Registrar pago o abono para Pedido #${pedido.idPedido} (Saldo pendiente: S/ ${Number(pedido.saldoPendiente || 0).toFixed(2)})`}
                              >
                                <span className="text-sm leading-none">💰</span>
                                <span>Registrar Pago / Abonar</span>
                              </button>
                            )}

                            {/* Botón Liquidar Saldo (1 Clic) - Solo visible si saldoPendiente > 0 */}
                            {Number(pedido.saldoPendiente || 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => handleLiquidar(pedido.idPedido)}
                                disabled={isUpdatingThis}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50 print:hidden shrink-0"
                                title={`Liquidar saldo de S/ ${Number(pedido.saldoPendiente).toFixed(2)} y marcar como Entregado`}
                              >
                                {isUpdatingThis ? (
                                  <div className="w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                                <span>Liquidar</span>
                              </button>
                            )}

                            {/* Dropdown estilizado para seleccionar cualquier estado */}
                            <div className="relative inline-block">
                              <select
                                value={estadoActualKey}
                                onChange={(e) =>
                                  handleCambiarEstado(pedido.idPedido, e.target.value)
                                }
                                disabled={isUpdatingThis}
                                className="appearance-none bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 rounded-lg pl-2.5 pr-7 py-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 shadow-2xs"
                                title="Cambiar a cualquier estado manualmente"
                              >
                                {ESTADOS_TALLER.map((est) => (
                                  <option key={est.id} value={est.id}>
                                    {est.label}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </div>

                            {/* Botón Ver Detalle */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPedido(pedido);
                                setIsModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                              title="Ver detalle de la orden"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              <span>Detalle</span>
                            </button>

                            {/* Botón Ver Pagos */}
                            <button
                              type="button"
                              onClick={() => handleVerPagos(pedido)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                              title="Ver historial de pagos de este pedido"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              <span>Ver Pagos</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer de la tabla con contador */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Mostrando <strong>{pedidosFiltrados.length}</strong> de <strong>{pedidos.length}</strong> pedidos
              </span>
              {(busqueda || filtroEstado !== 'TODOS') && (
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda('');
                    setFiltroEstado('TODOS');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalle del Pedido / Proforma Imprimible */}
      {isModalOpen && selectedPedido && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:static print:block print:inset-auto print:bg-white print:p-0 print:m-0 print:w-full print:overflow-visible">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] print:w-full print:max-w-none print:h-auto print:max-h-none print:shadow-none print:overflow-visible print:m-0 print:p-0 print:border-none print:static">
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50 print:bg-transparent print:px-0 print:border-b-0 print:pb-2">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Pedido #{selectedPedido.idPedido}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Cliente:{' '}
                    <span className="font-semibold text-slate-700">
                      {selectedPedido.clienteNombre || 'Sin nombre'}
                    </span>
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(
                    selectedPedido.estado
                  )} print:hidden`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${getDotStyle(
                      selectedPedido.estado
                    )}`}
                  />
                  {getEstadoLabel(selectedPedido.estado)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 transition-colors cursor-pointer print:hidden"
                title="Cerrar modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Barra de Flujo de Estados del Taller dentro del Modal (Oculta al imprimir) */}
            <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Flujo del Taller:
                </span>
                <div className="flex items-center gap-1 text-xs">
                  {ESTADOS_TALLER.map((est, idx) => {
                    const esActual =
                      (selectedPedido.estado || 'COTIZADO').toUpperCase().trim() ===
                      est.id;
                    return (
                      <div key={est.id} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleCambiarEstado(selectedPedido.idPedido, est.id)
                          }
                          disabled={actualizandoId === selectedPedido.idPedido}
                          className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                            esActual
                              ? `${est.badgeClass} shadow-2xs font-bold`
                              : 'text-slate-500 hover:bg-slate-200/80 hover:text-slate-700'
                          }`}
                        >
                          {est.label}
                        </button>
                        {idx < ESTADOS_TALLER.length - 1 && (
                          <span className="text-slate-300">→</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botón dinámico dentro del modal si tiene siguiente paso */}
              {(() => {
                const estKey = (selectedPedido.estado || 'COTIZADO')
                  .toUpperCase()
                  .trim();
                const config = ESTADOS_MAP[estKey];
                const nextId = config?.next;
                const nextConfig = nextId ? ESTADOS_MAP[nextId] : null;

                if (!nextConfig) return null;

                return (
                  <button
                    type="button"
                    onClick={() =>
                      handleCambiarEstado(selectedPedido.idPedido, nextId)
                    }
                    disabled={actualizandoId === selectedPedido.idPedido}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${config.actionButtonClass}`}
                  >
                    {actualizandoId === selectedPedido.idPedido ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      renderNextIcon(nextId)
                    )}
                    <span>{config.actionLabel}</span>
                  </button>
                );
              })()}
            </div>

            {/* Body con scroll */}
            <div className="overflow-y-auto p-6 print:overflow-visible print:p-0">
              {/* Encabezado Comercial (Solo Impresión) */}
              <div className="hidden print:block mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
                  PROFORMA DE SERVICIO
                </h1>
                <p className="text-sm font-medium text-slate-600">
                  Marquería y Vidriería
                </p>
              </div>

              {/* Datos Generales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6 print:bg-slate-50 print:border-slate-300">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">
                    Teléfono
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {selectedPedido.clienteTelefono || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 block">
                    Tipo de Trabajo
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {selectedPedido.tipoTrabajo || 'GENERAL'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 block mb-1">
                    Estado
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(
                      selectedPedido.estado
                    )}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${getDotStyle(
                        selectedPedido.estado
                      )}`}
                    />
                    {getEstadoLabel(selectedPedido.estado)}
                  </span>
                </div>

                {selectedPedido.fecha && (
                  <div className="sm:col-span-3">
                    <span className="text-xs font-medium text-slate-500 block">
                      Fecha de Registro
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {new Date(selectedPedido.fecha).toLocaleString()}
                    </span>
                  </div>
                )}

                {selectedPedido.referenciaObra && (
                  <div className="sm:col-span-3">
                    <span className="text-xs font-medium text-slate-500 block">
                      Referencia de Obra
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {selectedPedido.referenciaObra}
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-tabla de Detalles */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 mb-3">
                  Detalle de Productos / Trabajos
                </h3>

                {Array.isArray(selectedPedido.detalles) &&
                selectedPedido.detalles.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg print:border-slate-300">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 print:bg-slate-100 print:border-slate-300">
                        <tr>
                          <th scope="col" className="px-4 py-3">Descripción</th>
                          <th scope="col" className="px-4 py-3 text-center">Medidas</th>
                          <th scope="col" className="px-4 py-3 text-center">Cantidad</th>
                          <th scope="col" className="px-4 py-3 text-right">Precio Unit. (S/)</th>
                          <th scope="col" className="px-4 py-3 text-right">Subtotal (S/)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                        {selectedPedido.detalles.map((detalle, idx) => (
                          <tr
                            key={detalle.idDetallePedido || idx}
                            className="hover:bg-slate-50/50"
                          >
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {detalle.descripcion || 'Sin descripción'}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600 whitespace-nowrap">
                              {detalle.anchoVano != null && detalle.altoVano != null
                                ? `${detalle.anchoVano} cm × ${detalle.altoVano} cm`
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-center font-medium text-slate-700">
                              {detalle.cantidad ?? 1}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                              S/ {Number(detalle.precioUnitario ?? 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              S/ {Number(
                                (detalle.precioUnitario ?? 0) * (detalle.cantidad ?? 1)
                              ).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-500 text-sm">
                    No hay detalles registrados para este pedido.
                  </div>
                )}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-slate-50/50 print:bg-transparent print:px-0 print:border-t-2 print:border-slate-800 print:pt-4 print:mt-6 mt-auto">
              <div className="flex items-center gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Imprimir Proforma
                </button>

                {Number(selectedPedido.saldoPendiente || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => handleLiquidar(selectedPedido.idPedido)}
                    disabled={actualizandoId === selectedPedido.idPedido}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    title="Liquidar saldo y marcar como Entregado"
                  >
                    {actualizandoId === selectedPedido.idPedido ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    )}
                    <span>Liquidar Saldo</span>
                  </button>
                )}
              </div>

              {/* Resumen de Caja y Liquidación (Modal & Impresión) */}
              <div className="w-full sm:w-72 print:w-72 print:ml-auto space-y-1.5 text-right">
                {/* Total */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 print:text-slate-700">
                    Total
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 print:text-slate-950 font-mono">
                    S/ {Number(selectedPedido.total ?? 0).toFixed(2)}
                  </span>
                </div>

                {/* Adelanto */}
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-xs uppercase tracking-wider font-semibold text-blue-700 print:text-slate-700">
                    Adelanto
                  </span>
                  <span className="font-bold text-blue-800 print:text-slate-900 font-mono">
                    S/ {selectedPedido.montoAdelanto ? Number(selectedPedido.montoAdelanto).toFixed(2) : '0.00'}
                  </span>
                </div>

                {/* Separador de liquidación */}
                <div className="border-t border-slate-200 print:border-slate-800 my-1"></div>

                {/* Saldo Pendiente */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs uppercase tracking-wider font-bold text-rose-700 print:text-slate-900">
                    Saldo Pendiente
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-rose-600 print:text-slate-950 font-mono tracking-tight">
                    S/ {selectedPedido.saldoPendiente ? Number(selectedPedido.saldoPendiente).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE HISTORIAL DE PAGOS */}
      {modalPagosAbierto && pedidoParaPagos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header del Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
                  💳
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Historial de Pagos & Auditoría
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pedido #{pedidoParaPagos.idPedido} &bull; Cliente:{' '}
                    <strong className="text-slate-700">
                      {pedidoParaPagos.clienteNombre || 'Sin nombre'}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalPagosAbierto(false);
                  setPedidoParaPagos(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Resumen del Pedido */}
            {(() => {
              const totalPagadoModal = listaPagos.reduce(
                (acc, p) => acc + Number(p.monto ?? p.montoPagado ?? p.montoAbonado ?? p.adelanto ?? 0),
                0
              );
              const saldoCalc = Number(
                pedidoParaPagos.saldoPendiente != null
                  ? pedidoParaPagos.saldoPendiente
                  : Math.max(0, Number(pedidoParaPagos.total || 0) - totalPagadoModal)
              );

              return (
                <>
                  <div className="p-4 bg-emerald-50/40 border-b border-emerald-100 grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Total Orden
                      </span>
                      <span className="text-base font-mono font-extrabold text-slate-900">
                        S/ {Number(pedidoParaPagos.total || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-blue-200/80 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider">
                        Total Pagado
                      </span>
                      <span className="text-base font-mono font-extrabold text-blue-700">
                        S/ {totalPagadoModal.toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-rose-200/80 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-rose-600 block tracking-wider">
                        Saldo Pendiente
                      </span>
                      <span className="text-base font-mono font-extrabold text-rose-600">
                        S/ {saldoCalc.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Pagos */}
                  <div className="p-5 overflow-y-auto flex-1 space-y-4">
                    {cargandoPagos ? (
                      <div className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span className="text-xs">Consultando todos los pagos asociados...</span>
                      </div>
                    ) : listaPagos.length === 0 ? (
                      <div className="py-10 text-center text-slate-400">
                        <span className="text-3xl block mb-2">🧾</span>
                        <p className="font-semibold text-slate-600 text-sm">
                          No hay pagos registrados para este pedido
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Este trabajo fue registrado sin adelanto previo.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                              <th className="px-4 py-3">Fecha y Hora</th>
                              <th className="px-4 py-3">Tipo</th>
                              <th className="px-4 py-3">Método de Pago</th>
                              <th className="px-4 py-3 text-right">Monto</th>
                              <th className="px-4 py-3">Detalle / Concepto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {listaPagos.map((p, i) => {
                              const esAdelanto = String(p.tipoPago || p.tipo || '')
                                .toUpperCase()
                                .includes('ADELANTO');
                              const metodo = String(
                                p.metodoPago || p.metodo || 'EFECTIVO'
                              ).toUpperCase();
                              const montoItem = Number(
                                p.monto ?? p.montoPagado ?? p.montoAbonado ?? p.adelanto ?? 0
                              );

                              return (
                                <tr
                                  key={p.id || p.idPago || i}
                                  className="hover:bg-slate-50/80 transition-colors"
                                >
                                  <td className="px-4 py-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                                    🕒 {formatFechaHora(p.fechaPago || p.fecha || p.fechaRegistro || p.createdAt)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                                        esAdelanto
                                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      }`}
                                    >
                                      <span
                                        className={`w-1 h-1 rounded-full ${
                                          esAdelanto ? 'bg-sky-500' : 'bg-emerald-500'
                                        }`}
                                      />
                                      {esAdelanto ? 'Adelanto' : 'Saldo / Abono'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] border ${
                                        metodo.includes('YAPE') || metodo.includes('PLIN')
                                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                                          : metodo.includes('TRANS')
                                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      }`}
                                    >
                                      {metodo.includes('YAPE') || metodo.includes('PLIN')
                                        ? 'Yape / Plin'
                                        : metodo.includes('TRANS')
                                        ? 'Transferencia'
                                        : 'Efectivo'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                                    S/ {montoItem.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 text-[11px]">
                                    {p.nota ||
                                      p.concepto ||
                                      (esAdelanto
                                        ? 'Adelanto inicial registrado'
                                        : 'Abono / Pago de saldo')}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-slate-50/90 border-t-2 border-slate-200">
                            <tr>
                              <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                                Suma Total Pagada:
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-700 text-sm whitespace-nowrap">
                                S/ {totalPagadoModal.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-[11px]">
                                {saldoCalc > 0 ? (
                                  <span className="font-semibold text-rose-600">
                                    Resta por pagar: S/ {saldoCalc.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="font-bold text-emerald-700">
                                    ✅ Orden 100% Cancelada
                                  </span>
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>💡</span>
                <span>
                  Usa estos registros para confirmar con el cliente la fecha exacta de sus pagos.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {Number(pedidoParaPagos.saldoPendiente != null ? pedidoParaPagos.saldoPendiente : Math.max(0, Number(pedidoParaPagos.total || 0) - Number(pedidoParaPagos.montoAdelanto || 0))) > 0 && (
                  <button
                    type="button"
                    onClick={() => handleAbrirModalAbonar(pedidoParaPagos)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <span>💰</span>
                    <span>Registrar Nuevo Abono</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setModalPagosAbierto(false);
                    setPedidoParaPagos(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: REGISTRAR PAGO / ABONAR                               */}
      {/* ============================================================ */}
      {modalAbonoAbierto && pedidoParaAbono && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shadow-inner">
                  💰
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Registrar Pago / Abonar</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Pedido #{pedidoParaAbono.idPedido} &bull; {pedidoParaAbono.clienteNombre || pedidoParaAbono.cliente?.nombreRazonSocial || 'Cliente en Mostrador'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalAbonoAbierto(false);
                  setPedidoParaAbono(null);
                }}
                disabled={registrandoAbono}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Resumen del Saldo Actual */}
            <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                  Total de la Orden
                </span>
                <span className="text-sm font-mono font-bold text-slate-700">
                  S/ {Number(pedidoParaAbono.total || 0).toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-rose-600 block tracking-wider">
                  Saldo Restante por Cobrar
                </span>
                <span className="text-lg font-mono font-extrabold text-rose-600">
                  S/ {Number(pedidoParaAbono.saldoPendiente != null ? pedidoParaAbono.saldoPendiente : Math.max(0, Number(pedidoParaAbono.total || 0) - Number(pedidoParaAbono.montoAdelanto || 0))).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Formulario de Abono */}
            <form onSubmit={handleRegistrarAbono} className="p-5 space-y-4">
              {errorAbono && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorAbono}</span>
                </div>
              )}

              {/* Campo: Monto a Cobrar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="montoAbono" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Monto a Cobrar (S/) *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const saldo = Number(pedidoParaAbono.saldoPendiente != null ? pedidoParaAbono.saldoPendiente : Math.max(0, Number(pedidoParaAbono.total || 0) - Number(pedidoParaAbono.montoAdelanto || 0)));
                        setMontoAbono(saldo.toFixed(2));
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition cursor-pointer"
                    >
                      Pagar Todo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const saldo = Number(pedidoParaAbono.saldoPendiente != null ? pedidoParaAbono.saldoPendiente : Math.max(0, Number(pedidoParaAbono.total || 0) - Number(pedidoParaAbono.montoAdelanto || 0)));
                        setMontoAbono((saldo / 2).toFixed(2));
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      50%
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-base">
                    S/
                  </span>
                  <input
                    id="montoAbono"
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={montoAbono}
                    onChange={(e) => setMontoAbono(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-mono font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Campo: Método de Pago */}
              <div>
                <label htmlFor="metodoPagoAbono" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Método de Pago *
                </label>
                <select
                  id="metodoPagoAbono"
                  value={metodoPagoAbono}
                  onChange={(e) => setMetodoPagoAbono(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-2xs"
                >
                  <option value="EFECTIVO">💵 EFECTIVO (Cajón de Dinero)</option>
                  <option value="YAPE">📱 YAPE / PLIN (Billetera Móvil)</option>
                  <option value="TRANSFERENCIA">🏦 TRANSFERENCIA (Cuenta Bancaria)</option>
                </select>
              </div>

              {/* Campo: Detalle / Nota Opcional */}
              <div>
                <label htmlFor="conceptoAbono" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Concepto / Detalle (Opcional)
                </label>
                <input
                  id="conceptoAbono"
                  type="text"
                  value={conceptoAbono}
                  onChange={(e) => setConceptoAbono(e.target.value)}
                  placeholder="Ej. Abono a cuenta de saldo"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setModalAbonoAbierto(false);
                    setPedidoParaAbono(null);
                  }}
                  disabled={registrandoAbono}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={registrandoAbono}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {registrandoAbono ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando pago...</span>
                    </>
                  ) : (
                    <>
                      <span>✓ Confirmar Pago</span>
                    </>
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
