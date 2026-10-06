import React from 'react';

export default function PanelLiquidacionCaja({
  estadoCliente,
  clienteNombre,
  clienteDocumento,
  handleLimpiarCliente,
  mensajeCRM,
  setMensajeCRM,
  clienteTipoDocumento,
  setClienteTipoDocumento,
  setClienteDocumento,
  buscarCliente,
  buscandoCliente,
  esClienteNuevo,
  registrarClienteInline,
  guardandoCliente,
  setClienteNombre,
  clienteTelefono,
  setClienteTelefono,
  clienteDireccion,
  setClienteDireccion,
  carritoGlobal,
  totalPedido,
  tipoComprobante,
  setTipoComprobante,
  metodoPago,
  setMetodoPago,
  fechaEntrega,
  setFechaEntrega,
  montoAdelanto,
  setMontoAdelanto,
  saldoPendiente,
  handleRegistrarVentaCompleta,
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <h2 className="text-lg font-bold text-slate-800">
            3. Datos del Cliente & Liquidación de Pago
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Identifica o registra al cliente en el CRM y define las condiciones de pago para cerrar la venta completa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* TARJETA IZQUIERDA: CRM / DATOS DEL CLIENTE */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
                👤
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Cliente / CRM
                </h3>
                <p className="text-xs text-slate-400">Búsqueda rápida por documento o registro directo</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {estadoCliente === 'encontrado' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  En CRM
                </span>
              )}
              {estadoCliente === 'nuevo' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Nuevo
                </span>
              )}
              {(clienteNombre || clienteDocumento) && (
                <button
                  type="button"
                  onClick={handleLimpiarCliente}
                  className="text-xs text-slate-400 hover:text-slate-600 transition underline cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* MENSAJE FEEDBACK CRM */}
          {mensajeCRM && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                mensajeCRM.tipo === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : mensajeCRM.tipo === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{mensajeCRM.tipo === 'success' ? '✅' : mensajeCRM.tipo === 'error' ? '⚠️' : 'ℹ️'}</span>
                <span>{mensajeCRM.texto}</span>
              </div>
              <button
                type="button"
                onClick={() => setMensajeCRM(null)}
                className="opacity-60 hover:opacity-100 cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* BÚSQUEDA POR DOCUMENTO */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-2.5">
              <div className="w-full sm:w-32 shrink-0">
                <label htmlFor="tipoDoc" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo
                </label>
                <select
                  id="tipoDoc"
                  value={clienteTipoDocumento}
                  onChange={(e) => setClienteTipoDocumento(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition cursor-pointer"
                >
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                  <option value="CE">C.E.</option>
                </select>
              </div>

              <div className="flex-1">
                <label htmlFor="clienteDocumento" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Número de Documento
                </label>
                <div className="relative">
                  <input
                    id="clienteDocumento"
                    type="text"
                    value={clienteDocumento}
                    onChange={(e) => {
                      setClienteDocumento(e.target.value);
                      if (estadoCliente) handleLimpiarCliente?.(true); // Wait, CotizadorPage had `if (estadoCliente) setEstadoCliente(null);`, I don't have setEstadoCliente prop. I'll pass setEstadoCliente too, or let me just use setClienteDocumento directly.
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        buscarCliente();
                      }
                    }}
                    placeholder="Ej. 72345678 y Enter..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition"
                  />
                  {clienteDocumento && (
                    <button
                      type="button"
                      onClick={() => {
                        setClienteDocumento('');
                        if (estadoCliente) handleLimpiarCliente?.(true); // CotizadorPage has `setEstadoCliente(null)`
                      }}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => buscarCliente()}
                disabled={buscandoCliente}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-all cursor-pointer text-xs disabled:opacity-70"
              >
                {buscandoCliente ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Buscar</span>
                )}
              </button>
            </div>
          </div>

          {/* SI ES NUEVO: BOTÓN GUARDAR CLIENTE EN BD */}
          {esClienteNuevo && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3">
              <div className="text-xs text-emerald-900">
                <strong>Cliente nuevo:</strong> Llena sus datos y regístralo en CRM con un clic.
              </div>
              <button
                type="button"
                onClick={registrarClienteInline}
                disabled={guardandoCliente}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer shrink-0 disabled:opacity-60"
              >
                {guardandoCliente ? 'Guardando...' : '💾 Guardar en CRM'}
              </button>
            </div>
          )}

          {/* INPUTS DETALLE CLIENTE */}
          <div className="space-y-3">
            <div>
              <label htmlFor="clienteNombre" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre o Razón Social {esClienteNuevo && <span className="text-emerald-600 font-bold">*</span>}
              </label>
              <input
                id="clienteNombre"
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej. Juan Pérez o Inversiones S.A.C."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="clienteTelefono" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  id="clienteTelefono"
                  type="text"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  placeholder="Ej. 987654321"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="clienteDireccion" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dirección / Referencia
                </label>
                <input
                  id="clienteDireccion"
                  type="text"
                  value={clienteDireccion}
                  onChange={(e) => setClienteDireccion(e.target.value)}
                  placeholder="Ej. Jr. Ayacucho 123"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TARJETA DERECHA: LIQUIDACIÓN, PAGO Y REGISTRO FINAL (POS) */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Caja & Liquidación
                </h3>
                <p className="text-xs text-slate-400">Total acumulado de los cuadros en carrito</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {carritoGlobal.length} {carritoGlobal.length === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>

          {/* Total Acumulado a Cobrar */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border-2 border-emerald-500/80 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
              Total de la Venta
            </p>
            <p className="text-3xl sm:text-4xl text-emerald-700 font-extrabold tracking-tight font-mono">
              S/ {totalPedido.toFixed(0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Suma total de los {carritoGlobal.length} ítems agregados al pedido
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Selector Tipo de Comprobante */}
            <div>
              <label htmlFor="tipoComprobante" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Comprobante
              </label>
              <select
                id="tipoComprobante"
                value={tipoComprobante}
                onChange={(e) => setTipoComprobante(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-500 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs outline-none cursor-pointer"
              >
                <option value="NOTA_VENTA">Nota de Venta (Interno)</option>
                <option value="BOLETA">Boleta de Venta</option>
                <option value="FACTURA">Factura Electrónica</option>
              </select>
            </div>

            {/* Selector Método de Pago */}
            <div>
              <label htmlFor="metodoPago" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Método de Pago
              </label>
              <select
                id="metodoPago"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-500 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs outline-none cursor-pointer"
              >
                <option value="EFECTIVO">EFECTIVO</option>
                <option value="YAPE">YAPE / PLIN</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              </select>
            </div>

            {/* Selector Fecha Estimada de Entrega */}
            <div>
              <label htmlFor="fechaEntrega" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Fecha y Hora de Entrega
              </label>
              <input
                id="fechaEntrega"
                type="datetime-local"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-500 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Adelanto / A Cuenta */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="montoAdelanto" className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                Adelanto en Caja (S/)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMontoAdelanto(Math.ceil(totalPedido / 2))}
                  className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors cursor-pointer"
                  title="Cobrar 50% de adelanto"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setMontoAdelanto(totalPedido)}
                  className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors cursor-pointer"
                  title="Cobrar 100% / Total"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => setMontoAdelanto(0)}
                  className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                  title="Sin adelanto"
                >
                  S/ 0
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600 font-bold text-sm">
                S/
              </span>
              <input
                id="montoAdelanto"
                type="number"
                step="any"
                min="0"
                value={montoAdelanto === 0 ? '' : montoAdelanto}
                onChange={(e) =>
                  setMontoAdelanto(e.target.value === '' ? 0 : Number(e.target.value))
                }
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 bg-white border border-blue-300 focus:border-blue-500 rounded-lg text-base font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400/20 shadow-2xs text-right transition"
              />
            </div>
          </div>

          {/* Saldo Pendiente */}
          <div
            className={`rounded-xl p-3 border text-center transition-colors ${
              saldoPendiente <= 0 && totalPedido > 0
                ? 'bg-emerald-50/50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50/60 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span>Saldo Pendiente:</span>
              <span className="font-mono text-base font-extrabold">
                S/ {saldoPendiente.toFixed(0)}
              </span>
            </div>
            {saldoPendiente <= 0 && totalPedido > 0 && (
              <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                ✓ Pagado por completo
              </span>
            )}
          </div>

          {/* Botón Final: Registrar Venta Completa */}
          <button
            type="button"
            onClick={handleRegistrarVentaCompleta}
            disabled={carritoGlobal.length === 0}
            className={`w-full font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              carritoGlobal.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-98 text-white shadow-blue-500/25'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>
              {carritoGlobal.length === 0
                ? 'Agrega productos para registrar venta'
                : `Registrar Venta Completa (S/ ${totalPedido.toFixed(0)})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
