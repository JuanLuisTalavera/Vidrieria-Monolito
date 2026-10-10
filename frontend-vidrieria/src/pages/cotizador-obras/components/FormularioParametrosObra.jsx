import React from 'react';
import {
  TIPOS_ESTRUCTURAS,
  COLORES_ALUMINIO,
} from '../../../utils/despieceObrasHelper';

export default function FormularioParametrosObra({
  clienteDoc,
  setClienteDoc,
  buscarClientePorDoc,
  buscandoCliente,
  mensajeCliente,
  clienteNombre,
  setClienteNombre,
  anchoVanoMm,
  setAnchoVanoMm,
  altoVanoMm,
  setAltoVanoMm,
  aplicarPresetMedida,
  tipoEstructura,
  setTipoEstructura,
  tipoCristalId,
  setTipoCristalId,
  vidrios,
  colorAluminio,
  setColorAluminio,
  configuracionApertura,
  setConfiguracionApertura,
  anchoSierraMm,
  setAnchoSierraMm,
  margenUtilidad,
  setMargenUtilidad
}) {
  return (
    <div className="lg:col-span-4 space-y-5 print:hidden">
      {/* Card: Datos del Cliente */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <span>👤</span>
          <span>Datos del Cliente / Obra</span>
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            DNI o RUC
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Número de doc."
              value={clienteDoc}
              onChange={(e) => setClienteDoc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarClientePorDoc()}
              className="flex-1 px-3 py-2 rounded-xl text-xs border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
            <button
              type="button"
              onClick={() => buscarClientePorDoc()}
              disabled={buscandoCliente}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {buscandoCliente ? '...' : '🔍'}
            </button>
          </div>
          {mensajeCliente && (
            <p className={`text-[11px] mt-1 font-medium ${mensajeCliente.tipo === 'success' ? 'text-emerald-600' : 'text-slate-500'}`}>
              {mensajeCliente.texto}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nombre o Razón Social
          </label>
          <input
            type="text"
            placeholder="Nombre del cliente o proyecto"
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Card: Medidas del Vano (mm) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span>📏</span>
            <span>Medidas del Vano (en mm)</span>
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Milímetros
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ancho Vano (mm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="300"
                max="6000"
                step="1"
                value={anchoVanoMm}
                onChange={(e) => setAnchoVanoMm(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-bold text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                mm
              </span>
            </div>
            <span className="text-[10.5px] text-slate-400 mt-1 block">
              ={(Number(anchoVanoMm || 0) / 10).toFixed(1)} cm
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alto Vano (mm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="300"
                max="4000"
                step="1"
                value={altoVanoMm}
                onChange={(e) => setAltoVanoMm(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-bold text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                mm
              </span>
            </div>
            <span className="text-[10.5px] text-slate-400 mt-1 block">
              ={(Number(altoVanoMm || 0) / 10).toFixed(1)} cm
            </span>
          </div>
        </div>

        {/* Presets rápidos de taller */}
        <div>
          <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
            Medidas típicas rápidas:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { a: 1200, h: 1000, label: '1.20 × 1.00m' },
              { a: 1500, h: 1200, label: '1.50 × 1.20m' },
              { a: 1800, h: 1500, label: '1.80 × 1.50m' },
              { a: 2000, h: 2100, label: '2.00 × 2.10m' },
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => aplicarPresetMedida(p.a, p.h)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card: Sistema y Especificaciones Técnicas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <span>⚙️</span>
          <span>Sistema de Carpintería</span>
        </h3>

        {/* Selector de Sistema */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Tipo de Estructura
          </label>
          <select
            value={tipoEstructura}
            onChange={(e) => setTipoEstructura(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {TIPOS_ESTRUCTURAS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.codigo})
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Cristal */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Tipo de Cristal / Vidrio
          </label>
          <select
            value={tipoCristalId}
            onChange={(e) => setTipoCristalId(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {vidrios.map((v) => {
              const idOpcion = v.id ?? v.idVidrio;
              const nombreOpcion = v.nombre || v.tipo || `Vidrio #${idOpcion}`;
              return (
                <option key={idOpcion} value={idOpcion}>
                  {nombreOpcion} {v.precioM2 ? `(S/ ${Number(v.precioM2).toFixed(2)}/m²)` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Acabado de Perfil de Aluminio */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Color y Acabado del Perfil
          </label>
          <div className="grid grid-cols-2 gap-2">
            {COLORES_ALUMINIO.map((c) => {
              const seleccionado = colorAluminio === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorAluminio(c.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    seleccionado
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs font-bold text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 border border-black/20"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="truncate">{c.nombre.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuración de Hojas (OX vs XX) */}
        {tipoEstructura.includes('2H') && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Apertura y Movilidad
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfiguracionApertura('OX')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  configuracionApertura === 'OX'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🔒 OX: 1 Fijo + 1 Móvil
              </button>
              <button
                type="button"
                onClick={() => setConfiguracionApertura('XX')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                  configuracionApertura === 'XX'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ⇄ XX: 2 Corredizos
              </button>
            </div>
          </div>
        )}

        {/* Parámetros de Sierra y Margen */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Merma Disco Sierra
            </label>
            <select
              value={anchoSierraMm}
              onChange={(e) => setAnchoSierraMm(Number(e.target.value))}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
            >
              <option value="3">3 mm (Fino)</option>
              <option value="4">4 mm (Estándar)</option>
              <option value="5">5 mm (Grueso)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Margen Comercial
            </label>
            <select
              value={margenUtilidad}
              onChange={(e) => setMargenUtilidad(Number(e.target.value))}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
            >
              <option value="0.25">25% (Mayorista)</option>
              <option value="0.35">35% (Estándar)</option>
              <option value="0.45">45% (Instalado)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
