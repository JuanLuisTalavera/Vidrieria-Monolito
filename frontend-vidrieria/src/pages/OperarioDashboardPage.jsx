import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function OperarioDashboardPage() {
  const [datosCaja, setDatosCaja] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);

  // Arqueo físico de billetes y monedas (herramienta interactiva para cuadre de caja)
  const [mostrarArqueo, setMostrarArqueo] = useState(false);
  const [conteo, setConteo] = useState({
    b200: '',
    b100: '',
    b50: '',
    b20: '',
    b10: '',
    m5: '',
    m2: '',
    m1: '',
    m050: '',
    monedas20: '',
    monedas10: '',
  });

  // Declaración de pagos digitales (Yape y Transferencias)
  const [yapeDeclarado, setYapeDeclarado] = useState('');
  const [transferenciaDeclarada, setTransferenciaDeclarada] = useState('');

  const fetchMiCaja = useCallback(async (fecha = fechaFiltro) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get(`/api/v1/dashboard/mi-caja?fecha=${fecha}`);
      setDatosCaja(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error al cargar datos de mi caja:', err);
      setError('No se pudo cargar la información de tu caja para la fecha seleccionada. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [fechaFiltro]);

  useEffect(() => {
    fetchMiCaja(fechaFiltro);
  }, [fechaFiltro, fetchMiCaja]);

  // Formateador de moneda en Soles
  const formatSoles = (valor) => {
    const num = Number(valor || 0);
    return `S/ ${num.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Normalización de datos con compatibilidad para distintas estructuras del backend
  const cajaRealHoy = Number(
    datosCaja?.totalCobradoHoy ??
    datosCaja?.cajaReal ??
    datosCaja?.cajaHoy ??
    datosCaja?.totalCobrado ??
    datosCaja?.totalIngresos ??
    datosCaja?.montoTotal ??
    0
  );

  const adelantosHoy = Number(
    datosCaja?.totalAdelantos ??
    datosCaja?.adelantosCobrados ??
    datosCaja?.adelantosHoy ??
    datosCaja?.totalAdelanto ??
    0
  );

  const saldosHoy = Number(
    datosCaja?.totalSaldos ??
    datosCaja?.saldosCobrados ??
    datosCaja?.saldosHoy ??
    datosCaja?.totalLiquidaciones ??
    (cajaRealHoy > adelantosHoy ? cajaRealHoy - adelantosHoy : 0)
  );

  const pedidosRegistradosHoy = Number(
    datosCaja?.pedidosRegistrados ??
    datosCaja?.totalPedidos ??
    datosCaja?.pedidosHoy ??
    datosCaja?.cantidadPedidos ??
    0
  );

  const pedidosEntregadosHoy = Number(
    datosCaja?.pedidosEntregados ??
    datosCaja?.entregasHoy ??
    0
  );

  // Lista de pagos / transacciones enviadas por el backend para la fecha
  const transacciones = useMemo(() => {
    const list =
      datosCaja?.pagos ??
      datosCaja?.ventasDeHoy ??
      datosCaja?.movimientos ??
      datosCaja?.transacciones ??
      datosCaja?.pedidos ??
      datosCaja?.detalles ??
      [];
    return Array.isArray(list) ? list : [];
  }, [datosCaja]);

  const ventasDeHoy = transacciones;

  // Formateador de Hora HH:mm a partir de fecha del pago
  const formatHora = (fecha) => {
    if (!fecha) return '—';
    if (Array.isArray(fecha)) {
      const hh = String(fecha[3] ?? 0).padStart(2, '0');
      const mm = String(fecha[4] ?? 0).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    if (typeof fecha === 'string') {
      if (/^\d{1,2}:\d{2}$/.test(fecha.trim())) {
        return fecha.trim();
      }
      const delimiter = fecha.includes('T') ? 'T' : (fecha.includes(' ') ? ' ' : null);
      if (delimiter) {
        const timePart = fecha.split(delimiter)[1];
        if (timePart) {
          const parts = timePart.split(':');
          if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
          }
        }
      }
    }
    try {
      const d = new Date(fecha);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    } catch {
      // ignore
    }
    return String(fecha);
  };

  // Badge según Tipo de Pago (Adelanto vs Saldo)
  const renderTipoPagoBadge = (tipo, concepto) => {
    const t = String(tipo || concepto || 'ADELANTO').toUpperCase();
    if (t.includes('SALDO') || t.includes('LIQUIDA') || t.includes('ENTREGA')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Saldo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
        Adelanto
      </span>
    );
  };

  // Badge con color sutil según Método de Pago
  const renderMetodoPagoBadge = (metodo) => {
    const m = String(metodo || 'EFECTIVO').toUpperCase();
    if (m === 'YAPE' || m === 'PLIN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Yape
        </span>
      );
    }
    if (m === 'TRANSFERENCIA') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Transferencia
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Efectivo
      </span>
    );
  };

  // Cálculo del dinero físico contado en el arqueo (incluye monedas de 0.20 y 0.10)
  const totalFisicoContado = useMemo(() => {
    const b200 = (Number(conteo.b200) || 0) * 200;
    const b100 = (Number(conteo.b100) || 0) * 100;
    const b50 = (Number(conteo.b50) || 0) * 50;
    const b20 = (Number(conteo.b20) || 0) * 20;
    const b10 = (Number(conteo.b10) || 0) * 10;
    const m5 = (Number(conteo.m5) || 0) * 5;
    const m2 = (Number(conteo.m2) || 0) * 2;
    const m1 = (Number(conteo.m1) || 0) * 1;
    const m050 = (Number(conteo.m050) || 0) * 0.5;
    const monedas20 = Number(conteo.monedas20) || 0;
    const monedas10 = Number(conteo.monedas10) || 0;

    return (
      b200 +
      b100 +
      b50 +
      b20 +
      b10 +
      m5 +
      m2 +
      m1 +
      m050 +
      (monedas20 * 0.20) +
      (monedas10 * 0.10)
    );
  }, [conteo]);

  const totalFisico = Math.round(totalFisicoContado * 100) / 100;

  // Total de pagos digitales declarados (Yape + Transferencias)
  const totalDigital = Math.round(
    ((Number(yapeDeclarado) || 0) + (Number(transferenciaDeclarada) || 0)) * 100
  ) / 100;

  // Gran Total General Cuadrado (Efectivo Físico + Pagos Digitales)
  const granTotalDeclarado = Math.round((totalFisico + totalDigital) * 100) / 100;

  // Diferencia respecto al total esperado por el sistema
  const diferenciaCaja = Math.round((granTotalDeclarado - cajaRealHoy) * 100) / 100;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              {fechaFiltro === new Date().toISOString().split('T')[0]
                ? 'Mi Caja (Hoy) • Turno Operativo'
                : `Caja Histórica • ${fechaFiltro}`}
            </span>
            <span className="text-xs text-slate-400">
              {lastUpdated
                ? `Actualizado: ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Cargando...'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {fechaFiltro === new Date().toISOString().split('T')[0]
              ? 'Cuadre de Caja del Turno'
              : `Historial de Caja: ${fechaFiltro}`}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {fechaFiltro === new Date().toISOString().split('T')[0]
              ? 'Verifica en tiempo real el dinero en efectivo que debes tener en el cajón por tus cobros y adelantos de hoy.'
              : `Auditoría y arqueo de cobros registrados en la fecha ${fechaFiltro}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Fecha para ver Historial de Cajas Pasadas */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <label htmlFor="fechaCaja" className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <span>📅</span> Fecha:
            </label>
            <input
              id="fechaCaja"
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 cursor-pointer"
            />
            {fechaFiltro !== new Date().toISOString().split('T')[0] && (
              <button
                type="button"
                onClick={() => setFechaFiltro(new Date().toISOString().split('T')[0])}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition cursor-pointer"
                title="Volver a la fecha de hoy"
              >
                Hoy
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => fetchMiCaja(fechaFiltro)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors disabled:opacity-60 cursor-pointer"
            title="Recargar mi caja"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-600'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{loading ? 'Actualizando...' : 'Actualizar'}</span>
          </button>

          <Link
            to="/cotizador"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer shadow-emerald-600/20"
          >
            <span>⚡</span>
            <span>Nueva Cotización</span>
          </Link>

          <Link
            to="/pedidos"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all cursor-pointer shadow-blue-600/20"
          >
            <span>📋</span>
            <span>Ver Pedidos</span>
          </Link>
        </div>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={fetchMiCaja}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !datosCaja && (
        <div className="space-y-6 animate-pulse">
          <div className="h-44 bg-slate-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL DE CUADRE DE CAJA */}
      {!loading && (
        <>
          {/* TARJETA HERO: DINERO TOTAL EN CAJA FÍSICA HOY */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-100">
                  <span>💵 Total en Cajón de Dinero</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                  <span>Efectivo Real Hoy</span>
                </div>
                <p className="text-sm text-emerald-100/90 font-medium">
                  Monto total exacto que debe existir físicamente en tu caja al momento del cierre:
                </p>
                <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight font-mono text-white pt-1">
                  {formatSoles(cajaRealHoy)}
                </div>
                <p className="text-xs text-emerald-200">
                  Incluye todos los adelantos de pedidos nuevos y saldos cobrados de entregas hoy.
                </p>
              </div>

              {/* Botón para Abrir Arqueo Físico Interactivo */}
              <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarArqueo(!mostrarArqueo)}
                  className="inline-flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-bold px-5 py-3 rounded-2xl shadow-lg transition-all cursor-pointer text-sm"
                >
                  <span>🧮</span>
                  <span>{mostrarArqueo ? 'Ocultar Cuadre de Caja' : 'Contar Dinero y Cuadrar'}</span>
                </button>
                <span className="text-[11px] text-emerald-200/90">
                  Herramienta de arqueo físico y digital para entrega de turno
                </span>
              </div>
            </div>

            {/* Desglose rápido dentro del Hero */}
            <div className="mt-8 pt-6 border-t border-emerald-500/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-emerald-200 font-medium">Cobros por Adelantos</p>
                <p className="text-lg font-bold font-mono text-white mt-0.5">{formatSoles(adelantosHoy)}</p>
              </div>
              <div>
                <p className="text-emerald-200 font-medium">Cobros por Saldos / Entrega</p>
                <p className="text-lg font-bold font-mono text-white mt-0.5">{formatSoles(saldosHoy)}</p>
              </div>
              <div>
                <p className="text-emerald-200 font-medium">Pedidos Atendidos</p>
                <p className="text-lg font-bold font-mono text-white mt-0.5">{pedidosRegistradosHoy} cuadros</p>
              </div>
              <div>
                <p className="text-emerald-200 font-medium">Trabajos Entregados</p>
                <p className="text-lg font-bold font-mono text-white mt-0.5">{pedidosEntregadosHoy} cuadros</p>
              </div>
            </div>
          </div>

          {/* ARQUEO DE CAJA INTERACTIVO (EFECTIVO + PAGOS DIGITALES) */}
          {mostrarArqueo && (
            <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 shadow-md animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
                    🧮
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Cuadre de Caja (Efectivo y Pagos Digitales)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ingresa el conteo físico de monedas y billetes, junto con tus saldos en Yape y Banco para cuadrar con el sistema.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setConteo({
                      b200: '',
                      b100: '',
                      b50: '',
                      b20: '',
                      b10: '',
                      m5: '',
                      m2: '',
                      m1: '',
                      m050: '',
                      monedas20: '',
                      monedas10: '',
                    });
                    setYapeDeclarado('');
                    setTransferenciaDeclarada('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition underline cursor-pointer self-start sm:self-auto"
                >
                  Limpiar todo el conteo
                </button>
              </div>

              {/* SECCIÓN 1: EFECTIVO FÍSICO (BILLETES Y MONEDAS) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <span>💵</span>
                    <span>1. Efectivo Físico en Cajón (Billetes y Monedas)</span>
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    Subtotal Efectivo: {formatSoles(totalFisico)}
                  </span>
                </div>

                {/* Grid de Billetes y Monedas (Perú) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {[
                    { key: 'b200', label: 'Billetes S/ 200', mult: 200, bg: 'bg-rose-50 border-rose-200' },
                    { key: 'b100', label: 'Billetes S/ 100', mult: 100, bg: 'bg-blue-50 border-blue-200' },
                    { key: 'b50', label: 'Billetes S/ 50', mult: 50, bg: 'bg-amber-50 border-amber-200' },
                    { key: 'b20', label: 'Billetes S/ 20', mult: 20, bg: 'bg-emerald-50 border-emerald-200' },
                    { key: 'b10', label: 'Billetes S/ 10', mult: 10, bg: 'bg-teal-50 border-teal-200' },
                    { key: 'm5', label: 'Monedas S/ 5.00', mult: 5, bg: 'bg-slate-50 border-slate-200' },
                    { key: 'm2', label: 'Monedas S/ 2.00', mult: 2, bg: 'bg-slate-50 border-slate-200' },
                    { key: 'm1', label: 'Monedas S/ 1.00', mult: 1, bg: 'bg-slate-50 border-slate-200' },
                    { key: 'm050', label: 'Monedas S/ 0.50', mult: 0.5, bg: 'bg-slate-50 border-slate-200' },
                    { key: 'monedas20', label: 'Monedas S/ 0.20', mult: 0.2, bg: 'bg-slate-50 border-slate-200' },
                    { key: 'monedas10', label: 'Monedas S/ 0.10', mult: 0.1, bg: 'bg-slate-50 border-slate-200' },
                  ].map((item) => (
                    <div key={item.key} className={`p-2.5 rounded-xl border ${item.bg}`}>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">{item.label}</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={conteo[item.key]}
                        onChange={(e) => setConteo({ ...conteo, [item.key]: e.target.value })}
                        placeholder="0"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <p className="text-[10px] text-right font-mono text-slate-500 mt-1">
                        = {formatSoles((Number(conteo[item.key]) || 0) * item.mult)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN 2: PAGOS DIGITALES (YAPE Y TRANSFERENCIAS) */}
              <div className="mb-6 p-4.5 rounded-2xl bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-blue-50/70 border border-purple-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-purple-100 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📱</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                        2. Pagos Digitales (Yape y Transferencias)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Anota el total cobrado según el historial de tus apps móviles y cuentas bancarias.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-700 bg-white px-3 py-1 rounded-lg border border-purple-200 shadow-2xs self-start sm:self-auto">
                    Subtotal Digital: {formatSoles(totalDigital)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Yape / Plin */}
                  <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                        Yape / Plin Declarado
                      </label>
                      <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-md">
                        Billeteras Móviles
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                        S/
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={yapeDeclarado}
                        onChange={(e) => setYapeDeclarado(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-50/60 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-base font-mono font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Monto total verificado en la app de Yape o Plin
                    </p>
                  </div>

                  {/* Transferencias Bancarias */}
                  <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        Transferencias Declaradas
                      </label>
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">
                        Cuentas Banco
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                        S/
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={transferenciaDeclarada}
                        onChange={(e) => setTransferenciaDeclarada(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-50/60 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-base font-mono font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Monto confirmado en transferencias o depósitos a cuentas bancarias
                    </p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: VISTA COMPARATIVA DE CUADRE */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Cuatro métricas de cuadre */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                    {/* Efectivo en Caja */}
                    <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/80">
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                        <span>💵</span> Efectivo en Caja
                      </p>
                      <p className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-1">
                        {formatSoles(totalFisico)}
                      </p>
                      <span className="text-[10px] text-slate-400">Billetes + monedas</span>
                    </div>

                    {/* Yape / Transferencia */}
                    <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/80">
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                        <span>📱</span> Yape/Transferencia
                      </p>
                      <p className="text-base sm:text-lg font-bold font-mono text-purple-300 mt-1">
                        {formatSoles(totalDigital)}
                      </p>
                      <span className="text-[10px] text-slate-400">Pagos digitales</span>
                    </div>

                    {/* Total Cuadrado */}
                    <div className="bg-slate-800/90 p-3 rounded-xl border border-blue-500/50 ring-1 ring-blue-500/30">
                      <p className="text-[11px] text-blue-300 uppercase font-bold tracking-wider flex items-center gap-1">
                        <span>🎯</span> Total Cuadrado
                      </p>
                      <p className="text-base sm:text-lg font-extrabold font-mono text-white mt-1">
                        {formatSoles(granTotalDeclarado)}
                      </p>
                      <span className="text-[10px] text-blue-300/80">Total declarado</span>
                    </div>

                    {/* Total Sistema */}
                    <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/80">
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                        <span>💻</span> Total Sistema
                      </p>
                      <p className="text-base sm:text-lg font-bold font-mono text-slate-300 mt-1">
                        {formatSoles(cajaRealHoy)}
                      </p>
                      <span className="text-[10px] text-slate-400">Registrado en ventas</span>
                    </div>
                  </div>

                  {/* Badge de Diferencia con el Sistema */}
                  <div className="shrink-0 flex flex-col items-start lg:items-end justify-center">
                    <div
                      className={`px-4 sm:px-5 py-3 rounded-xl border text-sm font-bold flex items-center gap-3 shadow-sm ${
                        Math.abs(diferenciaCaja) < 0.01
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : diferenciaCaja > 0
                          ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                          : 'bg-rose-500/20 border-rose-400 text-rose-300'
                      }`}
                    >
                      <span className="text-xl">
                        {Math.abs(diferenciaCaja) < 0.01
                          ? '✅'
                          : diferenciaCaja > 0
                          ? '📈'
                          : '⚠️'}
                      </span>
                      <div className="text-left">
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                          Diferencia con el Sistema
                        </div>
                        <div className="text-sm sm:text-base font-extrabold font-mono mt-0.5">
                          {Math.abs(diferenciaCaja) < 0.01
                            ? '¡Caja Cuadrada Exacta! (S/ 0.00)'
                            : diferenciaCaja > 0
                            ? `Sobrante: +${formatSoles(diferenciaCaja)}`
                            : `Faltante: ${formatSoles(diferenciaCaja)}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TARJETAS DE DETALLE OPERATIVO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta 1: Adelantos */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    Nuevos Pedidos
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                    🪙
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-700">Cobros por Adelantos</h3>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-600 mt-2">
                  {formatSoles(adelantosHoy)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Dinero recaudado al registrar pedidos nuevos en el cotizador durante tu turno.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Pedidos Tomados:</span>
                <span className="font-bold text-slate-700">{pedidosRegistradosHoy}</span>
              </div>
            </div>

            {/* Tarjeta 2: Saldos / Liquidaciones */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Entregas de Cuadros
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">
                    🤝
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-700">Cobros por Saldos / Liquidación</h3>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 mt-2">
                  {formatSoles(saldosHoy)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Dinero cobrado cuando el cliente vino a recoger su cuadro terminado y canceló la deuda.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Cuadros Entregados:</span>
                <span className="font-bold text-slate-700">{pedidosEntregadosHoy}</span>
              </div>
            </div>

            {/* Tarjeta 3: Acciones Rápidas */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    Acciones Rápidas
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                    ⚡
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-700">Cotizaciones y Pedidos</h3>
                <p className="text-xs text-slate-500 mt-2">
                  Genera nuevas cotizaciones para clientes en mostrador y gestiona el flujo de pedidos activos.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <Link
                  to="/cotizador"
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                >
                  <span>📝 Nueva Cotización</span>
                </Link>
                <Link
                  to="/pedidos"
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
                >
                  <span>📦 Ir a Gestión de Pedidos</span>
                </Link>
              </div>
            </div>
          </div>

          {/* TABLA: AUDITORÍA DE PAGOS Y TRANSACCIONES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <h3 className="text-base font-bold text-slate-800">
                    Transacciones de Caja {fechaFiltro === new Date().toISOString().split('T')[0] ? '(Hoy)' : `(${fechaFiltro})`}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Auditoría cronológica de cobros reales: desglose de adelantos y cobros de saldos.
                </p>
              </div>
              <span className="self-start sm:self-auto text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {transacciones.length} {transacciones.length === 1 ? 'pago' : 'pagos'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Hora</th>
                    <th className="px-5 py-3.5">Pedido / Cliente</th>
                    <th className="px-5 py-3.5">Tipo de Pago</th>
                    <th className="px-5 py-3.5">Método</th>
                    <th className="px-5 py-3.5 text-right">Monto Ingresado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transacciones.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-2xl">📋</span>
                          <span className="font-medium text-slate-500">
                            No hay transacciones registradas para {fechaFiltro}.
                          </span>
                          <span className="text-xs text-slate-400">
                            Los adelantos de cotizaciones y cobros de saldos aparecerán aquí automáticamente.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transacciones.map((p, idx) => {
                      const hora = formatHora(p.fechaPago || p.fechaRegistro || p.fecha || p.hora);
                      const clienteNombre =
                        p.clienteNombre ||
                        (typeof p.cliente === 'string'
                          ? p.cliente
                          : p.cliente?.nombreRazonSocial || p.cliente?.nombre) ||
                        p.nombreCliente ||
                        'Cliente en Mostrador';
                      const pedidoId = p.idPedido || p.pedidoId || p.numeroPedido || p.id;
                      const metodo = p.metodoPago || p.metodo || p.medioPago || 'EFECTIVO';
                      const montoValor = Number(p.monto ?? p.montoIngresado ?? p.montoPagado ?? p.adelanto ?? 0);

                      return (
                        <tr
                          key={p.idPago || p.idTransaccion || p.id || idx}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              🕒 {hora}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-medium text-slate-800">{clienteNombre}</div>
                            {pedidoId && (
                              <div className="text-[11px] font-mono text-slate-400">
                                Pedido #{pedidoId}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {renderTipoPagoBadge(p.tipoPago || p.tipo, p.concepto)}
                          </td>
                          <td className="px-5 py-3.5">
                            {renderMetodoPagoBadge(metodo)}
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600">
                            {formatSoles(montoValor)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MENSAJE DE TRANSPARENCIA Y CONTROL */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💡</span>
              <p>
                <strong>Consejo de Cuadre:</strong> Recuerda entregar este monto en efectivo junto con las notas de venta físicas al finalizar tu jornada o al cambiar de turno.
              </p>
            </div>
            <Link
              to="/cotizador"
              className="shrink-0 font-bold underline hover:text-blue-700 cursor-pointer"
            >
              Ir al Cotizador &rarr;
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
