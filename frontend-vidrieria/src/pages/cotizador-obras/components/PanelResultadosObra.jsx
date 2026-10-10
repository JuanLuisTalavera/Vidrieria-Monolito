import React from 'react';
import DiagramaVanoSVG from '../../components/DiagramaVanoSVG';
import TrazadoVarillasGrafico from '../../components/TrazadoVarillasGrafico';
import DiagramaPlanchaVidrioSVG from '../../components/DiagramaPlanchaVidrioSVG';

export default function PanelResultadosObra({
  pestanaActiva,
  setPestanaActiva,
  datosOptimizacion,
  despiece,
  optimizando,
  anchoSierraMm,
  tipoEstructura,
  optimizandoVidrio,
  errorOptimizacionVidrio,
  ejecutarOptimizacionVidrio,
  datosOptimizacionVidrio,
  nombreCristalSeleccionado,
  anchoVanoMm,
  altoVanoMm,
  colorAluminio,
  configuracionApertura
}) {
  return (
    <div className="lg:col-span-8 space-y-6">
      {/* Barra de Pestañas Superior */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap sm:flex-nowrap items-center gap-1.5 print:hidden">
        <button
          type="button"
          onClick={() => setPestanaActiva('esquema')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            pestanaActiva === 'esquema'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span>📐</span>
          <span className="hidden sm:inline">1. Esquema</span>
          <span className="sm:hidden">1. Vano</span>
        </button>

        <button
          type="button"
          onClick={() => setPestanaActiva('varillas')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            pestanaActiva === 'varillas'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span>🪵</span>
          <span>2. Varillas (1D)</span>
          {datosOptimizacion && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              pestanaActiva === 'varillas' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
            }`} >
              {datosOptimizacion.totalVarillas}v
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setPestanaActiva('vidrio')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            pestanaActiva === 'vidrio'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span>🪟</span>
          <span>3. Vidrio (2D)</span>
          {despiece?.listaCristales && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              pestanaActiva === 'vidrio' ? 'bg-white text-emerald-800' : 'bg-sky-100 text-sky-800'
            }`} >
              {despiece.listaCristales.length}p
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setPestanaActiva('ficha')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            pestanaActiva === 'ficha'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span>📋</span>
          <span className="hidden sm:inline">4. Ficha Taller</span>
          <span className="sm:hidden">4. Ficha</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* CONTENIDO PESTAÑA 1: ESQUEMA ESTRUCTURAL SVG            */}
      {/* ======================================================== */}
      {pestanaActiva === 'esquema' && (
        <div className="space-y-6">
          <DiagramaVanoSVG
            anchoMm={Number(anchoVanoMm) || 0}
            altoMm={Number(altoVanoMm) || 0}
            tipoEstructura={tipoEstructura}
            colorAluminio={colorAluminio}
            configuracionApertura={configuracionApertura}
            tipoCristalNombre={nombreCristalSeleccionado}
          />

          {/* Ficha técnica rápida del vano */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Área del Vano
              </span>
              <span className="text-xl font-black text-slate-800 mt-0.5 block">
                {despiece?.areaVanoM2} m²
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Perímetro
              </span>
              <span className="text-xl font-black text-slate-800 mt-0.5 block">
                {despiece?.perimetroVanoMl} ml
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Aluminio Est.
              </span>
              <span className="text-xl font-black text-emerald-600 mt-0.5 block">
                {despiece?.varillasEstimadas} varillas
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Precio Sugerido
              </span>
              <span className="text-xl font-black text-blue-600 mt-0.5 block">
                S/ {despiece?.costeo?.precioVentaSugerido}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONTENIDO PESTAÑA 2: TRAZADO DE VARILLAS 1D              */}
      {/* ======================================================== */}
      {pestanaActiva === 'varillas' && (
        <div>
          {optimizando ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Calculando optimización de cortes de aluminio...</p>
              <p className="text-xs text-slate-400 mt-1">Empaquetando perfiles de 6.00 metros con merma de disco de {anchoSierraMm}mm</p>
            </div>
          ) : (
            <TrazadoVarillasGrafico
              datosOptimizacion={datosOptimizacion}
              titulo="Trazado de Varillas de Aluminio (6.00 m)"
              subtitulo={`Perfiles Serie ${tipoEstructura.includes('25') ? '25' : '20'} con disco de ${anchoSierraMm} mm`}
              unidadMedida="mm"
            />
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* CONTENIDO PESTAÑA 3: TRAZADO DE VIDRIO 2D EN PLANCHA     */}
      {/* ======================================================== */}
      {pestanaActiva === 'vidrio' && (
        <div className="space-y-4">
          {optimizandoVidrio ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
              <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Optimizando trazado de corte 2D en plancha de vidrio...</p>
              <p className="text-xs text-slate-400 mt-1">
                Distribuyendo {despiece?.listaCristales?.length || 0} paños calculados para minimizar la merma de la plancha matriz
              </p>
            </div>
          ) : errorOptimizacionVidrio ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-800 space-y-3 shadow-2xs">
              <div className="text-3xl">⚠️</div>
              <h4 className="font-bold text-sm">Error en la Optimización de Vidrio</h4>
              <p className="text-xs text-rose-600 max-w-md mx-auto">{errorOptimizacionVidrio}</p>
              <button
                type="button"
                onClick={ejecutarOptimizacionVidrio}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
              >
                Reintentar Optimización
              </button>
            </div>
          ) : (
            <DiagramaPlanchaVidrioSVG
              optimizacionVidrio={datosOptimizacionVidrio}
              titulo="Plano de Corte 2D - Plancha de Vidrio"
              subtitulo={`Distribución milimétrica de paños de ${nombreCristalSeleccionado} sobre lámina matriz`}
              unidadMedida="mm"
            />
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* CONTENIDO PESTAÑA 4: FICHA DE TALLER Y CRISTALES         */}
      {/* ======================================================== */}
      {pestanaActiva === 'ficha' && (
        <div className="space-y-6">
          {/* TABLA 1: DESPIECE DE PERFILES DE ALUMINIO */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">1.</span>
                <h3 className="text-sm font-bold tracking-wide">
                  Despiece de Perfiles de Aluminio (Para Maestro Carpintero)
                </h3>
              </div>
              <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded border border-slate-700">
                Total: {despiece?.totalMetrosLinealesPerfil} ml
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                    <th className="px-4 py-3">Pieza / Perfil</th>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Fórmula Taller</th>
                    <th className="px-4 py-3 text-center">Corte</th>
                    <th className="px-4 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 text-right">Largo Corte (mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {despiece?.perfilesAluminio.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 text-slate-800 font-bold">
                        {p.nombre}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono">
                        {p.codigoPerfil}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 font-mono text-[11px]">
                        {p.formulaTexto}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-700">
                          {p.corte}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-bold text-slate-900">
                        {p.cantidad}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-black text-sm text-emerald-700">
                        {p.longitudMm} mm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 2: MEDIDAS DE VIDRIO PARA EL CORTADOR */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 bg-sky-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sky-400 font-bold">2.</span>
                <h3 className="text-sm font-bold tracking-wide">
                  Medidas de Vidrio para el Cortador (Taller Vidriero)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPestanaActiva('vidrio')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-2xs transition-all cursor-pointer"
                  title="Ver optimización gráfica 2D sobre la plancha matriz"
                >
                  <span>🪟</span>
                  <span>Ver Plano de Corte 2D</span>
                </button>
                <span className="text-xs font-mono bg-sky-800 text-sky-200 px-2.5 py-0.5 rounded border border-sky-700">
                  {despiece?.areaTotalVidrioM2} m² cristal
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                    <th className="px-4 py-3">Paño</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-center">Ancho Corte</th>
                    <th className="px-4 py-3 text-center">Alto Corte</th>
                    <th className="px-4 py-3 text-center">Área m²</th>
                    <th className="px-4 py-3 text-right">Especificación Cristal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {despiece?.listaCristales.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-800 font-bold">
                        {c.etiqueta}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          {c.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                        {c.anchoMm} mm <span className="text-slate-400 text-[10px]">({c.anchoCm} cm)</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                        {c.altoMm} mm <span className="text-slate-400 text-[10px]">({c.altoCm} cm)</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600">
                        {c.areaM2} m²
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 font-semibold">
                        {nombreCristalSeleccionado}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA 3: ACCESORIOS Y HERRAJES */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">3.</span>
                <h3 className="text-sm font-bold tracking-wide">
                  Accesorios, Empaques y Herrajes Requeridos
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                    <th className="px-4 py-3">Accesorio / Insumo</th>
                    <th className="px-4 py-3 text-center">Cantidad</th>
                    <th className="px-4 py-3 text-center">Unidad</th>
                    <th className="px-4 py-3 text-right">Costo Unitario</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {despiece?.accesorios.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 text-slate-800 font-semibold">
                        {a.nombre}
                      </td>
                      <td className="px-4 py-2.5 text-center font-bold text-slate-900">
                        {a.cantidad}
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate-500">
                        {a.unidad}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                        S/ {a.precioUnit.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        S/ {(a.cantidad * a.precioUnit).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD DE RESUMEN FINANCIERO Y COTIZACIÓN */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-1.5">
              <span>💰</span>
              <span>Desglose de Costos y Liquidación Económica</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[11px]">Costo Aluminio ({despiece?.varillasEstimadas} var.)</span>
                <strong className="text-base text-white font-mono mt-0.5 block">
                  S/ {despiece?.costeo?.costoTotalAluminio}
                </strong>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[11px]">Costo Cristal ({despiece?.areaTotalVidrioM2} m²)</span>
                <strong className="text-base text-white font-mono mt-0.5 block">
                  S/ {despiece?.costeo?.costoTotalVidrio}
                </strong>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[11px]">Accesorios & Felpa</span>
                <strong className="text-base text-white font-mono mt-0.5 block">
                  S/ {despiece?.costeo?.costoTotalAccesorios}
                </strong>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[11px]">Mano de Obra Taller</span>
                <strong className="text-base text-white font-mono mt-0.5 block">
                  S/ {despiece?.costeo?.costoManoObra}
                </strong>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400">Costo directo total fabricación: </span>
                <strong className="text-slate-200 font-mono">S/ {despiece?.costeo?.costoDirectoTotal}</strong>
                <span className="mx-2 text-slate-600">|</span>
                <span className="text-xs text-slate-400">Utilidad estimada ({despiece?.costeo?.margenUtilidadPorcentaje}%): </span>
                <strong className="text-emerald-400 font-mono">S/ {despiece?.costeo?.utilidadEstimada}</strong>
              </div>

              <div className="text-right">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">
                  Precio de Venta Sugerido
                </span>
                <span className="text-3xl font-black text-emerald-400 tracking-tight font-mono">
                  S/ {despiece?.costeo?.precioVentaSugerido}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
