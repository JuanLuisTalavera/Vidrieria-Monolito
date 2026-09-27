import axiosClient from '../api/axiosClient';

// Paleta de colores profesionales de taller para distinguir perfiles y molduras
export const PALETA_CORTES = [
  { bg: '#2563eb', border: '#1d4ed8', text: '#ffffff', name: 'Azul Eléctrico' },
  { bg: '#059669', border: '#047857', text: '#ffffff', name: 'Verde Esmeralda' },
  { bg: '#d97706', border: '#b45309', text: '#ffffff', name: 'Ámbar Intenso' },
  { bg: '#7c3aed', border: '#6d28d9', text: '#ffffff', name: 'Púrpura Taller' },
  { bg: '#db2777', border: '#be185d', text: '#ffffff', name: 'Rosa Fucsia' },
  { bg: '#0891b2', border: '#0e7490', text: '#ffffff', name: 'Cian Océano' },
  { bg: '#ea580c', border: '#c2410c', text: '#ffffff', name: 'Naranja Cobre' },
  { bg: '#4f46e5', border: '#4338ca', text: '#ffffff', name: 'Índigo Cobalto' },
  { bg: '#65a30d', border: '#4d7c0f', text: '#ffffff', name: 'Lima Fresco' },
  { bg: '#0d9488', border: '#0f766e', text: '#ffffff', name: 'Turquesa Oscuro' },
  { bg: '#9333ea', border: '#7e22ce', text: '#ffffff', name: 'Violeta Neón' },
  { bg: '#e11d48', border: '#be123c', text: '#ffffff', name: 'Rojo Carmín' },
];

/**
 * Asigna un color consistente basado en la etiqueta o tipo de perfil
 */
export function obtenerColorPieza(etiqueta = '', indice = 0) {
  const clean = etiqueta.toLowerCase();
  if (clean.includes('riel superior')) return { bg: '#2563eb', border: '#1d4ed8', text: '#ffffff' };
  if (clean.includes('riel inferior')) return { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' };
  if (clean.includes('jamba')) return { bg: '#059669', border: '#047857', text: '#ffffff' };
  if (clean.includes('traslape')) return { bg: '#7c3aed', border: '#6d28d9', text: '#ffffff' };
  if (clean.includes('parante') || clean.includes('pierna')) return { bg: '#9333ea', border: '#7e22ce', text: '#ffffff' };
  if (clean.includes('zócalo') || clean.includes('zocalo')) return { bg: '#d97706', border: '#b45309', text: '#ffffff' };
  if (clean.includes('cabezal')) return { bg: '#ea580c', border: '#c2410c', text: '#ffffff' };
  if (clean.includes('junquillo')) return { bg: '#0891b2', border: '#0e7490', text: '#ffffff' };
  if (clean.includes('ancho')) return { bg: '#2563eb', border: '#1d4ed8', text: '#ffffff' };
  if (clean.includes('alto')) return { bg: '#059669', border: '#047857', text: '#ffffff' };

  return PALETA_CORTES[Math.abs(indice) % PALETA_CORTES.length];
}

/**
 * Algoritmo First-Fit Decreasing (FFD) con merma de sierra para Stock Cutting 1D
 * @param {Object} params
 * @param {number} params.longitudVarillaEstandarMm - Largo total de varilla (ej. 6000 o 3000 mm)
 * @param {number} params.anchoSierraMm - Merma por corte de disco (ej. 4 mm)
 * @param {Array} params.cortes - [{ longitudMm, etiqueta, cantidad, color }]
 */
export function optimizarVarillas1D({
  longitudVarillaEstandarMm = 6000,
  anchoSierraMm = 4,
  cortes = [],
}) {
  const longitudVarilla = Number(longitudVarillaEstandarMm) || 6000;
  const anchoDisco = Math.max(0, Number(anchoSierraMm) || 0);

  // 1. Expandir cortes según cantidad
  const piezasIndividuales = [];
  let idContador = 1;

  cortes.forEach((c, idxGrupo) => {
    const cant = Math.max(1, parseInt(c.cantidad, 10) || 1);
    const len = Math.round(Number(c.longitudMm) || 0);
    const color = c.color || obtenerColorPieza(c.etiqueta, idxGrupo);

    if (len > 0) {
      for (let i = 0; i < cant; i++) {
        piezasIndividuales.push({
          id: `corte-${idContador++}`,
          longitudMm: len,
          etiqueta: c.etiqueta || `Corte ${len}mm`,
          color,
          idxGrupo,
        });
      }
    }
  });

  // Validar si alguna pieza excede la varilla
  const piezasExcedidas = piezasIndividuales.filter((p) => p.longitudMm > longitudVarilla);
  if (piezasExcedidas.length > 0) {
    return {
      error: `Hay ${piezasExcedidas.length} pieza(s) de longitud mayor a la varilla estándar (${longitudVarilla} mm). Medida máxima detectada: ${Math.max(...piezasExcedidas.map((p) => p.longitudMm))} mm.`,
      varillas: [],
      totalVarillas: 0,
    };
  }

  // 2. Ordenar de mayor a menor longitud (Estrategia Greedy FFD)
  piezasIndividuales.sort((a, b) => b.longitudMm - a.longitudMm);

  // 3. Empaquetar en varillas
  const varillas = [];

  piezasIndividuales.forEach((pieza) => {
    let colocada = false;

    for (let v of varillas) {
      // Si la varilla ya tiene piezas, requiere disco de corte adicional
      const mermaRequerida = v.segmentos.length > 0 ? anchoDisco : 0;
      const espacioNecesario = pieza.longitudMm + mermaRequerida;

      if (v.espacioLibreMm >= espacioNecesario) {
        const posInicio = v.longitudTotalMm - v.espacioLibreMm + (v.segmentos.length > 0 ? anchoDisco : 0);
        const posFin = posInicio + pieza.longitudMm;

        v.segmentos.push({
          ...pieza,
          posicionInicioMm: posInicio,
          posicionFinMm: posFin,
          mermaPreviaMm: v.segmentos.length > 0 ? anchoDisco : 0,
        });

        v.espacioLibreMm -= espacioNecesario;
        v.espacioUsadoMm += espacioNecesario;
        v.sumaCortesNetosMm += pieza.longitudMm;
        v.totalMermaSierraMm += (v.segmentos.length > 1 ? anchoDisco : 0);
        colocada = true;
        break;
      }
    }

    if (!colocada) {
      // Crear nueva varilla
      const posInicio = 0;
      const posFin = pieza.longitudMm;
      const espacioLibre = longitudVarilla - pieza.longitudMm;

      const nuevaVarilla = {
        numeroVarilla: varillas.length + 1,
        longitudTotalMm: longitudVarilla,
        espacioLibreMm: espacioLibre,
        espacioUsadoMm: pieza.longitudMm,
        sumaCortesNetosMm: pieza.longitudMm,
        totalMermaSierraMm: 0,
        segmentos: [
          {
            ...pieza,
            posicionInicioMm: posInicio,
            posicionFinMm: posFin,
            mermaPreviaMm: 0,
          },
        ],
      };

      varillas.push(nuevaVarilla);
    }
  });

  // 4. Calcular métricas por varilla
  varillas.forEach((v) => {
    v.retazoSobranteMm = Math.max(0, v.espacioLibreMm);
    v.porcentajeAprovechamiento = Number(
      ((v.sumaCortesNetosMm / v.longitudTotalMm) * 100).toFixed(1)
    );
    v.esAprovechable = v.retazoSobranteMm >= 500; // >= 50 cm se considera retazo útil
  });

  // 5. Métricas globales
  const totalVarillas = varillas.length;
  const totalMetrosConsumidos = Number(((totalVarillas * longitudVarilla) / 1000).toFixed(2));
  const totalLongitudCortesMm = piezasIndividuales.reduce((acc, p) => acc + p.longitudMm, 0);
  const totalMetrosRequeridos = Number((totalLongitudCortesMm / 1000).toFixed(2));
  const totalDesperdicioMm = (totalVarillas * longitudVarilla) - totalLongitudCortesMm;
  const porcentajeAprovechamientoGlobal = totalVarillas > 0
    ? Number(((totalLongitudCortesMm / (totalVarillas * longitudVarilla)) * 100).toFixed(1))
    : 0;
  const porcentajeDesperdicioGlobal = Number((100 - porcentajeAprovechamientoGlobal).toFixed(1));
  const totalRetazosAprovechablesMm = varillas.reduce(
    (acc, v) => acc + (v.esAprovechable ? v.retazoSobranteMm : 0),
    0
  );

  return {
    totalVarillas,
    totalMetrosConsumidos,
    totalMetrosRequeridos,
    totalDesperdicioMm,
    porcentajeAprovechamientoGlobal,
    porcentajeDesperdicioGlobal,
    totalRetazosAprovechablesMm,
    totalPiezas: piezasIndividuales.length,
    anchoSierraMm: anchoDisco,
    longitudVarillaEstandarMm: longitudVarilla,
    varillas,
  };
}

/**
 * Orquestador con fallback: consulta el backend Spring Boot y si no está disponible, calcula localmente.
 */
export async function calcularOptimizacionVarillas({
  longitudVarillaEstandarMm = 6000,
  anchoSierraMm = 4,
  cortes = [],
}) {
  const payload = {
    longitudVarillaEstandarMm: Number(longitudVarillaEstandarMm) || 6000,
    anchoSierraMm: Number(anchoSierraMm) || 4,
    cortes: cortes.map((c) => ({
      longitudMm: Math.round(Number(c.longitudMm) || 0),
      etiqueta: c.etiqueta || '',
      cantidad: Math.max(1, parseInt(c.cantidad, 10) || 1),
    })),
  };

  try {
    const res = await axiosClient.post('/api/v1/optimizador-corte/calcular', payload);
    if (res.data && Array.isArray(res.data.varillas)) {
      // Asignar colores si vienen en bruto del backend
      res.data.varillas.forEach((v) => {
        v.segmentos = (v.segmentos || []).map((s, idx) => ({
          ...s,
          color: s.color || obtenerColorPieza(s.etiqueta, idx),
        }));
      });
      return {
        ...res.data,
        modoLocal: false,
      };
    }
  } catch (err) {
    // Si el endpoint no existe o el backend está en desarrollo, fallback limpio
    console.info('Endpoint backend de optimizador no disponible. Calculando con motor local FFD:', err.message);
  }

  // Fallback a motor local
  const resultadoLocal = optimizarVarillas1D({
    longitudVarillaEstandarMm,
    anchoSierraMm,
    cortes,
  });

  return {
    ...resultadoLocal,
    modoLocal: true,
  };
}
