import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as dashboardService from '../services/dashboard.service';

export default function DashboardPage() {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);

  const fetchResumen = useCallback(async (fecha = fechaFiltro) => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.obtenerResumenDashboard(fecha);
      setResumen(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error al cargar el resumen del dashboard:', err);
      setError('No se pudo cargar la información del dashboard para la fecha seleccionada. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [fechaFiltro]);

  useEffect(() => {
    fetchResumen(fechaFiltro);
  }, [fechaFiltro, fetchResumen]);

  // Formateo de moneda en Soles peruanos
  const formatSoles = (valor) => {
    const num = Number(valor || 0);
    return `S/ ${num.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Datos y Cálculos derivados del backend
  const cajaReal = Number(resumen?.cajaReal ?? resumen?.ingresosTotales ?? 0);
  const ventasFormales = Number(resumen?.ventasFormales || 0);
  const ventasInternas = Number(resumen?.ventasInternas || 0);
  const cuentasPorCobrar = Number(resumen?.cuentasPorCobrar || 0);

  // Cálculos contables para ventas formales e internas
  const igvEstimado = ventasFormales > 0 ? ventasFormales - (ventasFormales / 1.18) : 0;
  const baseFormal = ventasFormales > 0 ? ventasFormales / 1.18 : 0;
  const totalVentas = ventasFormales + ventasInternas;
  const pctFormal = totalVentas > 0 ? Math.round((ventasFormales / totalVentas) * 100) : 0;
  const pctInterno = totalVentas > 0 ? 100 - pctFormal : 0;

  const totalPedidosActivos =
    Number(resumen?.pedidosEnTaller || 0) +
    Number(resumen?.pedidosListos || 0) +
    Number(resumen?.pedidosEntregados || 0);

  // Lista de pagos / transacciones enviadas por el backend
  const transacciones = useMemo(() => {
    const list =
      resumen?.pagos ??
      resumen?.ventasDeHoy ??
      resumen?.movimientos ??
      resumen?.transacciones ??
      resumen?.pedidos ??
      resumen?.detalles ??
      [];
    return Array.isArray(list) ? list : [];
  }, [resumen]);

  const ventasDeHoy = transacciones;

  // Formateador de Hora HH:mm a partir de fechaRegistro
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Saldo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
        Adelanto
      </span>
    );
  };

  // Badge con color sutil según Método de Pago
  const renderMetodoPagoBadge = (metodo) => {
    const m = String(metodo || 'EFECTIVO').toUpperCase().trim();
    if (m === 'YAPE' || m === 'PLIN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Yape
        </span>
      );
    }
    if (m === 'TRANSFERENCIA') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Transferencia
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Efectivo
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Control Financiero &bull; Interno vs SUNAT
            </span>
            <span className="text-xs text-slate-400">
              {lastUpdated
                ? `Actualizado: ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Cargando...'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            Resumen General de la Marquería
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Control de caja real, ventas formales (SUNAT), ventas internas y pedidos en taller.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Fecha para Historial de Cajas */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <label htmlFor="fechaDashboard" className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <span>📅</span> Fecha:
            </label>
            <input
              id="fechaDashboard"
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 cursor-pointer"
            />
            {fechaFiltro !== new Date().toISOString().split('T')[0] && (
              <button
                type="button"
                onClick={() => setFechaFiltro(new Date().toISOString().split('T')[0])}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 transition cursor-pointer"
                title="Volver a la fecha de hoy"
              >
                Hoy
              </button>
            )}
          </div>

          <button
            onClick={() => fetchResumen(fechaFiltro)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors disabled:opacity-60 cursor-pointer"
            title="Recargar datos del dashboard"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-600'}`}
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nueva Cotización</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
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
            onClick={fetchResumen}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !resumen && (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-44 bg-slate-200 rounded-2xl"></div>
            <div className="h-44 bg-slate-200 rounded-2xl"></div>
            <div className="h-44 bg-slate-200 rounded-2xl"></div>
            <div className="h-44 bg-slate-200 rounded-2xl"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-36 bg-slate-200 rounded-2xl"></div>
            <div className="h-36 bg-slate-200 rounded-2xl"></div>
            <div className="h-36 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      )}

      {/* Contenido Principal con Datos */}
      {resumen && (
        <>
          {/* ============================================================ */}
          {/* SECCIÓN 1: FINANZAS (4 Tarjetas Claras: Caja, Formal, Interno, Saldos) */}
          {/* ============================================================ */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Métricas Financieras & Contables
                </h2>
                <p className="text-xs text-slate-500">
                  Separación entre dinero real en caja, facturación formal (SUNAT) y ventas internas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Separación Fiscal SUNAT / Interno
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Moneda: Soles (PEN)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Tarjeta 1 (Verde Fuerte): "Dinero en Caja Real" */}
              <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 border-2 border-emerald-500/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-bl-full pointer-events-none"></div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                      100% Físico
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/30">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-700">
                    Dinero en Caja Real
                  </h3>

                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight font-mono mt-2">
                    {formatSoles(cajaReal)}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Todo el ingreso físico (Adelantos + Pagos)
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-200/70 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Efectivo y cobros ya disponibles en caja</span>
                </div>
              </div>

              {/* Tarjeta 2 (Azul): "Ventas Formales (SUNAT)" */}
              <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50/40 border-2 border-blue-500/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 rounded-bl-full pointer-events-none"></div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                      Boleta / Factura
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-600/30">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-700">
                    Ventas Formales (SUNAT)
                  </h3>

                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-tight font-mono mt-2">
                    {formatSoles(ventasFormales)}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    IGV Estimado: S/ {igvEstimado.toFixed(2)}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-blue-200/70 text-[11px] text-blue-800 flex items-center justify-between font-medium">
                  <span>Base: S/ {baseFormal.toFixed(2)}</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    IGV 18%
                  </span>
                </div>
              </div>

              {/* Tarjeta 3 (Gris/Plata): "Ventas Internas" */}
              <div className="bg-gradient-to-br from-slate-100 via-white to-slate-50/60 border-2 border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-300/20 rounded-bl-full pointer-events-none"></div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-700 text-white shadow-xs">
                      Nota de Venta
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-sm shadow-slate-700/20">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-700">
                    Ventas Internas
                  </h3>

                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-mono mt-2">
                    {formatSoles(ventasInternas)}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Sin comprobante (No genera IGV)
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-600 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>100% liquidez directa para el negocio</span>
                </div>
              </div>

              {/* Tarjeta 4 (Naranja): "Saldos por Cobrar" */}
              <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-2 border-amber-400/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-bl-full pointer-events-none"></div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                      En la Calle
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/20">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-700">
                    Saldos por Cobrar
                  </h3>

                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 tracking-tight font-mono mt-2">
                    {formatSoles(cuentasPorCobrar)}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Deudas pendientes de clientes
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200/70 text-[11px] text-amber-800 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Por cobrar al entregar pedidos terminados</span>
                </div>
              </div>
            </div>

            {/* Barra comparativa de distribución de ventas (Formal vs Interna) */}
            <div className="mt-5 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-2 gap-1">
                <span className="font-semibold text-slate-700">
                  Distribución de Ventas Totales: {formatSoles(totalVentas)}
                </span>
                <div className="flex items-center gap-4 text-[11px] font-medium">
                  <span className="text-blue-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Formal SUNAT: {pctFormal}% ({formatSoles(ventasFormales)})
                  </span>
                  <span className="text-slate-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                    Internas: {pctInterno}% ({formatSoles(ventasInternas)})
                  </span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                <div
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{ width: `${pctFormal}%` }}
                  title={`Formal SUNAT: ${pctFormal}%`}
                ></div>
                <div
                  className="bg-slate-600 h-full transition-all duration-500"
                  style={{ width: `${pctInterno}%` }}
                  title={`Internas: ${pctInterno}%`}
                ></div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECCIÓN 2: PRODUCCIÓN (3 Tarjetas Operativas)                */}
          {/* ============================================================ */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Producción & Estado del Taller
                </h2>
                <p className="text-xs text-slate-500">
                  Carga de trabajo en la mesa de corte, armado y pedidos listos para recojo
                </p>
              </div>
              <Link
                to="/pedidos"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
              >
                Ver todos los pedidos &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tarjeta Producción 1: En Taller (Fabricación) */}
              <div className="bg-white border border-blue-200 hover:border-blue-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      En Mesa de Trabajo
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-700">
                  En Taller (Fabricación)
                </h3>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-extrabold text-blue-700 font-mono">
                    {resumen.pedidosEnTaller ?? 0}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {resumen.pedidosEnTaller === 1 ? 'pedido activo' : 'pedidos activos'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  Cuadros y vidrios en proceso de corte, pulido o ensamble de moldura.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Estado: EN_TALLER
                  </span>
                  <Link
                    to="/pedidos"
                    className="text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1"
                  >
                    Ver taller &rarr;
                  </Link>
                </div>
              </div>

              {/* Tarjeta Producción 2: Listos para Entregar */}
              <div className="bg-white border border-sky-200 hover:border-sky-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-sky-400"></div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                    <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                      Por Recoger
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-700">
                  Listos para Entregar
                </h3>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-extrabold text-sky-600 font-mono">
                    {resumen.pedidosListos ?? 0}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {resumen.pedidosListos === 1 ? 'pedido terminado' : 'pedidos terminados'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  Trabajos concluidos esperando que el cliente recoja y liquide el saldo.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                    Estado: LISTO
                  </span>
                  <Link
                    to="/pedidos"
                    className="text-xs font-semibold text-sky-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1"
                  >
                    Ver listos &rarr;
                  </Link>
                </div>
              </div>

              {/* Tarjeta Producción 3: Entregados */}
              <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-400"></div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Cerrados & Despachados
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-700">
                  Entregados
                </h3>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-extrabold text-slate-700 font-mono">
                    {resumen.pedidosEntregados ?? 0}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {resumen.pedidosEntregados === 1 ? 'pedido despachado' : 'pedidos despachados'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  Órdenes concluidas, entregadas con satisfacción y cobro liquidado.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Estado: ENTREGADO
                  </span>
                  <Link
                    to="/pedidos"
                    className="text-xs font-semibold text-slate-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1"
                  >
                    Historial &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* TABLA: AUDITORÍA DE PAGOS Y TRANSACCIONES                   */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <h3 className="text-base font-bold text-slate-800">
                    Transacciones de Caja {fechaFiltro === new Date().toISOString().split('T')[0] ? '(Hoy)' : `(${fechaFiltro})`}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Auditoría cronológica de ingresos reales: desglose de adelantos y cobros de saldos.
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
                            Los adelantos de cotizaciones y cobros de saldos aparecerán aquí en tiempo real.
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

          {/* ============================================================ */}
          {/* SECCIÓN 3: ATAJOS RÁPIDOS Y RECOMENDACIÓN OPERATIVA          */}
          {/* ============================================================ */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span>💡</span> Sugerencia Operativa para Marquería
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  {cuentasPorCobrar > 0
                    ? `Tienes ${formatSoles(cuentasPorCobrar)} pendientes por cobrar en pedidos listos/taller`
                    : '¡Excelente! No tienes saldos pendientes por cobrar actualmente'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cuando un cliente recoja su cuadro en estado <strong className="text-sky-300">Listo</strong>, entra a la sección de pedidos y pulsa el botón de cobro rápido para registrar el ingreso a caja y liquidar la deuda.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/cotizador"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center gap-2 shadow-xs"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Cotizar Cuadro o Vidrio
                </Link>

                <Link
                  to="/pedidos"
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors flex items-center gap-2 border border-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Control de Pedidos ({totalPedidosActivos})
                </Link>

                <Link
                  to="/inventario"
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors flex items-center gap-2 border border-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Inventario
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
