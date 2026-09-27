import { useState, useMemo } from 'react';
import { COLORES_ALUMINIO } from '../../utils/despieceObrasHelper';

/**
 * Diagramador interactivo en SVG para Ventanas y Mamparas
 * Renderizado milimétrico a escala con cotas, perfiles perimétricos, traslape y reflectividad.
 */
export default function DiagramaVanoSVG({
  anchoMm = 1500,
  altoMm = 1200,
  tipoEstructura = 'VENTANA_SERIE_20_2H',
  colorAluminio = 'negro',
  configuracionApertura = 'OX', // 'OX': Fijo + Corredizo, 'XX': Dos corredizos
  tipoCristalNombre = 'Cristal Incoloro 6mm',
  className = '',
}) {
  const [hoveredPart, setHoveredPart] = useState(null);
  const [modoBlueprint, setModoBlueprint] = useState(false);
  const [mostrarSubcotas, setMostrarSubcotas] = useState(true);

  // Normalizar medidas numéricas
  const ancho = Math.max(300, Math.min(6000, Number(anchoMm) || 1500));
  const alto = Math.max(300, Math.min(4000, Number(altoMm) || 1200));

  const colorConfig = useMemo(() => {
    return COLORES_ALUMINIO.find((c) => c.id === colorAluminio) || COLORES_ALUMINIO[0];
  }, [colorAluminio]);

  // Dimensiones paramétricas de perfiles en mm
  const grosorMarcoExt = 40; // Ancho visual del perfil perimétrico (Riel, Cabezal, Jambas)
  const grosorHoja = 35; // Ancho visual del perfil de hoja (Zócalo, Cabezal de hoja, Parante)
  const anchoTraslape = 40; // Ancho del traslape central

  // Coordenadas y cálculos de hojas
  const esDobleHoja = tipoEstructura.includes('2H');
  const esFijoSolo = tipoEstructura === 'FIJO_PANAL';
  const esProyectante = tipoEstructura === 'VENTANA_PROYECTANTE';

  // Ancho de cada hoja con traslape
  const anchoHoja = esDobleHoja
    ? Math.round((ancho - grosorMarcoExt * 2 + anchoTraslape) / 2)
    : ancho - grosorMarcoExt * 2;

  // ViewBox dinámico con márgenes técnicos para cotas
  const margenIzq = 140; // Espacio para cota vertical izquierda
  const margenArriba = 110; // Espacio para cota horizontal superior
  const margenDer = 70;
  const margenAbajo = mostrarSubcotas && esDobleHoja ? 120 : 80; // Espacio para sub-cotas inferiores

  const vbX = -margenIzq;
  const vbY = -margenArriba;
  const vbWidth = ancho + margenIzq + margenDer;
  const vbHeight = alto + margenArriba + margenAbajo;

  // Estilos según modo Blueprint o Taller
  const bgCanvas = modoBlueprint ? '#0f172a' : '#f8fafc';
  const colorCota = modoBlueprint ? '#38bdf8' : '#334155';
  const colorCotaText = modoBlueprint ? '#7dd3fc' : '#1e293b';
  const colorVidrioFill = modoBlueprint
    ? 'rgba(14, 165, 233, 0.15)'
    : tipoCristalNombre.toLowerCase().includes('bronce')
    ? 'rgba(180, 83, 9, 0.22)'
    : tipoCristalNombre.toLowerCase().includes('humo') || tipoCristalNombre.toLowerCase().includes('gris')
    ? 'rgba(71, 85, 105, 0.28)'
    : 'rgba(186, 230, 253, 0.40)';

  const perfilFill = modoBlueprint ? '#1e293b' : colorConfig.hex;
  const perfilStroke = modoBlueprint ? '#38bdf8' : colorConfig.borderHex;

  return (
    <div className={`relative flex flex-col items-center bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden ${className}`}>
      {/* Barra de herramientas superior del diagrama */}
      <div className="w-full flex items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs">
            📐
          </span>
          <div>
            <span className="font-bold text-slate-800">
              {ancho} × {alto} mm
            </span>
            <span className="text-slate-400 ml-1.5 hidden sm:inline">
              ({(ancho / 10).toFixed(1)} × {(alto / 10).toFixed(1)} cm)
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[11px] border border-slate-200">
            {colorConfig.nombre}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMostrarSubcotas(!mostrarSubcotas)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              mostrarSubcotas
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title="Mostrar / Ocultar cotas de hojas individuales"
          >
            Sub-cotas
          </button>
          <button
            type="button"
            onClick={() => setModoBlueprint(!modoBlueprint)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              modoBlueprint
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Alternar entre modo realista de taller y plano técnico azul"
          >
            {modoBlueprint ? 'Modo Plano 📐' : 'Modo Taller 🛠️'}
          </button>
        </div>
      </div>

      {/* Visor SVG responsivo */}
      <div className="w-full flex-1 flex items-center justify-center relative min-h-[360px] sm:min-h-[440px]">
        <svg
          viewBox={`${vbX} ${vbY} ${vbWidth} ${vbHeight}`}
          className="w-full h-full max-h-[540px] select-none transition-all duration-300"
          style={{ background: bgCanvas }}
        >
          <defs>
            {/* Cuadrícula técnica para modo Blueprint */}
            <pattern id="gridBlueprint" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#0f172a" strokeWidth="0.4" />
            </pattern>

            {/* Marcadores de flechas para cotas acotadas */}
            <marker id="arrowStart" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 8 1 L 2 5 L 8 9" fill="none" stroke={colorCota} strokeWidth="1.5" strokeLinecap="round" />
            </marker>
            <marker id="arrowEnd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 2 1 L 8 5 L 2 9" fill="none" stroke={colorCota} strokeWidth="1.5" strokeLinecap="round" />
            </marker>

            {/* Sombra para traslape de hojas */}
            <filter id="traslapeShadow" x="-10%" y="-10%" width="130%" height="120%">
              <feDropShadow dx="-4" dy="0" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
            </filter>
            <filter id="marcoShadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Cuadrícula si está en modo blueprint */}
          {modoBlueprint && (
            <rect x={vbX} y={vbY} width={vbWidth} height={vbHeight} fill="url(#gridBlueprint)" />
          )}

          {/* Sombra o vano en la pared */}
          <rect
            x={0}
            y={0}
            width={ancho}
            height={alto}
            fill={modoBlueprint ? '#020617' : '#e2e8f0'}
            stroke={modoBlueprint ? '#334155' : '#cbd5e1'}
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          {/* ======================================================== */}
          {/* 1. MARCO PERIMÉTRICO EXTERIOR (Jambas, Riel, Cabezal)   */}
          {/* ======================================================== */}
          <g filter="url(#marcoShadow)">
            {/* Cabezal Superior */}
            <rect
              x={0}
              y={0}
              width={ancho}
              height={grosorMarcoExt}
              fill={hoveredPart === 'cabezal-ext' ? '#3b82f6' : perfilFill}
              stroke={perfilStroke}
              strokeWidth="1.5"
              className="cursor-pointer transition-colors"
              onMouseEnter={() => setHoveredPart('cabezal-ext')}
              onMouseLeave={() => setHoveredPart(null)}
            />
            {/* Riel Inferior con detalle de canaleta */}
            <rect
              x={0}
              y={alto - grosorMarcoExt}
              width={ancho}
              height={grosorMarcoExt}
              fill={hoveredPart === 'riel-ext' ? '#3b82f6' : perfilFill}
              stroke={perfilStroke}
              strokeWidth="1.5"
              className="cursor-pointer transition-colors"
              onMouseEnter={() => setHoveredPart('riel-ext')}
              onMouseLeave={() => setHoveredPart(null)}
            />
            {/* Línea divisoria en riel para emular pistas de rodadura */}
            <line
              x1={grosorMarcoExt}
              y1={alto - grosorMarcoExt / 2}
              x2={ancho - grosorMarcoExt}
              y2={alto - grosorMarcoExt / 2}
              stroke={modoBlueprint ? '#38bdf8' : colorConfig.accentHex}
              strokeWidth="1"
              strokeDasharray="4 3"
            />

            {/* Jamba Lateral Izquierda */}
            <rect
              x={0}
              y={grosorMarcoExt}
              width={grosorMarcoExt}
              height={alto - grosorMarcoExt * 2}
              fill={hoveredPart === 'jamba-izq' ? '#3b82f6' : perfilFill}
              stroke={perfilStroke}
              strokeWidth="1.5"
              className="cursor-pointer transition-colors"
              onMouseEnter={() => setHoveredPart('jamba-izq')}
              onMouseLeave={() => setHoveredPart(null)}
            />
            {/* Jamba Lateral Derecha */}
            <rect
              x={ancho - grosorMarcoExt}
              y={grosorMarcoExt}
              width={grosorMarcoExt}
              height={alto - grosorMarcoExt * 2}
              fill={hoveredPart === 'jamba-der' ? '#3b82f6' : perfilFill}
              stroke={perfilStroke}
              strokeWidth="1.5"
              className="cursor-pointer transition-colors"
              onMouseEnter={() => setHoveredPart('jamba-der')}
              onMouseLeave={() => setHoveredPart(null)}
            />
          </g>

          {/* ======================================================== */}
          {/* 2. HOJAS INTERIORES Y TRASLAPE CENTRAL                   */}
          {/* ======================================================== */}
          {esDobleHoja && (
            <>
              {/* HOJA 1 (IZQUIERDA - Trasera / Fija o Corrediza) */}
              <g id="hoja-izquierda">
                {/* Marco de Hoja Izquierda */}
                <rect
                  x={grosorMarcoExt}
                  y={grosorMarcoExt}
                  width={anchoHoja}
                  height={alto - grosorMarcoExt * 2}
                  fill={perfilFill}
                  stroke={perfilStroke}
                  strokeWidth="1.2"
                />

                {/* Cristal Hoja Izquierda */}
                <rect
                  x={grosorMarcoExt + grosorHoja}
                  y={grosorMarcoExt + grosorHoja}
                  width={anchoHoja - grosorHoja * 2}
                  height={alto - grosorMarcoExt * 2 - grosorHoja * 2}
                  fill={colorVidrioFill}
                  stroke={modoBlueprint ? '#0ea5e9' : '#94a3b8'}
                  strokeWidth="0.8"
                />

                {/* Reflejo diagonal estético de vidrio */}
                {!modoBlueprint && (
                  <path
                    d={`M ${grosorMarcoExt + grosorHoja + 20} ${alto - grosorMarcoExt - grosorHoja} 
                        L ${grosorMarcoExt + anchoHoja - grosorHoja} ${grosorMarcoExt + grosorHoja + 40}`}
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeOpacity="0.35"
                    strokeLinecap="round"
                  />
                )}

                {/* Indicador de Paño 1: Fijo (Candado / F) o Corredizo */}
                {configuracionApertura === 'OX' ? (
                  <g transform={`translate(${grosorMarcoExt + anchoHoja / 2}, ${alto / 2})`}>
                    <circle r="18" fill="#1e293b" fillOpacity="0.75" stroke="#ffffff" strokeWidth="1.5" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      🔒 F
                    </text>
                  </g>
                ) : (
                  <g transform={`translate(${grosorMarcoExt + anchoHoja / 2}, ${alto / 2})`}>
                    <rect x="-32" y="-12" width="64" height="24" rx="12" fill="#1e293b" fillOpacity="0.75" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      ⇄ MÓVIL
                    </text>
                  </g>
                )}
              </g>

              {/* HOJA 2 (DERECHA - Delantera con Sombra de Traslape) */}
              <g id="hoja-derecha" filter="url(#traslapeShadow)">
                {/* Marco de Hoja Derecha (inicia en ancho - grosorMarcoExt - anchoHoja) */}
                <rect
                  x={ancho - grosorMarcoExt - anchoHoja}
                  y={grosorMarcoExt}
                  width={anchoHoja}
                  height={alto - grosorMarcoExt * 2}
                  fill={perfilFill}
                  stroke={perfilStroke}
                  strokeWidth="1.2"
                />

                {/* Cristal Hoja Derecha */}
                <rect
                  x={ancho - grosorMarcoExt - anchoHoja + grosorHoja}
                  y={grosorMarcoExt + grosorHoja}
                  width={anchoHoja - grosorHoja * 2}
                  height={alto - grosorMarcoExt * 2 - grosorHoja * 2}
                  fill={colorVidrioFill}
                  stroke={modoBlueprint ? '#0ea5e9' : '#94a3b8'}
                  strokeWidth="0.8"
                />

                {/* Reflejo diagonal en hoja derecha */}
                {!modoBlueprint && (
                  <path
                    d={`M ${ancho - grosorMarcoExt - anchoHoja + grosorHoja + 20} ${alto - grosorMarcoExt - grosorHoja} 
                        L ${ancho - grosorMarcoExt - grosorHoja} ${grosorMarcoExt + grosorHoja + 40}`}
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeOpacity="0.4"
                    strokeLinecap="round"
                  />
                )}

                {/* Indicador de Paño 2: Corredizo (Flechas de deslizamiento) */}
                <g transform={`translate(${ancho - grosorMarcoExt - anchoHoja / 2}, ${alto / 2})`}>
                  <rect x="-38" y="-14" width="76" height="28" rx="14" fill="#0284c7" fillOpacity="0.85" stroke="#ffffff" strokeWidth="1.5" />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    ⇄ CORRED.
                  </text>
                </g>

                {/* Línea sutil de traslape central */}
                <line
                  x1={ancho - grosorMarcoExt - anchoHoja}
                  y1={grosorMarcoExt}
                  x2={ancho - grosorMarcoExt - anchoHoja}
                  y2={alto - grosorMarcoExt}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
              </g>
            </>
          )}

          {/* VISTA PAÑO FIJO (1 Hoja sola con junquillo) */}
          {esFijoSolo && (
            <g id="pano-fijo">
              <rect
                x={grosorMarcoExt}
                y={grosorMarcoExt}
                width={ancho - grosorMarcoExt * 2}
                height={alto - grosorMarcoExt * 2}
                fill={colorVidrioFill}
                stroke={modoBlueprint ? '#0ea5e9' : '#94a3b8'}
                strokeWidth="1"
              />
              {/* Junquillo perimétrico interior */}
              <rect
                x={grosorMarcoExt + 16}
                y={grosorMarcoExt + 16}
                width={ancho - (grosorMarcoExt + 16) * 2}
                height={alto - (grosorMarcoExt + 16) * 2}
                fill="none"
                stroke={perfilStroke}
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <g transform={`translate(${ancho / 2}, ${alto / 2})`}>
                <circle r="22" fill="#1e293b" fillOpacity="0.75" stroke="#ffffff" strokeWidth="1.5" />
                <text textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize="15" fontWeight="bold">
                  🔒 FIJO
                </text>
              </g>
            </g>
          )}

          {/* VISTA PROYECTANTE */}
          {esProyectante && (
            <g id="pano-proyectante">
              <rect
                x={grosorMarcoExt + 25}
                y={grosorMarcoExt + 25}
                width={ancho - (grosorMarcoExt + 25) * 2}
                height={alto - (grosorMarcoExt + 25) * 2}
                fill={colorVidrioFill}
                stroke={perfilStroke}
                strokeWidth="2"
              />
              {/* Líneas en V representando apertura batiente */}
              <polyline
                points={`
                  ${grosorMarcoExt + 25},${grosorMarcoExt + 25} 
                  ${ancho / 2},${alto - grosorMarcoExt - 25} 
                  ${ancho - grosorMarcoExt - 25},${grosorMarcoExt + 25}
                `}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <g transform={`translate(${ancho / 2}, ${alto - grosorMarcoExt - 45})`}>
                <rect x="-42" y="-12" width="84" height="24" rx="12" fill="#1e293b" fillOpacity="0.8" />
                <text textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize="11" fontWeight="bold">
                  PROYECTANTE
                </text>
              </g>
            </g>
          )}

          {/* ======================================================== */}
          {/* 3. LÍNEAS DE COTA ACOTADAS EXTERIORES (DIMENSION LINES) */}
          {/* ======================================================== */}

          {/* COTA SUPERIOR: Ancho Vano Total */}
          <g id="cota-ancho-total">
            {/* Líneas de referencia/extensión verticales */}
            <line x1={0} y1={-8} x2={0} y2={-55} stroke={colorCota} strokeWidth="1" strokeDasharray="3 3" />
            <line x1={ancho} y1={-8} x2={ancho} y2={-55} stroke={colorCota} strokeWidth="1" strokeDasharray="3 3" />
            {/* Línea de cota horizontal con flechas */}
            <line
              x1={0}
              y1={-45}
              x2={ancho}
              y2={-45}
              stroke={colorCota}
              strokeWidth="1.5"
              markerStart="url(#arrowStart)"
              markerEnd="url(#arrowEnd)"
            />
            {/* Ticks terminales de cota */}
            <line x1={-5} y1={-50} x2={5} y2={-40} stroke={colorCota} strokeWidth="2" />
            <line x1={ancho - 5} y1={-50} x2={ancho + 5} y2={-40} stroke={colorCota} strokeWidth="2" />
            {/* Texto de medida de cota superior */}
            <g transform={`translate(${ancho / 2}, -58)`}>
              <rect x="-65" y="-14" width="130" height="24" rx="6" fill={bgCanvas} stroke={colorCota} strokeWidth="1" />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill={colorCotaText}
                fontSize="14"
                fontWeight="bold"
              >
                {ancho} mm
              </text>
            </g>
          </g>

          {/* COTA LATERAL IZQUIERDA: Alto Vano Total */}
          <g id="cota-alto-total">
            {/* Líneas de referencia/extensión horizontales */}
            <line x1={-8} y1={0} x2={-65} y2={0} stroke={colorCota} strokeWidth="1" strokeDasharray="3 3" />
            <line x1={-8} y1={alto} x2={-65} y2={alto} stroke={colorCota} strokeWidth="1" strokeDasharray="3 3" />
            {/* Línea de cota vertical con flechas */}
            <line
              x1={-55}
              y1={0}
              x2={-55}
              y2={alto}
              stroke={colorCota}
              strokeWidth="1.5"
              markerStart="url(#arrowStart)"
              markerEnd="url(#arrowEnd)"
            />
            {/* Ticks terminales de cota */}
            <line x1={-60} y1={-5} x2={-50} y2={5} stroke={colorCota} strokeWidth="2" />
            <line x1={-60} y1={alto - 5} x2={-50} y2={alto + 5} stroke={colorCota} strokeWidth="2" />
            {/* Texto de medida de cota lateral (rotado) */}
            <g transform={`translate(-70, ${alto / 2}) rotate(-90)`}>
              <rect x="-60" y="-13" width="120" height="24" rx="6" fill={bgCanvas} stroke={colorCota} strokeWidth="1" />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill={colorCotaText}
                fontSize="14"
                fontWeight="bold"
              >
                {alto} mm
              </text>
            </g>
          </g>

          {/* SUB-COTAS INFERIORES: Ancho Hoja 1 y Ancho Hoja 2 */}
          {mostrarSubcotas && esDobleHoja && (
            <g id="subcotas-inferiores">
              {/* Sub-cota Hoja 1 */}
              <line
                x1={grosorMarcoExt}
                y1={alto + 35}
                x2={grosorMarcoExt + anchoHoja}
                y2={alto + 35}
                stroke={colorCota}
                strokeWidth="1.2"
                markerStart="url(#arrowStart)"
                markerEnd="url(#arrowEnd)"
              />
              <line x1={grosorMarcoExt} y1={alto + 8} x2={grosorMarcoExt} y2={alto + 45} stroke={colorCota} strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1={grosorMarcoExt + anchoHoja} y1={alto + 8} x2={grosorMarcoExt + anchoHoja} y2={alto + 45} stroke={colorCota} strokeWidth="0.8" strokeDasharray="2 2" />
              <g transform={`translate(${grosorMarcoExt + anchoHoja / 2}, ${alto + 55})`}>
                <text textAnchor="middle" fill={colorCotaText} fontSize="12" fontWeight="600">
                  Hoja 1: {anchoHoja} mm
                </text>
              </g>

              {/* Sub-cota Hoja 2 */}
              <line
                x1={ancho - grosorMarcoExt - anchoHoja}
                y1={alto + 35}
                x2={ancho - grosorMarcoExt}
                y2={alto + 35}
                stroke={colorCota}
                strokeWidth="1.2"
                markerStart="url(#arrowStart)"
                markerEnd="url(#arrowEnd)"
              />
              <line x1={ancho - grosorMarcoExt} y1={alto + 8} x2={ancho - grosorMarcoExt} y2={alto + 45} stroke={colorCota} strokeWidth="0.8" strokeDasharray="2 2" />
              <g transform={`translate(${ancho - grosorMarcoExt - anchoHoja / 2}, ${alto + 55})`}>
                <text textAnchor="middle" fill={colorCotaText} fontSize="12" fontWeight="600">
                  Hoja 2: {anchoHoja} mm
                </text>
              </g>

              {/* Marca de solape / traslape */}
              <text
                x={ancho / 2}
                y={alto + 78}
                textAnchor="middle"
                fill="#0ea5e9"
                fontSize="11"
                fontWeight="bold"
              >
                (Traslape central: {anchoTraslape} mm)
              </text>
            </g>
          )}
        </svg>

        {/* Tooltip flotante al pasar mouse sobre un perfil exterior */}
        {hoveredPart && (
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg border border-slate-700 pointer-events-none transition-all">
            {hoveredPart === 'cabezal-ext' && `Cabezal Superior: ${ancho - 2} mm`}
            {hoveredPart === 'riel-ext' && `Riel Inferior: ${ancho - 2} mm`}
            {hoveredPart === 'jamba-izq' && `Jamba Lateral Izquierda: ${alto} mm`}
            {hoveredPart === 'jamba-der' && `Jamba Lateral Derecha: ${alto} mm`}
          </div>
        )}
      </div>

      {/* Leyenda y notas técnicas al pie del SVG */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-1 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-800 shrink-0"></span>
          <span>Perfil: <strong>{colorConfig.nombre}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-300 border border-sky-400 shrink-0"></span>
          <span className="truncate">Vidrio: <strong>{tipoCristalNombre}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700">🔒</span>
          <span>Paño Fijo / Seguro Caracol</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sky-600">⇄</span>
          <span>Deslizamiento Corredizo</span>
        </div>
      </div>
    </div>
  );
}
