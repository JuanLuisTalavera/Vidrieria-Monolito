import { useState, useMemo, useRef } from 'react';

// 1. Arreglo de colores pasteles o suaves para diferenciar piezas por medida o tipo
export const PALETA_COLORES_PASTEL = [
  {
    id: 'celeste',
    nombre: 'Azul Celeste',
    fill: 'rgba(186, 230, 253, 0.70)',
    fillHover: 'rgba(125, 211, 252, 0.90)',
    stroke: '#0284c7',
    badgeBg: '#f0f9ff',
    badgeBorder: '#7dd3fc',
    badgeText: '#0369a1',
  },
  {
    id: 'verde-menta',
    nombre: 'Menta Verde',
    fill: 'rgba(167, 243, 208, 0.70)',
    fillHover: 'rgba(110, 231, 183, 0.90)',
    stroke: '#059669',
    badgeBg: '#ecfdf5',
    badgeBorder: '#6ee7b7',
    badgeText: '#065f46',
  },
  {
    id: 'amarillo-suave',
    nombre: 'Amarillo Pastel',
    fill: 'rgba(253, 230, 138, 0.70)',
    fillHover: 'rgba(252, 211, 77, 0.90)',
    stroke: '#d97706',
    badgeBg: '#fffbeb',
    badgeBorder: '#fde68a',
    badgeText: '#92400e',
  },
  {
    id: 'lavanda',
    nombre: 'Lavanda / Violeta',
    fill: 'rgba(221, 214, 254, 0.70)',
    fillHover: 'rgba(196, 181, 253, 0.90)',
    stroke: '#7c3aed',
    badgeBg: '#f5f3ff',
    badgeBorder: '#c4b5fd',
    badgeText: '#5b21b6',
  },
  {
    id: 'melocoton',
    nombre: 'Naranja Melocotón',
    fill: 'rgba(254, 215, 170, 0.70)',
    fillHover: 'rgba(253, 186, 116, 0.90)',
    stroke: '#ea580c',
    badgeBg: '#fff7ed',
    badgeBorder: '#fed7aa',
    badgeText: '#9a3412',
  },
  {
    id: 'rosa-pastel',
    nombre: 'Rosa Pastel',
    fill: 'rgba(251, 207, 232, 0.70)',
    fillHover: 'rgba(249, 168, 212, 0.90)',
    stroke: '#db2777',
    badgeBg: '#fdf2f8',
    badgeBorder: '#fbcfe8',
    badgeText: '#9d174d',
  },
  {
    id: 'turquesa',
    nombre: 'Turquesa',
    fill: 'rgba(153, 246, 228, 0.70)',
    fillHover: 'rgba(94, 234, 212, 0.90)',
    stroke: '#0d9488',
    badgeBg: '#f0fdfa',
    badgeBorder: '#99f6e4',
    badgeText: '#115e59',
  },
  {
    id: 'lima',
    nombre: 'Lima Suave',
    fill: 'rgba(217, 249, 157, 0.70)',
    fillHover: 'rgba(190, 242, 100, 0.90)',
    stroke: '#65a30d',
    badgeBg: '#f7fee7',
    badgeBorder: '#d9f99d',
    badgeText: '#3f6212',
  },
  {
    id: 'indigo-suave',
    nombre: 'Añil Suave',
    fill: 'rgba(199, 210, 254, 0.70)',
    fillHover: 'rgba(165, 180, 252, 0.90)',
    stroke: '#4f46e5',
    badgeBg: '#eef2ff',
    badgeBorder: '#c7d2fe',
    badgeText: '#3730a3',
  },
  {
    id: 'coral',
    nombre: 'Coral',
    fill: 'rgba(254, 205, 211, 0.70)',
    fillHover: 'rgba(253, 164, 175, 0.90)',
    stroke: '#e11d48',
    badgeBg: '#fff1f2',
    badgeBorder: '#fecdd3',
    badgeText: '#9f1239',
  },
];

/**
 * Asigna un color único del arreglo de paleta pastel basado en la medida (ancho y alto)
 * o descripción de la pieza. Todas las piezas con la misma medida compartirán el mismo color.
 */
export const obtenerColorPieza = (pieza, mapaMedidasColores = null) => {
  if (!pieza) return PALETA_COLORES_PASTEL[0];

  const w = Math.round(Number(pieza.anchoMm ?? pieza.ancho ?? 0));
  const h = Math.round(Number(pieza.altoMm ?? pieza.alto ?? 0));
  const minD = Math.min(w, h);
  const maxD = Math.max(w, h);
  const clave = `${minD}x${maxD}`;

  if (mapaMedidasColores && mapaMedidasColores.has(clave)) {
    const idx = mapaMedidasColores.get(clave);
    return PALETA_COLORES_PASTEL[idx % PALETA_COLORES_PASTEL.length];
  }

  let hash = 0;
  for (let i = 0; i < clave.length; i++) {
    hash = (hash * 31 + clave.charCodeAt(i)) % PALETA_COLORES_PASTEL.length;
  }
  return PALETA_COLORES_PASTEL[Math.abs(hash) % PALETA_COLORES_PASTEL.length];
};

/**
 * Diagramador interactivo en SVG para Planchas de Vidrio 2D (Cutting Stock 2D Visualization)
 * Representa la lámina matriz (ej. 2140 × 3210 mm), dibuja piezas útiles con relleno celeste
 * semitransparente, fondo neutro con textura para la merma sobrante, y etiquetas de cotas/medidas centradas.
 */
export default function DiagramaPlanchaVidrioSVG({
  optimizacionVidrio = null,
  titulo = 'Plano de Corte 2D - Plancha de Vidrio',
  subtitulo = 'Distribución y aprovechamiento milimétrico sobre lámina matriz',
  unidadMedida = 'mm', // 'mm' o 'cm'
  className = '',
}) {
  // Estados interactivos
  const [planchaActivaIdx, setPlanchaActivaIdx] = useState(0);
  const [piezaHovered, setPiezaHovered] = useState(null);
  const [piezaSeleccionada, setPiezaSeleccionada] = useState(null);
  const [modoBlueprint, setModoBlueprint] = useState(false);
  const [mostrarCotas, setMostrarCotas] = useState(true);
  const [mostrarCuadricula, setMostrarCuadricula] = useState(true);
  const [copiado, setCopiado] = useState(false);

  // 3. Zoom y Escala interactiva
  const [scale, setScale] = useState(1);
  const scrollContainerRef = useRef(null);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  // Normalización de datos del DTO (soporta plancha única o lista de planchas)
  const planchasList = useMemo(() => {
    if (!optimizacionVidrio) return [];
    if (Array.isArray(optimizacionVidrio.planchas) && optimizacionVidrio.planchas.length > 0) {
      return optimizacionVidrio.planchas;
    }
    // Si el objeto recibido representa directamente una plancha
    return [optimizacionVidrio];
  }, [optimizacionVidrio]);

  // Plancha actualmente visible
  const planchaActual = useMemo(() => {
    if (planchasList.length === 0) return null;
    const idx = Math.min(planchaActivaIdx, planchasList.length - 1);
    return planchasList[idx] || planchasList[0];
  }, [planchasList, planchaActivaIdx]);

  // Extraer y normalizar dimensiones de la plancha actual (ej. 3210 x 2140 mm estándar)
  const anchoPlancha = useMemo(() => {
    const w = Number(
      planchaActual?.anchoPlanchaMm ??
      planchaActual?.anchoPlancha ??
      planchaActual?.ancho ??
      planchaActual?.longitudPlanchaMm ??
      3210
    );
    return Math.max(500, Math.min(8000, w));
  }, [planchaActual]);

  const altoPlancha = useMemo(() => {
    const h = Number(
      planchaActual?.altoPlanchaMm ??
      planchaActual?.altoPlancha ??
      planchaActual?.alto ??
      planchaActual?.alturaPlanchaMm ??
      2140
    );
    return Math.max(500, Math.min(6000, h));
  }, [planchaActual]);

  // Lista normalizada de piezas cortadas
  const piezas = useMemo(() => {
    if (!planchaActual) return [];
    const lista =
      planchaActual.piezas ||
      planchaActual.cortes ||
      planchaActual.piezasCortadas ||
      planchaActual.patronCortes ||
      [];

    return lista.map((p, idx) => {
      const ancho = Number(p.anchoMm ?? p.ancho ?? p.width ?? p.w ?? 0);
      const alto = Number(p.altoMm ?? p.alto ?? p.height ?? p.h ?? 0);
      const x = Number(p.x ?? p.posX ?? p.posicionX ?? 0);
      const y = Number(p.y ?? p.posY ?? p.posicionY ?? 0);
      const id = p.id ?? p.codigo ?? `P-${idx + 1}`;
      const etiqueta = p.etiqueta ?? p.nombre ?? p.descripcion ?? `Pieza #${idx + 1}`;

      return {
        ...p,
        idxOriginal: idx,
        id,
        etiqueta,
        x,
        y,
        ancho,
        alto,
        areaM2: (ancho * alto) / 1_000_000,
      };
    });
  }, [planchaActual]);

  // Mapa de medidas únicas para asignar colores consistentes y diferenciados
  const mapaMedidasColores = useMemo(() => {
    const map = new Map();
    let idx = 0;
    piezas.forEach((p) => {
      const w = Math.round(p.ancho);
      const h = Math.round(p.alto);
      const minD = Math.min(w, h);
      const maxD = Math.max(w, h);
      const key = `${minD}x${maxD}`;
      if (!map.has(key)) {
        map.set(key, idx++);
      }
    });
    return map;
  }, [piezas]);

  // Métricas calculadas para la plancha activa
  const metricas = useMemo(() => {
    const areaTotalM2 = (anchoPlancha * altoPlancha) / 1_000_000;
    const areaUtilM2 = piezas.reduce((acc, p) => acc + p.areaM2, 0);
    const areaSobranteM2 = Math.max(0, areaTotalM2 - areaUtilM2);

    const porcentajeUtil = areaTotalM2 > 0
      ? Number(((areaUtilM2 / areaTotalM2) * 100).toFixed(1))
      : 0;
    const porcentajeSobrante = Number((100 - porcentajeUtil).toFixed(1));

    return {
      areaTotalM2: Number(areaTotalM2.toFixed(2)),
      areaUtilM2: Number(areaUtilM2.toFixed(2)),
      areaSobranteM2: Number(areaSobranteM2.toFixed(2)),
      areaDesperdicioM2: Number(areaSobranteM2.toFixed(2)),
      porcentajeUtil,
      porcentajeSobrante,
      porcentajeDesperdicio: porcentajeSobrante,
      totalPiezas: piezas.length,
      espesorMm: planchaActual?.espesorMm ?? optimizacionVidrio?.espesorMm ?? 6,
      tipoVidrio: planchaActual?.tipoVidrio ?? optimizacionVidrio?.tipoVidrio ?? 'Cristal Incoloro',
    };
  }, [anchoPlancha, altoPlancha, piezas, planchaActual, optimizacionVidrio]);

  // Formateador de medidas según unidad
  const formatMedida = (mm) => {
    const val = Number(mm) || 0;
    if (unidadMedida === 'cm') {
      return `${(val / 10).toFixed(1)} cm`;
    }
    return `${Math.round(val)} mm`;
  };

  // ViewBox dinámico con márgenes técnicos perimétricos para cotas y ejes
  const margenIzq = mostrarCotas ? 140 : 40;
  const margenArriba = mostrarCotas ? 100 : 40;
  const margenDer = 60;
  const margenAbajo = 60;

  const vbX = -margenIzq;
  const vbY = -margenArriba;
  const vbWidth = anchoPlancha + margenIzq + margenDer;
  const vbHeight = altoPlancha + margenArriba + margenAbajo;

  // Paleta de estilos según modo Blueprint o Taller
  const tema = useMemo(() => {
    if (modoBlueprint) {
      return {
        bgContenedor: 'bg-slate-950',
        bgCanvas: '#090d16',
        planchaFondo: '#0f172a',
        planchaBorde: '#38bdf8',
        mermaTrama: '#1e293b',
        piezaFill: 'rgba(14, 165, 233, 0.40)',
        piezaStroke: '#38bdf8',
        piezaHoverFill: 'rgba(56, 189, 248, 0.65)',
        piezaHoverStroke: '#7dd3fc',
        piezaActivaStroke: '#f59e0b',
        cotaLinea: '#38bdf8',
        cotaTexto: '#7dd3fc',
        textoPieza: '#ffffff',
        textoBadgeBg: 'rgba(15, 23, 42, 0.85)',
        textoBadgeStroke: '#38bdf8',
        ejeColor: '#0284c7',
      };
    }
    return {
      bgContenedor: 'bg-white',
      bgCanvas: '#f8fafc',
      // Fondo neutro para merma con borde nítido
      planchaFondo: '#e2e8f0',
      planchaBorde: '#64748b',
      mermaTrama: '#cbd5e1',
      // Relleno semitransparente celeste con bordes marcados para piezas útiles
      piezaFill: 'rgba(56, 189, 248, 0.45)',
      piezaStroke: '#0284c7',
      piezaHoverFill: 'rgba(14, 165, 233, 0.65)',
      piezaHoverStroke: '#0369a1',
      piezaActivaStroke: '#d97706',
      cotaLinea: '#475569',
      cotaTexto: '#1e293b',
      textoPieza: '#0f172a',
      textoBadgeBg: 'rgba(255, 255, 255, 0.92)',
      textoBadgeStroke: '#bae6fd',
      ejeColor: '#64748b',
    };
  }, [modoBlueprint]);

  // Copiar hoja de corte de vidrio al portapapeles
  const handleCopiarCortes = () => {
    if (piezas.length === 0) return;

    let texto = `=== HOJA DE CORTE 2D - PLANCHA DE VIDRIO ===\n`;
    texto += `Plancha: ${anchoPlancha} x ${altoPlancha} mm (${metricas.areaTotalM2} m²) | Tipo: ${metricas.tipoVidrio} ${metricas.espesorMm}mm\n`;
    texto += `Aprovechamiento: ${metricas.porcentajeUtil}% útil (${metricas.areaUtilM2} m²) | Área de Retazo / Sobrante: ${metricas.porcentajeSobrante}% (${metricas.areaSobranteM2} m²)\n`;
    texto += `Total Piezas: ${piezas.length} cortes\n\n`;
    texto += `No. | Etiqueta | Medida (Ancho x Alto) | Posición (X, Y) | Área (m²)\n`;
    texto += `------------------------------------------------------------------\n`;

    piezas.forEach((p, idx) => {
      texto += `[${idx + 1}] ${p.etiqueta} : ${Math.round(p.ancho)} x ${Math.round(p.alto)} mm | X=${Math.round(p.x)}, Y=${Math.round(p.y)} | ${p.areaM2.toFixed(3)} m²\n`;
    });

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  // Renderizado en caso de no contar con datos
  if (!optimizacionVidrio && piezas.length === 0) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs ${className}`}>
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-3xl">
          🪟
        </div>
        <h4 className="text-base font-bold text-slate-800">Plano de corte no generado</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Ingresa las medidas y presiona Optimizar para generar el plano de corte.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-colors ${tema.bgContenedor} ${className}`}>
      {/* ======================================================== */}
      {/* 1. BARRA SUPERIOR DE HERRAMIENTAS Y CONTROLES            */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-sky-100 text-sky-700 text-base font-bold shadow-2xs">
              🪟
            </span>
            <h3 className="text-base font-bold text-slate-800">{titulo}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              Corte 2D
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitulo}</p>
        </div>

        {/* Botones de acción y visualización */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de planchas si hay múltiples */}
          {planchasList.length > 1 && (
            <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5 text-xs font-semibold">
              {planchasList.map((_, i) => (
                <button
                  key={`plancha-tab-${i}`}
                  type="button"
                  onClick={() => setPlanchaActivaIdx(i)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    planchaActivaIdx === i
                      ? 'bg-white text-slate-800 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Plancha {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* Toggle Cotas */}
          <button
            type="button"
            onClick={() => setMostrarCotas(!mostrarCotas)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              mostrarCotas
                ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Mostrar u ocultar cotas exteriores"
          >
            📏 Cotas
          </button>

          {/* Toggle Cuadrícula */}
          <button
            type="button"
            onClick={() => setMostrarCuadricula(!mostrarCuadricula)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              mostrarCuadricula
                ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Mostrar u ocultar cuadrícula milimétrica"
          >
            ▦ Grilla
          </button>

          {/* Toggle Blueprint */}
          <button
            type="button"
            onClick={() => setModoBlueprint(!modoBlueprint)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              modoBlueprint
                ? 'bg-slate-900 text-sky-300 border-sky-500 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Alternar entre modo Taller y modo Blueprint técnico"
          >
            {modoBlueprint ? '🌌 Blueprint' : '📐 Taller'}
          </button>

          {/* Botón Copiar Hoja de Cortes */}
          <button
            type="button"
            onClick={handleCopiarCortes}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Copiar lista de cortes al portapapeles"
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

      {/* ======================================================== */}
      {/* 2. TARJETAS DE MÉTRICAS Y APROVECHAMIENTO EJECUTIVO      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50/30 border-b border-slate-100">
        {/* Plancha Base */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Plancha Matriz
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
              {metricas.espesorMm} mm
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">
              {formatMedida(anchoPlancha)} × {formatMedida(altoPlancha)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            Área total: <strong>{metricas.areaTotalM2} m²</strong>
          </p>
        </div>

        {/* Rendimiento / Aprovechamiento Útil */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Aprovechamiento
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              {metricas.porcentajeUtil}%
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-emerald-600 tracking-tight">
              {metricas.areaUtilM2} m²
            </span>
            <span className="text-xs text-slate-400 font-medium">útiles</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metricas.porcentajeUtil)}%` }}
            />
          </div>
        </div>

        {/* Área de Retazo / Sobrante */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Retazo / Sobrante
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
              {metricas.porcentajeSobrante}%
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-amber-600 tracking-tight">
              {metricas.areaSobranteM2} m²
            </span>
            <span className="text-xs text-slate-400 font-medium">disponible</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            Área de Retazo / Sobrante
          </p>
        </div>

        {/* Total Piezas Cortadas */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Piezas Útiles
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 font-bold">
              {planchasList.length > 1 ? `Plancha ${planchaActivaIdx + 1}/${planchasList.length}` : '1 Plancha'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-extrabold text-sky-700 tracking-tight">
              {metricas.totalPiezas}
            </span>
            <span className="text-xs text-slate-500 font-medium">cortes programados</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            Cristal: <strong>{metricas.tipoVidrio}</strong>
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. LIENZO SVG RESPONSIVO Y MILIMÉTRICO (CON ZOOM Y PANEO)*/}
      {/* ======================================================== */}
      <div className="relative w-full border-y border-slate-100 bg-slate-50/40 overflow-hidden">
        {/* Controles Flotantes de Zoom [ - ] [ 100% ] [ + ] */}
        <div className="absolute top-3 right-3 z-20 flex items-center shadow-md rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200 p-1">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm disabled:opacity-30 transition-colors cursor-pointer"
            title="Reducir Zoom (-)"
          >
            −
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2.5 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-colors cursor-pointer font-mono"
            title="Restablecer tamaño normal (100%)"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm disabled:opacity-30 transition-colors cursor-pointer"
            title="Aumentar Zoom (+)"
          >
            +
          </button>
        </div>

        {/* Contenedor principal con scroll nativo al hacer zoom */}
        <div
          ref={scrollContainerRef}
          className="w-full max-h-[640px] overflow-auto p-4 sm:p-6 flex items-center justify-center"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div
            style={{
              width: `${scale * 100}%`,
              minWidth: `${scale * 100}%`,
              transition: 'width 0.2s ease-out, min-width 0.2s ease-out',
            }}
            className="flex items-center justify-center"
          >
            <svg
              viewBox={`${vbX} ${vbY} ${vbWidth} ${vbHeight}`}
              className="w-full h-auto select-none filter drop-shadow-sm transition-all"
              preserveAspectRatio="xMidYMid meet"
              style={{ background: tema.bgCanvas, borderRadius: '1rem' }}
            >
          {/* DEFINICIONES TÉCNICAS: Tramas, Gradientes, Flechas de Cotas */}
          <defs>
            {/* Trama rayada para representar merma/scrap en el fondo */}
            <pattern
              id="mermaPattern"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="40"
                stroke={tema.mermaTrama}
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
            </pattern>

            {/* Cuadrícula milimétrica de referencia */}
            <pattern
              id="gridMilimetrico"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <rect width="100" height="100" fill="none" stroke={tema.mermaTrama} strokeWidth="0.5" strokeOpacity="0.4" />
              <line x1="0" y1="0" x2="100" y2="0" stroke={tema.mermaTrama} strokeWidth="0.8" strokeOpacity="0.6" />
              <line x1="0" y1="0" x2="0" y2="100" stroke={tema.mermaTrama} strokeWidth="0.8" strokeOpacity="0.6" />
            </pattern>

            {/* Gradiente sutil de reflejo vítreo para piezas útiles */}
            <linearGradient id="vidrioReflejo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.15" />
            </linearGradient>

            {/* Marcadores de flechas para las cotas exteriores */}
            <marker
              id="arrowStart"
              viewBox="0 0 10 10"
              refX="1"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 10 0 L 0 5 L 10 10 z" fill={tema.cotaLinea} />
            </marker>
            <marker
              id="arrowEnd"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={tema.cotaLinea} />
            </marker>

            {/* Filtro de realce para pieza seleccionada o en hover */}
            <filter id="glowPieza" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0284c7" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* ======================================================== */}
          {/* A. PLANCHA DE VIDRIO ORIGINAL (Fondo Neutro = Merma)     */}
          {/* ======================================================== */}
          <g id="plancha-base">
            {/* Rectángulo sólido base neutro */}
            <rect
              x={0}
              y={0}
              width={anchoPlancha}
              height={altoPlancha}
              fill={tema.planchaFondo}
              stroke={tema.planchaBorde}
              strokeWidth="2.5"
              rx="4"
            />

            {/* Trama diagonal superpuesta para denotar superficie de merma sobrante */}
            <rect
              x={0}
              y={0}
              width={anchoPlancha}
              height={altoPlancha}
              fill="url(#mermaPattern)"
              opacity="0.75"
              rx="4"
            />

            {/* Cuadrícula milimétrica opcional */}
            {mostrarCuadricula && (
              <rect
                x={0}
                y={0}
                width={anchoPlancha}
                height={altoPlancha}
                fill="url(#gridMilimetrico)"
                opacity="0.5"
              />
            )}

            {/* Indicador de Origen de Coordenadas (0,0) */}
            <g id="origen-cero" transform="translate(0, 0)">
              <circle cx={0} cy={0} r={5} fill="#ef4444" />
              <circle cx={0} cy={0} r={10} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />
              <text
                x={14}
                y={-8}
                fill={tema.ejeColor}
                fontSize="24"
                fontWeight="bold"
                fontFamily="monospace"
              >
                (0, 0) Origen
              </text>
              {/* Flechas directrices de ejes X e Y */}
              <line x1={0} y1={-25} x2={140} y2={-25} stroke={tema.ejeColor} strokeWidth="2" markerEnd="url(#arrowEnd)" />
              <text x={150} y={-20} fill={tema.ejeColor} fontSize="20" fontWeight="bold">+X</text>
              <line x1={-25} y1={0} x2={-25} y2={140} stroke={tema.ejeColor} strokeWidth="2" markerEnd="url(#arrowEnd)" />
              <text x={-45} y={150} fill={tema.ejeColor} fontSize="20" fontWeight="bold">+Y</text>
            </g>
          </g>

          {/* ======================================================== */}
          {/* B. PIEZAS ÚTILES CORTADAS (Iteración dinámica)          */}
          {/* ======================================================== */}
          <g id="piezas-utiles">
            {piezas.map((pieza, index) => {
              const isHovered = piezaHovered?.id === pieza.id;
              const isSelected = piezaSeleccionada?.id === pieza.id;
              const colorPieza = obtenerColorPieza(pieza, mapaMedidasColores);

              // Centro geométrico para el texto
              const cx = pieza.x + pieza.ancho / 2;
              const cy = pieza.y + pieza.alto / 2;

              // Dimensión menor de la pieza para cálculos de legibilidad
              const dimensionMenor = Math.min(pieza.ancho, pieza.alto);

              // Aumentar significativamente el fontSize de forma adaptativa y armónica
              let fontSizeMedida = Math.round(Math.min(
                dimensionMenor * 0.16,      // Aumentado respecto al anterior 0.08
                (pieza.ancho * 0.85) / 6.5,  // Asegura que no desborde el ancho disponible
                pieza.alto * 0.40           // Asegura que no desborde el alto disponible
              ));

              // Acotamos el tamaño entre un mínimo legible de 22mm y un máximo de 84mm
              fontSizeMedida = Math.max(22, Math.min(84, fontSizeMedida));

              // Si la pieza es muy estrecha o pequeña para alojar texto legible, se oculta para no desbordar
              const textoDesborda = pieza.ancho < 150 || pieza.alto < 90 || (pieza.ancho < fontSizeMedida * 5.2);
              const showTexto = !textoDesborda;

              // Etiqueta secundaria (nombre) si hay suficiente espacio vertical y horizontal
              const showEtiqueta = showTexto && pieza.alto >= 190 && pieza.ancho >= 230 && Boolean(pieza.etiqueta);
              const fontSizeEtiqueta = Math.max(16, Math.min(48, Math.round(fontSizeMedida * 0.65)));

              // Medidas del badge de fondo para alto contraste
              const textoMedidaStr = `${Math.round(pieza.ancho)} × ${Math.round(pieza.alto)} mm`;
              const anchoTextoAprox = textoMedidaStr.length * fontSizeMedida * 0.62;
              const anchoEtiquetaAprox = (pieza.etiqueta ? String(pieza.etiqueta).length : 0) * fontSizeEtiqueta * 0.62;
              const badgeWidth = Math.min(
                pieza.ancho * 0.94,
                Math.max(anchoTextoAprox, showEtiqueta ? anchoEtiquetaAprox : 0) + 24
              );
              const badgeHeight = showEtiqueta
                ? fontSizeEtiqueta + fontSizeMedida + 20
                : fontSizeMedida * 1.5;

              // Colores según modo Blueprint o Paleta Pastel
              const fillPieza = isSelected
                ? 'rgba(245, 158, 11, 0.55)'
                : isHovered
                ? (modoBlueprint ? 'rgba(56, 189, 248, 0.65)' : colorPieza.fillHover)
                : (modoBlueprint ? 'rgba(14, 165, 233, 0.40)' : colorPieza.fill);

              const strokePieza = isSelected
                ? tema.piezaActivaStroke
                : isHovered
                ? (modoBlueprint ? tema.piezaHoverStroke : colorPieza.stroke)
                : (modoBlueprint ? tema.piezaStroke : colorPieza.stroke);

              return (
                <g
                  key={`pieza-${pieza.id || index}`}
                  id={`corte-${pieza.id}`}
                  className="cursor-pointer transition-all duration-150"
                  filter={isHovered || isSelected ? 'url(#glowPieza)' : undefined}
                  onMouseEnter={() => setPiezaHovered(pieza)}
                  onMouseLeave={() => setPiezaHovered(null)}
                  onClick={() => setPiezaSeleccionada(isSelected ? null : pieza)}
                >
                  {/* Rectángulo de la Pieza Útil con color pastel asignado */}
                  <rect
                    x={pieza.x}
                    y={pieza.y}
                    width={pieza.ancho}
                    height={pieza.alto}
                    fill={fillPieza}
                    stroke={strokePieza}
                    strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                    rx="0"
                  />

                  {/* Reflejo vítreo decorativo */}
                  <rect
                    x={pieza.x}
                    y={pieza.y}
                    width={pieza.ancho}
                    height={pieza.alto}
                    fill="url(#vidrioReflejo)"
                    pointerEvents="none"
                    rx="0"
                  />

                  {/* Línea de corte diagonal indicativa de brillo en esquinas */}
                  {pieza.ancho > 180 && pieza.alto > 180 && (
                    <line
                      x1={pieza.x + 10}
                      y1={pieza.y + 10}
                      x2={pieza.x + Math.min(60, pieza.ancho * 0.25)}
                      y2={pieza.y + 10}
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeOpacity="0.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Etiqueta de Texto Centrada con Medida y Nombre */}
                  {showTexto && (
                    <g transform={`translate(${cx}, ${cy})`} pointerEvents="none">
                      {/* Badge de fondo de alto contraste que resalta contra el cristal */}
                      <rect
                        x={-badgeWidth / 2}
                        y={-badgeHeight / 2}
                        width={badgeWidth}
                        height={badgeHeight}
                        fill={modoBlueprint ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)'}
                        stroke={modoBlueprint ? colorPieza.stroke : colorPieza.badgeBorder}
                        strokeWidth="1.5"
                        rx="8"
                      />

                      {/* Nombre/Etiqueta de la pieza (si hay espacio vertical) */}
                      {showEtiqueta && (
                        <text
                          x={0}
                          y={-badgeHeight / 2 + fontSizeEtiqueta * 0.75 + 4}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={modoBlueprint ? '#38bdf8' : colorPieza.badgeText}
                          fontSize={fontSizeEtiqueta}
                          fontWeight="bold"
                          fontFamily="system-ui, -apple-system, sans-serif"
                        >
                          {pieza.etiqueta}
                        </text>
                      )}

                      {/* Medida: Ancho × Alto en mm */}
                      <text
                        x={0}
                        y={showEtiqueta ? badgeHeight / 2 - fontSizeMedida * 0.7 - 2 : 0}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={modoBlueprint ? '#ffffff' : '#0f172a'}
                        fontSize={fontSizeMedida}
                        fontWeight="bold"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        {textoMedidaStr}
                      </text>
                    </g>
                  )}

                  {/* Coordenada de origen de la pieza en su esquina superior izquierda */}
                  {(isHovered || isSelected || (pieza.ancho > 400 && pieza.alto > 300)) && (
                    <text
                      x={pieza.x + 10}
                      y={pieza.y + 24}
                      fill={modoBlueprint ? '#38bdf8' : colorPieza.badgeText}
                      fontSize={Math.max(14, Math.min(22, Math.round(fontSizeMedida * 0.32)))}
                      fontWeight="bold"
                      fontFamily="monospace"
                      pointerEvents="none"
                    >
                      X:{Math.round(pieza.x)} Y:{Math.round(pieza.y)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* ======================================================== */}
          {/* C. COTAS PERIMÉTRICAS EXTERIORES DE LA PLANCHA           */}
          {/* ======================================================== */}
          {mostrarCotas && (
            <g id="cotas-exteriores">
              {/* Cota Horizontal Superior (Ancho Plancha) */}
              <g id="cota-ancho">
                {/* Líneas auxiliares de referencia vertical */}
                <line
                  x1={0}
                  y1={-10}
                  x2={0}
                  y2={-65}
                  stroke={tema.cotaLinea}
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <line
                  x1={anchoPlancha}
                  y1={-10}
                  x2={anchoPlancha}
                  y2={-65}
                  stroke={tema.cotaLinea}
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                {/* Línea de cota principal con flechas */}
                <line
                  x1={0}
                  y1={-55}
                  x2={anchoPlancha}
                  y2={-55}
                  stroke={tema.cotaLinea}
                  strokeWidth="2"
                  markerStart="url(#arrowStart)"
                  markerEnd="url(#arrowEnd)"
                />
                {/* Texto de medida total superior */}
                <rect
                  x={anchoPlancha / 2 - 90}
                  y={-78}
                  width="180"
                  height="34"
                  fill={tema.bgCanvas}
                  rx="6"
                />
                <text
                  x={anchoPlancha / 2}
                  y={-55}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={tema.cotaTexto}
                  fontSize="24"
                  fontWeight="bold"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {formatMedida(anchoPlancha)}
                </text>
              </g>

              {/* Cota Vertical Izquierda (Alto Plancha) */}
              <g id="cota-alto">
                {/* Líneas auxiliares de referencia horizontal */}
                <line
                  x1={-10}
                  y1={0}
                  x2={-85}
                  y2={0}
                  stroke={tema.cotaLinea}
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <line
                  x1={-10}
                  y1={altoPlancha}
                  x2={-85}
                  y2={altoPlancha}
                  stroke={tema.cotaLinea}
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                {/* Línea de cota vertical con flechas */}
                <line
                  x1={-75}
                  y1={0}
                  x2={-75}
                  y2={altoPlancha}
                  stroke={tema.cotaLinea}
                  strokeWidth="2"
                  markerStart="url(#arrowStart)"
                  markerEnd="url(#arrowEnd)"
                />
                {/* Texto de medida total lateral */}
                <g transform={`translate(-85, ${altoPlancha / 2}) rotate(-90)`}>
                  <rect
                    x={-90}
                    y={-17}
                    width="180"
                    height="34"
                    fill={tema.bgCanvas}
                    rx="6"
                  />
                  <text
                    x={0}
                    y={0}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={tema.cotaTexto}
                    fontSize="24"
                    fontWeight="bold"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {formatMedida(altoPlancha)}
                  </text>
                </g>
              </g>
            </g>
          )}
        </svg>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. PANEL INFERIOR: INSPECTOR DE PIEZA Y LEYENDA TÉCNICA   */}
      {/* ======================================================== */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        {/* Inspección en tiempo real de la pieza en foco */}
        <div className="flex-1 w-full sm:w-auto">
          {piezaHovered || piezaSeleccionada ? (
            (() => {
              const p = piezaSeleccionada || piezaHovered;
              return (
                <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-xl bg-white border border-sky-200 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                    <strong className="text-slate-800 text-sm">{p.etiqueta}</strong>
                    <span className="text-[11px] font-mono text-slate-400">({p.id})</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <span>
                      Medida: <strong className="text-slate-900">{Math.round(p.ancho)} × {Math.round(p.alto)} mm</strong>
                    </span>
                    <span>
                      Posición: <strong className="text-slate-900">X: {Math.round(p.x)} mm, Y: {Math.round(p.y)} mm</strong>
                    </span>
                    <span>
                      Área: <strong className="text-slate-900">{p.areaM2.toFixed(3)} m²</strong>
                    </span>
                    <span className="text-slate-400">
                      ({((p.areaM2 / metricas.areaTotalM2) * 100).toFixed(1)}% de la plancha)
                    </span>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-slate-400 flex items-center gap-1.5 py-1">
              <span>💡</span>
              <span>Pasa el cursor o haz clic sobre cualquier pieza para ver sus coordenadas exactas de corte.</span>
            </div>
          )}
        </div>

        {/* Leyenda Gráfica de Taller */}
        <div className="flex items-center gap-4 text-[11px] text-slate-600 shrink-0">
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-4 rounded border"
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.45)',
                borderColor: '#0284c7',
              }}
            />
            <span className="font-semibold text-slate-700">Pieza Útil</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-4 rounded border relative overflow-hidden"
              style={{
                backgroundColor: '#e2e8f0',
                borderColor: '#94a3b8',
              }}
            >
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:4px_4px]" />
            </span>
            <span className="font-semibold text-slate-700">Retazo / Sobrante</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="font-semibold text-slate-700">Origen (0,0)</span>
          </div>
        </div>

        {/* Leyenda de Colores por Medida de Pieza */}
        {mapaMedidasColores.size > 0 && (
          <div className="w-full pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Colores por medida:
            </span>
            {Array.from(mapaMedidasColores.entries()).map(([claveMedida, idx]) => {
              const color = PALETA_COLORES_PASTEL[idx % PALETA_COLORES_PASTEL.length];
              const cant = piezas.filter((p) => {
                const minD = Math.min(Math.round(p.ancho), Math.round(p.alto));
                const maxD = Math.max(Math.round(p.ancho), Math.round(p.alto));
                return `${minD}x${maxD}` === claveMedida;
              }).length;

              return (
                <span
                  key={`leyenda-${claveMedida}`}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold"
                  style={{
                    backgroundColor: color.badgeBg,
                    borderColor: color.stroke,
                    color: color.badgeText,
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-xs border"
                    style={{ backgroundColor: color.fill, borderColor: color.stroke }}
                  />
                  <span>{claveMedida.replace('x', ' × ')} mm</span>
                  <span className="font-mono text-[10px] opacity-75">({cant})</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
