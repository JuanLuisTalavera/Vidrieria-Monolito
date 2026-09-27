import { useState, useMemo } from 'react';

/**
 * Diagramador de Barras/Varillas Lineales (1D Cutting Stock Visualization)
 * Muestra el aprovechamiento proporcional de perfiles o molduras con mermas de disco y retazos.
 */
export default function TrazadoVarillasGrafico({
  datosOptimizacion = null,
  titulo = 'Esquema de Trazado y Corte de Varillas',
  subtitulo = 'Aprovechamiento lineal milimétrico para operarios de taller',
  unidadMedida = 'mm', // 'mm' o 'cm'
  className = '',
}) {
  const [segmentoActivo, setSegmentoActivo] = useState(null);
  const [copiado, setCopiado] = useState(false);

  // Extraer datos calculados
  const {
    varillas = [],
    totalVarillas = 0,
    totalMetrosConsumidos = 0,
    totalMetrosRequeridos = 0,
    totalDesperdicioMm = 0,
    porcentajeAprovechamientoGlobal = 0,
    porcentajeDesperdicioGlobal = 0,
    totalRetazosAprovechablesMm = 0,
    anchoSierraMm = 4,
    longitudVarillaEstandarMm = 6000,
    modoLocal = false,
  } = datosOptimizacion || {};

  // Formateador de medidas según unidad
  const formatMedida = (mm) => {
    const val = Number(mm) || 0;
    if (unidadMedida === 'cm') {
      return `${(val / 10).toFixed(1)} cm`;
    }
    return `${Math.round(val)} mm`;
  };

  // Recopilar lista única de piezas para la leyenda
  const leyendaPiezas = useMemo(() => {
    const mapa = new Map();
    varillas.forEach((v) => {
      (v.segmentos || []).forEach((s) => {
        const clave = `${s.etiqueta}_${s.longitudMm}`;
        if (!mapa.has(clave)) {
          mapa.set(clave, {
            etiqueta: s.etiqueta,
            longitudMm: s.longitudMm,
            color: s.color,
            cantidadTotal: 1,
          });
        } else {
          mapa.get(clave).cantidadTotal += 1;
        }
      });
    });
    return Array.from(mapa.values());
  }, [varillas]);

  // Copiar lista de cortes al portapapeles para el operario
  const handleCopiarCortes = () => {
    if (varillas.length === 0) return;

    let texto = `=== HOJA DE CORTE DE VARILLAS (${(longitudVarillaEstandarMm / 1000).toFixed(2)}m) ===\n`;
    texto += `Total Varillas: ${totalVarillas} | Eficiencia: ${porcentajeAprovechamientoGlobal}% | Merma Disco: ${anchoSierraMm}mm\n\n`;

    varillas.forEach((v) => {
      texto += `VARILLA #${v.numeroVarilla} (${(v.longitudTotalMm / 1000).toFixed(2)}m) - Rendimiento: ${v.porcentajeAprovechamiento}%\n`;
      v.segmentos.forEach((s, idx) => {
        texto += `  [${idx + 1}] ${s.etiqueta}: ${s.longitudMm} mm (De ${s.posicionInicioMm} a ${s.posicionFinMm} mm)\n`;
      });
      texto += `  >> Retazo final: ${v.retazoSobranteMm} mm ${v.esAprovechable ? '(APROVECHABLE)' : '(DESPERDICIO)'}\n\n`;
    });

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  if (!datosOptimizacion || varillas.length === 0) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 p-8 text-center ${className}`}>
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl">
          📏
        </div>
        <h4 className="text-base font-bold text-slate-800">Sin datos de optimización de cortes</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Ingresa las dimensiones del vano o añade cuadros con molduras para calcular el plano de corte lineal de varillas.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Tarjetas de Resumen Ejecutivo y Métricas de Taller */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Varillas Utilizadas */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-2 right-2 text-3xl opacity-15 font-black">🪵</div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
            Varillas Requeridas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold tracking-tight">
              {totalVarillas}
            </span>
            <span className="text-xs text-blue-200 font-medium">
              de {(longitudVarillaEstandarMm / 1000).toFixed(2)} m
            </span>
          </div>
          <p className="text-[11px] text-blue-100/90 mt-2 flex items-center gap-1 font-medium">
            <span>📏 Total consumo:</span>
            <strong>{totalMetrosConsumidos} ml</strong>
          </p>
        </div>

        {/* % de Aprovechamiento / Eficiencia */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Aprovechamiento
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              {porcentajeAprovechamientoGlobal}%
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {porcentajeAprovechamientoGlobal}%
            </span>
            <span className="text-xs text-slate-400 font-medium">útil</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, porcentajeAprovechamientoGlobal)}%` }}
            />
          </div>
        </div>

        {/* % de Desperdicio y Mermas de Disco */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Desperdicio Total
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
              {porcentajeDesperdicioGlobal}%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-rose-600 tracking-tight">
              {(totalDesperdicioMm / 1000).toFixed(2)} m
            </span>
            <span className="text-xs text-slate-400">perdidos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 truncate">
            Merma de disco: <strong>{anchoSierraMm} mm</strong> por corte
          </p>
        </div>

        {/* Retazos Aprovechables */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Retazos Útiles
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
              ≥ 50 cm
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-amber-600 tracking-tight">
              {(totalRetazosAprovechablesMm / 1000).toFixed(2)} m
            </span>
            <span className="text-xs text-slate-400">recuperables</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 truncate">
            Almacenar para trabajos pequeños
          </p>
        </div>
      </div>

      {/* 2. Encabezado de la Sección de Barras con Botón de Copiar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">{titulo}</h3>
              {modoLocal ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  ⚡ Motor FFD Local
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ☁️ Servidor 1D Optimizado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{subtitulo}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiarCortes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Copiar guía de corte al portapapeles"
            >
              {copiado ? (
                <>
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copiar Cortes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. Renderizado de Cada Varilla como Barra Horizontal Proporcional */}
        <div className="space-y-6">
          {varillas.map((varilla) => {
            const largoTotal = varilla.longitudTotalMm || longitudVarillaEstandarMm;
            const pctRetazo = Number(((varilla.retazoSobranteMm / largoTotal) * 100).toFixed(2));

            return (
              <div
                key={`varilla-${varilla.numeroVarilla}`}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all space-y-2.5"
              >
                {/* Cabecera de la Varilla */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-white font-black text-xs">
                      #{varilla.numeroVarilla}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      Varilla de {(largoTotal / 1000).toFixed(2)} m
                    </span>
                    <span className="text-slate-400">
                      ({formatMedida(largoTotal)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                      {varilla.porcentajeAprovechamiento}% aprovechado
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${
                        varilla.esAprovechable
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}
                    >
                      {varilla.esAprovechable ? '♻️ Retazo útil: ' : 'Merma: '}
                      {formatMedida(varilla.retazoSobranteMm)}
                    </span>
                  </div>
                </div>

                {/* BARRA GRÁFICA HORIZONTAL DIVIDIDA */}
                <div className="h-14 sm:h-16 w-full rounded-xl overflow-hidden border border-slate-300 shadow-inner flex relative bg-slate-200 select-none">
                  {/* Segmentos de Cortes */}
                  {varilla.segmentos.map((seg, idx) => {
                    const anchoPct = Number(((seg.longitudMm / largoTotal) * 100).toFixed(3));
                    const colorBg = seg.color?.bg || '#2563eb';
                    const colorText = seg.color?.text || '#ffffff';

                    return (
                      <div
                        key={seg.id || `seg-${idx}`}
                        className="relative group h-full flex flex-col justify-center items-center px-1 border-r-2 border-dashed border-rose-500/80 transition-transform cursor-pointer"
                        style={{
                          width: `${anchoPct}%`,
                          backgroundColor: colorBg,
                          color: colorText,
                        }}
                        onMouseEnter={() => setSegmentoActivo({ ...seg, numVarilla: varilla.numeroVarilla })}
                        onMouseLeave={() => setSegmentoActivo(null)}
                      >
                        {/* Etiqueta visible si hay espacio suficiente */}
                        {anchoPct >= 7 ? (
                          <div className="text-center truncate w-full px-1">
                            <p className="text-[11px] font-bold leading-tight truncate drop-shadow-xs">
                              {seg.etiqueta}
                            </p>
                            <p className="text-[10px] font-medium opacity-90 leading-tight">
                              {formatMedida(seg.longitudMm)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold rotate-90 sm:rotate-0">
                            {formatMedida(seg.longitudMm)}
                          </span>
                        )}

                        {/* Indicador visual de disco de corte / merma al final del segmento */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 bg-rose-500 opacity-80"
                          title={`Merma de disco de sierra: ${anchoSierraMm} mm`}
                        />
                      </div>
                    );
                  })}

                  {/* Segmento Final de Retazo / Sobrante */}
                  {pctRetazo > 0 && (
                    <div
                      className="h-full flex flex-col justify-center items-center px-2 text-slate-600 relative transition-all"
                      style={{
                        width: `${pctRetazo}%`,
                        background:
                          'repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 8px, #e2e8f0 8px, #e2e8f0 16px)',
                      }}
                      title={`Retazo final: ${formatMedida(varilla.retazoSobranteMm)}`}
                    >
                      {pctRetazo >= 8 ? (
                        <div className="text-center font-bold px-1 py-0.5 rounded bg-white/85 shadow-2xs border border-slate-300">
                          <p className="text-[10px] text-slate-700 leading-tight">
                            {varilla.esAprovechable ? '♻️ Retazo Útil' : 'Merma'}
                          </p>
                          <p className="text-[11px] text-slate-900 leading-tight">
                            {formatMedida(varilla.retazoSobranteMm)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-700 bg-white/80 px-0.5 rounded">
                          {formatMedida(varilla.retazoSobranteMm)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Sub-línea con desglose ordenado de cortes para el operario */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 pt-1">
                  <span className="font-semibold text-slate-400">Secuencia de corte:</span>
                  {varilla.segmentos.map((s, i) => (
                    <span
                      key={`seq-${i}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10.5px]"
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: s.color?.bg || '#2563eb' }}
                      />
                      <span className="text-slate-800 font-bold">{s.longitudMm}mm</span>
                      <span className="text-slate-400 text-[9.5px]">({s.etiqueta})</span>
                      {i < varilla.segmentos.length - 1 && (
                        <span className="text-rose-500 font-bold text-[9px]" title="Corte de sierra">
                          +{anchoSierraMm}mm
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tooltip flotante de información técnica al pasar el mouse por un segmento */}
        {segmentoActivo && (
          <div className="mt-4 p-3 bg-slate-900 text-white rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segmentoActivo.color?.bg }}
              />
              <span className="font-bold text-sm text-white">
                {segmentoActivo.etiqueta}
              </span>
              <span className="text-slate-400">
                (Varilla #{segmentoActivo.numVarilla})
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs">
              <div>
                <span className="text-slate-400">Largo de corte: </span>
                <strong className="text-emerald-400">{formatMedida(segmentoActivo.longitudMm)}</strong>
              </div>
              <div>
                <span className="text-slate-400">Posición en barra: </span>
                <strong className="text-sky-300">
                  {segmentoActivo.posicionInicioMm} → {segmentoActivo.posicionFinMm} mm
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* 4. Leyenda de Colores de Piezas y Desglose Cuantitativo */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Leyenda de Piezas y Cantidad Total de Cortes
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
            {leyendaPiezas.map((item, idx) => (
              <div
                key={`leyenda-${idx}`}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80"
              >
                <span
                  className="w-3.5 h-3.5 rounded-md shrink-0 shadow-2xs"
                  style={{ backgroundColor: item.color?.bg || '#2563eb' }}
                />
                <div className="truncate min-w-0">
                  <p className="font-bold text-slate-800 truncate leading-tight">
                    {item.etiqueta}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-tight font-mono">
                    {formatMedida(item.longitudMm)} × <strong>{item.cantidadTotal} und</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
