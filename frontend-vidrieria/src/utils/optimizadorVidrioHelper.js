import axiosClient from '../api/axiosClient';

/**
 * Paleta de colores profesionales para identificar cortes de vidrio en la plancha matriz
 */
export const PALETA_VIDRIOS = [
  'rgba(14, 165, 233, 0.45)', // Sky blue
  'rgba(16, 185, 129, 0.45)', // Emerald
  'rgba(245, 158, 11, 0.45)', // Amber
  'rgba(139, 92, 246, 0.45)', // Violet
  'rgba(236, 72, 153, 0.45)', // Pink
  'rgba(6, 182, 212, 0.45)',  // Cyan
  'rgba(249, 115, 22, 0.45)', // Orange
  'rgba(99, 102, 241, 0.45)', // Indigo
];

/**
 * Algoritmo 2D Guillotine / Shelf Packing para optimización de corte de vidrio (fallback local)
 * Empaqueta rectángulos en una o más láminas matriz considerando merma de corte de diamante.
 *
 * @param {Object} params
 * @param {number} params.anchoPlanchaMm - Ancho de la lámina matriz (ej. 3210 mm o 2600 mm)
 * @param {number} params.altoPlanchaMm - Alto de la lámina matriz (ej. 2140 mm o 1800 mm)
 * @param {number} params.mermaCorteMm - Merma por corte de diamante (ej. 3 mm)
 * @param {Array} params.panos - [{ id, etiqueta, anchoMm, altoMm, cantidad }]
 * @param {string} params.tipoVidrio - Nombre o descripción del cristal
 * @param {number} params.espesorMm - Espesor en mm
 */
export function optimizarVidrio2DLocal({
  anchoPlanchaMm = 3210,
  altoPlanchaMm = 2140,
  mermaCorteMm = 0,
  panos = [],
  piezas = [],
  tipoVidrio = 'Cristal Incoloro 6mm',
  espesorMm = 6,
}) {
  const planchaW = Math.max(100, Math.round(Number(anchoPlanchaMm) || 3210));
  const planchaH = Math.max(100, Math.round(Number(altoPlanchaMm) || 2140));
  // En corte de vidrio no existe merma de disco/sierra: el vidrio se raya y quiebra (0 mm)
  const merma = 0;

  // 1. Expandir paños/piezas por cantidad y ordenar de mayor a menor área (Heurística BFD)
  const piezasAColocar = [];
  let contador = 1;
  const listaOrigen = Array.isArray(piezas) && piezas.length > 0 ? piezas : (Array.isArray(panos) ? panos : []);

  listaOrigen.forEach((p, idxPano) => {
    const cant = Math.max(1, parseInt(p.cantidad, 10) || 1);
    const w = Math.round(Number(p.anchoMm ?? p.ancho) || 0);
    const h = Math.round(Number(p.altoMm ?? p.alto) || 0);
    const desc = String(p.descripcion || p.etiqueta || `Paño #${contador}`).trim();

    if (w > 0 && h > 0) {
      for (let i = 0; i < cant; i++) {
        piezasAColocar.push({
          id: p.id ? `${p.id}-${i + 1}` : `vidrio-${contador++}`,
          etiqueta: cant > 1 ? `${desc} (${i + 1}/${cant})` : desc,
          descripcion: cant > 1 ? `${desc} (${i + 1}/${cant})` : desc,
          ancho: w,
          alto: h,
          area: w * h,
          idxPano,
        });
      }
    }
  });

  // Validar si alguna pieza excede las dimensiones físicas de la plancha matriz
  const piezasExcedidas = piezasAColocar.filter(
    (p) => (p.ancho > planchaW && p.alto > planchaW) || (p.ancho > planchaH && p.alto > planchaH)
  );
  if (piezasExcedidas.length > 0) {
    return {
      error: `Existen ${piezasExcedidas.length} pieza(s) cuyas dimensiones superan la lámina matriz (${planchaW} × ${planchaH} mm).`,
      planchas: [],
    };
  }

  // Ordenar por altura descendente y luego por ancho descendente (Shelf-First)
  piezasAColocar.sort((a, b) => {
    if (b.alto !== a.alto) return b.alto - a.alto;
    return b.ancho - a.ancho;
  });

  // 2. Colocar piezas utilizando estantes (Shelf Packing con soporte de rotación 90°)
  const planchas = [];

  const crearNuevaPlancha = (num) => ({
    numeroPlancha: num,
    anchoPlanchaMm: planchaW,
    altoPlanchaMm: planchaH,
    espesorMm,
    tipoVidrio,
    mermaCorteMm: merma,
    piezas: [],
    estantes: [], // [{ y, altura, espacioLibreX, xActual }]
  });

  piezasAColocar.forEach((pieza) => {
    let colocada = false;

    for (let plancha of planchas) {
      // Intentar colocar en un estante existente (orientación normal o rotada)
      for (let estante of plancha.estantes) {
        // Opción 1: Orientación normal
        if (
          estante.espacioLibreX >= pieza.ancho + (estante.piezasCount > 0 ? merma : 0) &&
          pieza.alto <= estante.altura
        ) {
          const posX = estante.xActual + (estante.piezasCount > 0 ? merma : 0);
          const posY = estante.y;

          plancha.piezas.push({
            id: pieza.id,
            etiqueta: pieza.etiqueta,
            descripcion: pieza.descripcion,
            ancho: pieza.ancho,
            alto: pieza.alto,
            anchoMm: pieza.ancho,
            altoMm: pieza.alto,
            x: posX,
            y: posY,
            rotada: false,
          });

          const espacioUsado = pieza.ancho + (estante.piezasCount > 0 ? merma : 0);
          estante.espacioLibreX -= espacioUsado;
          estante.xActual += espacioUsado;
          estante.piezasCount += 1;
          colocada = true;
          break;
        }

        // Opción 2: Rotar 90° si cabe mejor
        if (
          estante.espacioLibreX >= pieza.alto + (estante.piezasCount > 0 ? merma : 0) &&
          pieza.ancho <= estante.altura
        ) {
          const posX = estante.xActual + (estante.piezasCount > 0 ? merma : 0);
          const posY = estante.y;

          plancha.piezas.push({
            id: pieza.id,
            etiqueta: `${pieza.etiqueta} ⟳90°`,
            descripcion: `${pieza.descripcion} ⟳90°`,
            ancho: pieza.alto,
            alto: pieza.ancho,
            anchoMm: pieza.alto,
            altoMm: pieza.ancho,
            x: posX,
            y: posY,
            rotada: true,
          });

          const espacioUsado = pieza.alto + (estante.piezasCount > 0 ? merma : 0);
          estante.espacioLibreX -= espacioUsado;
          estante.xActual += espacioUsado;
          estante.piezasCount += 1;
          colocada = true;
          break;
        }
      }

      if (colocada) break;

      // Intentar crear un nuevo estante vertical en la misma plancha
      const alturaUsada = plancha.estantes.reduce((sum, est) => sum + est.altura + merma, 0);

      // Opción A: Nuevo estante orientación normal
      if (planchaH - alturaUsada >= pieza.alto && planchaW >= pieza.ancho) {
        const nuevoEstante = {
          y: alturaUsada,
          altura: pieza.alto,
          espacioLibreX: planchaW - pieza.ancho,
          xActual: pieza.ancho,
          piezasCount: 1,
        };
        plancha.estantes.push(nuevoEstante);

        plancha.piezas.push({
          id: pieza.id,
          etiqueta: pieza.etiqueta,
          descripcion: pieza.descripcion,
          ancho: pieza.ancho,
          alto: pieza.alto,
          anchoMm: pieza.ancho,
          altoMm: pieza.alto,
          x: 0,
          y: alturaUsada,
          rotada: false,
        });

        colocada = true;
        break;
      }

      // Opción B: Nuevo estante rotando 90°
      if (planchaH - alturaUsada >= pieza.ancho && planchaW >= pieza.alto) {
        const nuevoEstante = {
          y: alturaUsada,
          altura: pieza.ancho,
          espacioLibreX: planchaW - pieza.alto,
          xActual: pieza.alto,
          piezasCount: 1,
        };
        plancha.estantes.push(nuevoEstante);

        plancha.piezas.push({
          id: pieza.id,
          etiqueta: `${pieza.etiqueta} ⟳90°`,
          descripcion: `${pieza.descripcion} ⟳90°`,
          ancho: pieza.alto,
          alto: pieza.ancho,
          anchoMm: pieza.alto,
          altoMm: pieza.ancho,
          x: 0,
          y: alturaUsada,
          rotada: true,
        });

        colocada = true;
        break;
      }
    }

    // Si no cupo en ninguna plancha existente, crear una nueva lámina matriz
    if (!colocada) {
      const nuevaPlancha = crearNuevaPlancha(planchas.length + 1);

      const nuevoEstante = {
        y: 0,
        altura: pieza.alto,
        espacioLibreX: planchaW - pieza.ancho,
        xActual: pieza.ancho,
        piezasCount: 1,
      };
      nuevaPlancha.estantes.push(nuevoEstante);

      nuevaPlancha.piezas.push({
        id: pieza.id,
        etiqueta: pieza.etiqueta,
        descripcion: pieza.descripcion,
        ancho: pieza.ancho,
        alto: pieza.alto,
        anchoMm: pieza.ancho,
        altoMm: pieza.alto,
        x: 0,
        y: 0,
        rotada: false,
      });

      planchas.push(nuevaPlancha);
    }
  });

  // Limpiar propiedades internas de estantes antes de retornar
  planchas.forEach((p) => {
    delete p.estantes;
  });

  return {
    planchas,
    totalPlanchas: planchas.length,
    totalPiezas: piezasAColocar.length,
    anchoPlanchaMm: planchaW,
    altoPlanchaMm: planchaH,
    modoLocal: true,
  };
}

/**
 * Orquestador con fallback: consulta el endpoint del backend Spring Boot:
 * POST /api/v1/optimizador-corte/vidrio (DTO: OptimizadorVidrioRequestDTO)
 * y si no está disponible o falla, calcula con el motor local 2D Guillotine.
 *
 * @param {Object} params
 * @param {number} [params.anchoPlancha] - Ancho de plancha en mm
 * @param {number} [params.anchoPlanchaMm] - Alias
 * @param {number} [params.altoPlancha] - Alto de plancha en mm
 * @param {number} [params.altoPlanchaMm] - Alias
 * @param {number} [params.grosorCorteMm] - Grosor de corte de diamante en mm (ej. 3)
 * @param {number} [params.mermaCorteMm] - Alias
 * @param {boolean} [params.permitirRotacion] - Permite rotar a 90° (default true)
 * @param {string} [params.tipoVidrio] - Nombre o tipo de cristal
 * @param {number} [params.espesorMm] - Espesor en mm
 * @param {Array} [params.piezas] - [{ anchoMm, altoMm, cantidad, descripcion }]
 * @param {Array} [params.panos] - Alias de piezas
 */
/**
 * Normaliza la respuesta DTO del Optimizador de Vidrio 2D para su renderizado en DiagramaPlanchaVidrioSVG
 */
export function normalizarResultadoVidrio(data, anchoFinal = 3210, altoFinal = 2140) {
  if (!data) return null;
  const planchasRaw = Array.isArray(data.planchas) ? data.planchas : (Array.isArray(data) ? data : [data]);

  const planchasNormalizadas = planchasRaw.map((plancha, pIdx) => ({
    ...plancha,
    numeroPlancha: plancha.numeroPlancha || pIdx + 1,
    anchoPlanchaMm: Number(plancha.anchoPlanchaMm || data.anchoPlanchaMm || anchoFinal),
    altoPlanchaMm: Number(plancha.altoPlanchaMm || data.altoPlanchaMm || altoFinal),
    porcentajeAprovechamiento: Number(plancha.porcentajeAprovechamiento || data.porcentajeAprovechamiento || 0),
    piezas: (plancha.piezas || []).map((pz, idx) => ({
      ...pz,
      id: pz.idPieza || pz.id || `pz-${pIdx + 1}-${idx + 1}`,
      etiqueta: pz.descripcion || pz.etiqueta || `Pieza #${idx + 1}`,
      descripcion: pz.descripcion || pz.etiqueta || `Pieza #${idx + 1}`,
      ancho: Number(pz.ancho || pz.anchoMm || 0),
      alto: Number(pz.alto || pz.altoMm || 0),
      anchoMm: Number(pz.ancho || pz.anchoMm || 0),
      altoMm: Number(pz.alto || pz.altoMm || 0),
      x: Number(pz.x || 0),
      y: Number(pz.y || 0),
      rotada: Boolean(pz.rotada),
      areaM2: Number(pz.areaM2 || ((Number(pz.ancho || 0) * Number(pz.alto || 0)) / 1_000_000)),
    })),
  }));

  return {
    ...data,
    anchoPlanchaMm: Number(data.anchoPlanchaMm || anchoFinal),
    altoPlanchaMm: Number(data.altoPlanchaMm || altoFinal),
    planchas: planchasNormalizadas,
    totalPlanchas: data.totalPlanchas || planchasNormalizadas.length,
    porcentajeAprovechamiento: Number(data.porcentajeAprovechamiento || 0),
    modoLocal: false,
  };
}

/**
 * Cliente para el cálculo síncrono/fallback de optimización 2D
 */
export async function calcularOptimizacionVidrio2D({
  anchoPlancha = 3210,
  anchoPlanchaMm,
  altoPlancha = 2140,
  altoPlanchaMm,
  grosorCorteMm = 3,
  mermaCorteMm,
  permitirRotacion = true,
  tipoVidrio = 'Cristal Incoloro 6mm',
  espesorMm = 6,
  panos = [],
  piezas = [],
}) {
  // 1. Normalizar y validar parámetros numéricos (estrictamente requeridos por Spring Boot DTO)
  const anchoFinal = Math.max(100, Math.round(Number(anchoPlanchaMm ?? anchoPlancha) || 3210));
  const altoFinal = Math.max(100, Math.round(Number(altoPlanchaMm ?? altoPlancha) || 2140));
  const rotacionFinal = permitirRotacion !== undefined ? Boolean(permitirRotacion) : true;

  const listaPiezasOrigen = Array.isArray(piezas) && piezas.length > 0 ? piezas : (Array.isArray(panos) ? panos : []);

  const piezasPayload = listaPiezasOrigen
    .map((p, idx) => ({
      anchoMm: Math.round(Number(p.anchoMm ?? p.ancho) || 0),
      altoMm: Math.round(Number(p.altoMm ?? p.alto) || 0),
      cantidad: Math.max(1, parseInt(p.cantidad, 10) || 1),
      descripcion: String(p.descripcion || p.etiqueta || `Pieza #${idx + 1}`).trim(),
    }))
    .filter((p) => p.anchoMm > 0 && p.altoMm > 0 && p.cantidad > 0);

  if (piezasPayload.length === 0) {
    return {
      error: 'Debe ingresar al menos una pieza con dimensiones válidas (ancho > 0 y alto > 0).',
      planchas: [],
      totalPlanchas: 0,
      totalPiezas: 0,
    };
  }

  const payload = {
    anchoPlancha: anchoFinal,
    altoPlancha: altoFinal,
    permitirRotacion: rotacionFinal,
    piezas: piezasPayload,
  };

  // 2. Llamada directa al endpoint del backend Spring Boot
  try {
    const res = await axiosClient.post('/api/v1/optimizador-corte/vidrio', payload);

    if (res.data) {
      if (res.data.planchas) {
        return normalizarResultadoVidrio(res.data, anchoFinal, altoFinal);
      }
    }
  } catch (err) {
    console.warn(
      'Aviso: Endpoint /api/v1/optimizador-corte/vidrio no respondió síncronamente (' +
      (err.response?.status || err.message) +
      '). Usando motor local 2D Guillotine:',
      err.response?.data || err.message
    );
  }

  // 3. Fallback a motor local 2D Guillotine (sin merma de corte)
  return optimizarVidrio2DLocal({
    anchoPlanchaMm: anchoFinal,
    altoPlanchaMm: altoFinal,
    mermaCorteMm: 0,
    panos: piezasPayload,
    piezas: piezasPayload,
    tipoVidrio,
    espesorMm,
  });
}
