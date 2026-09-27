// Catálogo de Sistemas de Carpintería y Obras de Aluminio y Vidrio
export const TIPOS_ESTRUCTURAS = [
  {
    id: 'VENTANA_SERIE_20_2H',
    nombre: 'Ventana Corrediza Serie 20 (2 Hojas)',
    codigo: 'S20-2H',
    descripcion: 'Sistema tradicional liviano corredizo de dos hojas (1 fija + 1 móvil o 2 móviles) con felpa y perfiles perimétricos.',
    hojas: 2,
    tipo: 'VENTANA',
    longitudVarillaDefectoMm: 6000,
    precioBaseVarilla: 55.0,
    costoManoObraDefecto: 45.0,
  },
  {
    id: 'VENTANA_SERIE_25_2H',
    nombre: 'Ventana Corrediza Serie 25 (2 Hojas)',
    codigo: 'S25-2H',
    descripcion: 'Sistema semi-pesado hermético con perfiles reforzados, ideal para vanos medianos a grandes con mayor resistencia al viento.',
    hojas: 2,
    tipo: 'VENTANA',
    longitudVarillaDefectoMm: 6000,
    precioBaseVarilla: 78.0,
    costoManoObraDefecto: 60.0,
  },
  {
    id: 'MAMPARA_SERIE_25_2H',
    nombre: 'Mampara Corrediza Serie 25 (2 Hojas)',
    codigo: 'MAMP-S25-2H',
    descripcion: 'Mampara de piso a techo con zócalos altos de 10 cm, carretillas dobles regulables y riel inferior con drenaje pluvial.',
    hojas: 2,
    tipo: 'MAMPARA',
    longitudVarillaDefectoMm: 6000,
    precioBaseVarilla: 95.0,
    costoManoObraDefecto: 90.0,
  },
  {
    id: 'MAMPARA_NOVA_2H',
    nombre: 'Mampara Sistema Nova (Cristal Templado 2H)',
    codigo: 'NOVA-2H',
    descripcion: 'Sistema vanguardista de cristal templado suspendido o apoyado con perfiles y accesorios de acero inoxidable / aluminio anodizado.',
    hojas: 2,
    tipo: 'MAMPARA',
    longitudVarillaDefectoMm: 6000,
    precioBaseVarilla: 110.0,
    costoManoObraDefecto: 120.0,
  },
  {
    id: 'VENTANA_PROYECTANTE',
    nombre: 'Ventana Proyectante Serie 3825',
    codigo: 'PROY-3825',
    descripcion: 'Ventana de apertura hacia el exterior con brazos de fricción de acero y marco hermético con doble junta de jebe.',
    hojas: 1,
    tipo: 'VENTANA',
    longitudVarillaDefectoMm: 6000,
    precioBaseVarilla: 70.0,
    costoManoObraDefecto: 50.0,
  },
  {
    id: 'FIJO_PANAL',
    nombre: 'Paño Fijo con Junquillos',
    codigo: 'FIJO-JUNQ',
    descripcion: 'Estructura fija perimétrica con junquillo a presión para división de ambientes, tragaluces o vitrinas comerciales.',
    hojas: 1,
    tipo: 'FIJO',
    longitudVarillaDefectoMm: 6000,
    precioBaseVarilla: 50.0,
    costoManoObraDefecto: 35.0,
  },
];

// Acabados de Aluminio con representaciones cromáticas
export const COLORES_ALUMINIO = [
  {
    id: 'negro',
    nombre: 'Negro Mate Electroestático',
    hex: '#1e293b',
    borderHex: '#0f172a',
    accentHex: '#334155',
    recargoPorcentaje: 0.10,
  },
  {
    id: 'blanco',
    nombre: 'Blanco Esmaltado',
    hex: '#f8fafc',
    borderHex: '#cbd5e1',
    accentHex: '#e2e8f0',
    recargoPorcentaje: 0.05,
  },
  {
    id: 'mate',
    nombre: 'Aluminio Natural / Mate Anodizado',
    hex: '#94a3b8',
    borderHex: '#64748b',
    accentHex: '#cbd5e1',
    recargoPorcentaje: 0.0,
  },
  {
    id: 'champagne',
    nombre: 'Champagne / Bronce Anodizado',
    hex: '#b49464',
    borderHex: '#8c6f44',
    accentHex: '#d8c29d',
    recargoPorcentaje: 0.15,
  },
  {
    id: 'madera',
    nombre: 'Efecto Madera Nogal / Sublimado',
    hex: '#78350f',
    borderHex: '#522307',
    accentHex: '#9a3412',
    recargoPorcentaje: 0.25,
  },
];

// Catálogo de Cristales para Obras
export const CRISTALES_OBRA_DEFECTO = [
  { id: 1, nombre: 'Cristal Incoloro 4mm', espesorMm: 4, precioM2: 42.0, colorTint: 'rgba(224, 242, 254, 0.45)', esTemplado: false },
  { id: 2, nombre: 'Cristal Incoloro 6mm', espesorMm: 6, precioM2: 58.0, colorTint: 'rgba(224, 242, 254, 0.55)', esTemplado: false },
  { id: 3, nombre: 'Cristal Bronce 6mm', espesorMm: 6, precioM2: 68.0, colorTint: 'rgba(180, 83, 9, 0.35)', esTemplado: false },
  { id: 4, nombre: 'Cristal Gris / Humo 6mm', espesorMm: 6, precioM2: 68.0, colorTint: 'rgba(71, 85, 105, 0.45)', esTemplado: false },
  { id: 5, nombre: 'Cristal Templado Incoloro 6mm', espesorMm: 6, precioM2: 95.0, colorTint: 'rgba(186, 230, 253, 0.65)', esTemplado: true },
  { id: 6, nombre: 'Cristal Templado Incoloro 8mm', espesorMm: 8, precioM2: 125.0, colorTint: 'rgba(186, 230, 253, 0.75)', esTemplado: true },
  { id: 7, nombre: 'Cristal Reflejante Plata 6mm', espesorMm: 6, precioM2: 85.0, colorTint: 'rgba(148, 163, 184, 0.60)', esTemplado: false },
];

/**
 * Calcula el despiece milimétrico exacto para carpintería de aluminio y corte de cristales
 */
export function calcularDespieceObra({
  anchoVanoMm,
  altoVanoMm,
  tipoEstructura = 'VENTANA_SERIE_20_2H',
  colorAluminio = 'negro',
  tipoCristalId = 2,
  configuracionApertura = 'OX', // 'OX': Fijo + Corredizo, 'XX': 2 Corredizos
  margenUtilidad = 0.35,
  catalogoCristales = null,
}) {
  const ancho = Math.round(Number(anchoVanoMm) || 0);
  const alto = Math.round(Number(altoVanoMm) || 0);

  if (ancho <= 0 || alto <= 0) {
    return null;
  }

  const estructuraInfo = TIPOS_ESTRUCTURAS.find((e) => e.id === tipoEstructura) || TIPOS_ESTRUCTURAS[0];
  const colorInfo = COLORES_ALUMINIO.find((c) => c.id === colorAluminio) || COLORES_ALUMINIO[0];
  const listaCristalesBase = (Array.isArray(catalogoCristales) && catalogoCristales.length > 0)
    ? catalogoCristales
    : CRISTALES_OBRA_DEFECTO;
  const cristalInfo =
    listaCristalesBase.find((cr) => Number(cr.id ?? cr.idVidrio) === Number(tipoCristalId)) ||
    listaCristalesBase[0] ||
    CRISTALES_OBRA_DEFECTO[1];

  let perfilesAluminio = [];
  let listaCristales = [];
  let accesorios = [];

  if (tipoEstructura === 'VENTANA_SERIE_20_2H') {
    // Fórmulas Oficiales Serie 20 (2 Hojas)
    // Rieles Superior e Inferior: Ancho - 2 mm
    const largoRiel = Math.max(0, ancho - 2);
    // Jambas Laterales: Alto Vano
    const largoJamba = alto;
    // Parantes laterales / Piernas de hoja: Alto - 35 mm
    const largoPierna = Math.max(0, alto - 35);
    // Traslapes centrales de hoja: Alto - 35 mm
    const largoTraslape = Math.max(0, alto - 35);
    // Zócalos inferiores de hoja: (Ancho / 2) - 20 mm
    const largoZocalo = Math.max(0, Math.round((ancho / 2) - 20));
    // Cabezales superiores de hoja: (Ancho / 2) - 20 mm
    const largoCabezal = Math.max(0, Math.round((ancho / 2) - 20));

    perfilesAluminio = [
      {
        id: 'p-riel-sup',
        nombre: 'Riel Superior',
        codigoPerfil: 'S20-101',
        formulaTexto: 'Ancho vano - 2 mm',
        longitudMm: largoRiel,
        cantidad: 1,
        corte: 'Recto 90°',
        categoria: 'Marco Exterior',
      },
      {
        id: 'p-riel-inf',
        nombre: 'Riel Inferior',
        codigoPerfil: 'S20-102',
        formulaTexto: 'Ancho vano - 2 mm',
        longitudMm: largoRiel,
        cantidad: 1,
        corte: 'Recto 90°',
        categoria: 'Marco Exterior',
      },
      {
        id: 'p-jamba',
        nombre: 'Jambas Laterales',
        codigoPerfil: 'S20-103',
        formulaTexto: 'Alto vano',
        longitudMm: largoJamba,
        cantidad: 2,
        corte: 'Recto 90°',
        categoria: 'Marco Exterior',
      },
      {
        id: 'p-pierna',
        nombre: 'Piernas / Parantes Laterales',
        codigoPerfil: 'S20-201',
        formulaTexto: 'Alto vano - 35 mm',
        longitudMm: largoPierna,
        cantidad: 2,
        corte: 'Recto 90°',
        categoria: 'Hojas Móviles',
      },
      {
        id: 'p-traslape',
        nombre: 'Traslapes Centrales',
        codigoPerfil: 'S20-202',
        formulaTexto: 'Alto vano - 35 mm',
        longitudMm: largoTraslape,
        cantidad: 2,
        corte: 'Recto 90°',
        categoria: 'Hojas Móviles',
      },
      {
        id: 'p-zocalo',
        nombre: 'Zócalos Inferiores',
        codigoPerfil: 'S20-203',
        formulaTexto: '(Ancho / 2) - 20 mm',
        longitudMm: largoZocalo,
        cantidad: 2,
        corte: 'Recto 90°',
        categoria: 'Hojas Móviles',
      },
      {
        id: 'p-cabezal',
        nombre: 'Cabezales Superiores',
        codigoPerfil: 'S20-204',
        formulaTexto: '(Ancho / 2) - 20 mm',
        longitudMm: largoCabezal,
        cantidad: 2,
        corte: 'Recto 90°',
        categoria: 'Hojas Móviles',
      },
    ];

    // Cristales (2 Paños)
    const anchoPanoMm = Math.max(0, Math.round((ancho / 2) - 15));
    const altoPanoMm = Math.max(0, Math.round(alto - 75));
    const areaUnitM2 = Number(((anchoPanoMm / 1000) * (altoPanoMm / 1000)).toFixed(3));

    listaCristales = [
      {
        id: 'cristal-1',
        etiqueta: configuracionApertura === 'OX' ? 'Paño 1 (Fijo)' : 'Paño 1 (Corredizo)',
        tipo: configuracionApertura === 'OX' ? 'FIJO' : 'CORREDIZO',
        anchoMm: anchoPanoMm,
        altoMm: altoPanoMm,
        anchoCm: Number((anchoPanoMm / 10).toFixed(1)),
        altoCm: Number((altoPanoMm / 10).toFixed(1)),
        areaM2: areaUnitM2,
        cantidad: 1,
      },
      {
        id: 'cristal-2',
        etiqueta: 'Paño 2 (Corredizo)',
        tipo: 'CORREDIZO',
        anchoMm: anchoPanoMm,
        altoMm: altoPanoMm,
        anchoCm: Number((anchoPanoMm / 10).toFixed(1)),
        altoCm: Number((altoPanoMm / 10).toFixed(1)),
        areaM2: areaUnitM2,
        cantidad: 1,
      },
    ];

    // Accesorios Serie 20
    const metrosFelpa = Number((((largoPierna * 4) + (largoZocalo * 4)) / 1000 * 1.1).toFixed(2));
    const metrosVinil = Number(((areaUnitM2 * 2 * 4) * 0.8).toFixed(2));

    accesorios = [
      { id: 'acc-1', nombre: 'Garruchas / Rodajes de nylon con balero', cantidad: 4, unidad: 'und', precioUnit: 6.5 },
      { id: 'acc-2', nombre: 'Seguro de caracol / Pestillo central', cantidad: 1, unidad: 'und', precioUnit: 12.0 },
      { id: 'acc-3', nombre: 'Felpa aislante perimétrica siliconada', cantidad: metrosFelpa, unidad: 'ml', precioUnit: 2.5 },
      { id: 'acc-4', nombre: 'Vinil / Cuña de jebe para acristalar', cantidad: metrosVinil, unidad: 'ml', precioUnit: 2.0 },
      { id: 'acc-5', nombre: 'Guiadores superiores y topes de nylon', cantidad: 4, unidad: 'und', precioUnit: 3.0 },
      { id: 'acc-6', nombre: 'Tornillos autorroscantes #8x1" y #8x2"', cantidad: 24, unidad: 'und', precioUnit: 0.3 },
    ];

  } else if (tipoEstructura === 'VENTANA_SERIE_25_2H') {
    // Serie 25 Reforzada (2 Hojas)
    const largoRiel = Math.max(0, ancho - 2);
    const largoJamba = alto;
    const largoPierna = Math.max(0, alto - 45);
    const largoTraslape = Math.max(0, alto - 45);
    const largoZocalo = Math.max(0, Math.round((ancho / 2) - 25));
    const largoCabezal = Math.max(0, Math.round((ancho / 2) - 25));

    perfilesAluminio = [
      { id: 'p-riel-sup', nombre: 'Riel Superior S25', codigoPerfil: 'S25-101', formulaTexto: 'Ancho vano - 2 mm', longitudMm: largoRiel, cantidad: 1, corte: 'Recto 90°', categoria: 'Marco Exterior' },
      { id: 'p-riel-inf', nombre: 'Riel Inferior S25', codigoPerfil: 'S25-102', formulaTexto: 'Ancho vano - 2 mm', longitudMm: largoRiel, cantidad: 1, corte: 'Recto 90°', categoria: 'Marco Exterior' },
      { id: 'p-jamba', nombre: 'Jambas Laterales S25', codigoPerfil: 'S25-103', formulaTexto: 'Alto vano', longitudMm: largoJamba, cantidad: 2, corte: 'Recto 90°', categoria: 'Marco Exterior' },
      { id: 'p-pierna', nombre: 'Piernas / Parantes S25', codigoPerfil: 'S25-201', formulaTexto: 'Alto vano - 45 mm', longitudMm: largoPierna, cantidad: 2, corte: 'Recto 90°', categoria: 'Hojas Móviles' },
      { id: 'p-traslape', nombre: 'Traslapes S25', codigoPerfil: 'S25-202', formulaTexto: 'Alto vano - 45 mm', longitudMm: largoTraslape, cantidad: 2, corte: 'Recto 90°', categoria: 'Hojas Móviles' },
      { id: 'p-zocalo', nombre: 'Zócalos Inferiores S25', codigoPerfil: 'S25-203', formulaTexto: '(Ancho / 2) - 25 mm', longitudMm: largoZocalo, cantidad: 2, corte: 'Recto 90°', categoria: 'Hojas Móviles' },
      { id: 'p-cabezal', nombre: 'Cabezales Superiores S25', codigoPerfil: 'S25-204', formulaTexto: '(Ancho / 2) - 25 mm', longitudMm: largoCabezal, cantidad: 2, corte: 'Recto 90°', categoria: 'Hojas Móviles' },
    ];

    const anchoPanoMm = Math.max(0, Math.round((ancho / 2) - 22));
    const altoPanoMm = Math.max(0, Math.round(alto - 85));
    const areaUnitM2 = Number(((anchoPanoMm / 1000) * (altoPanoMm / 1000)).toFixed(3));

    listaCristales = [
      { id: 'cristal-1', etiqueta: 'Paño 1 (Fijo/Móvil)', tipo: configuracionApertura === 'OX' ? 'FIJO' : 'CORREDIZO', anchoMm: anchoPanoMm, altoMm: altoPanoMm, anchoCm: Number((anchoPanoMm / 10).toFixed(1)), altoCm: Number((altoPanoMm / 10).toFixed(1)), areaM2: areaUnitM2, cantidad: 1 },
      { id: 'cristal-2', etiqueta: 'Paño 2 (Corredizo)', tipo: 'CORREDIZO', anchoMm: anchoPanoMm, altoMm: altoPanoMm, anchoCm: Number((anchoPanoMm / 10).toFixed(1)), altoCm: Number((altoPanoMm / 10).toFixed(1)), areaM2: areaUnitM2, cantidad: 1 },
    ];

    const metrosFelpa = Number((((largoPierna * 4) + (largoZocalo * 4)) / 1000 * 1.15).toFixed(2));
    const metrosVinil = Number(((areaUnitM2 * 2 * 4) * 0.85).toFixed(2));

    accesorios = [
      { id: 'acc-1', nombre: 'Garruchas dobles regulables con rodamiento S25', cantidad: 4, unidad: 'und', precioUnit: 11.0 },
      { id: 'acc-2', nombre: 'Cierre embutido multipunto / Manija perimétrica', cantidad: 1, unidad: 'und', precioUnit: 22.0 },
      { id: 'acc-3', nombre: 'Felpa aislante siliconada de alta densidad', cantidad: metrosFelpa, unidad: 'ml', precioUnit: 3.0 },
      { id: 'acc-4', nombre: 'Vinil EPDM perimétrico para cristal', cantidad: metrosVinil, unidad: 'ml', precioUnit: 2.5 },
      { id: 'acc-5', nombre: 'Topes amortiguadores y guiadores de hoja', cantidad: 4, unidad: 'und', precioUnit: 4.0 },
      { id: 'acc-6', nombre: 'Kit tornillos inox autoperforantes', cantidad: 28, unidad: 'und', precioUnit: 0.5 },
    ];

  } else if (tipoEstructura === 'MAMPARA_SERIE_25_2H') {
    // Mampara Serie 25 con zócalo alto de 10cm
    const largoRiel = Math.max(0, ancho - 2);
    const largoJamba = alto;
    const largoPierna = Math.max(0, alto - 55);
    const largoTraslape = Math.max(0, alto - 55);
    const largoZocaloAlto = Math.max(0, Math.round((ancho / 2) - 25));
    const largoCabezal = Math.max(0, Math.round((ancho / 2) - 25));

    perfilesAluminio = [
      { id: 'p-riel-sup', nombre: 'Riel Superior Mampara S25', codigoPerfil: 'MAMP-101', formulaTexto: 'Ancho vano - 2 mm', longitudMm: largoRiel, cantidad: 1, corte: 'Recto 90°', categoria: 'Marco Exterior' },
      { id: 'p-riel-inf', nombre: 'Riel Inferior con Drenaje Mampara', codigoPerfil: 'MAMP-102', formulaTexto: 'Ancho vano - 2 mm', longitudMm: largoRiel, cantidad: 1, corte: 'Recto 90°', categoria: 'Marco Exterior' },
      { id: 'p-jamba', nombre: 'Jambas Laterales Reforzadas', codigoPerfil: 'MAMP-103', formulaTexto: 'Alto vano', longitudMm: largoJamba, cantidad: 2, corte: 'Recto 90°', categoria: 'Marco Exterior' },
      { id: 'p-pierna', nombre: 'Piernas de Hoja Mampara', codigoPerfil: 'MAMP-201', formulaTexto: 'Alto vano - 55 mm', longitudMm: largoPierna, cantidad: 2, corte: 'Recto 90°', categoria: 'Hojas Móviles' },
      { id: 'p-traslape', nombre: 'Traslapes Mampara', codigoPerfil: 'MAMP-202', formulaTexto: 'Alto vano - 55 mm', longitudMm: largoTraslape, cantidad: 2, corte: 'Recto 90°', categoria: 'Hojas Móviles' },
      { id: 'p-zocalo', nombre: 'Zócalo Alto Pesado (10 cm)', codigoPerfil: 'MAMP-ZOC10', formulaTexto: '(Ancho / 2) - 25 mm', longitudMm: largoZocaloAlto, cantidad: 2, corte: 'Recto 90°', categoria: 'Hojas Móviles' },
      { id: 'p-cabezal', nombre: 'Cabezales Superiores Mampara', codigoPerfil: 'MAMP-204', formulaTexto: '(Ancho / 2) - 25 mm', longitudMm: largoCabezal, cantidad: 2, corte: 'Recto 90°', categoria: 'Hojas Móviles' },
    ];

    const anchoPanoMm = Math.max(0, Math.round((ancho / 2) - 25));
    const altoPanoMm = Math.max(0, Math.round(alto - 150)); // Zócalo alto reduce cristal
    const areaUnitM2 = Number(((anchoPanoMm / 1000) * (altoPanoMm / 1000)).toFixed(3));

    listaCristales = [
      { id: 'cristal-1', etiqueta: 'Paño Fijo Mampara (Templado)', tipo: configuracionApertura === 'OX' ? 'FIJO' : 'CORREDIZO', anchoMm: anchoPanoMm, altoMm: altoPanoMm, anchoCm: Number((anchoPanoMm / 10).toFixed(1)), altoCm: Number((altoPanoMm / 10).toFixed(1)), areaM2: areaUnitM2, cantidad: 1 },
      { id: 'cristal-2', etiqueta: 'Paño Corredizo Mampara (Templado)', tipo: 'CORREDIZO', anchoMm: anchoPanoMm, altoMm: altoPanoMm, anchoCm: Number((anchoPanoMm / 10).toFixed(1)), altoCm: Number((altoPanoMm / 10).toFixed(1)), areaM2: areaUnitM2, cantidad: 1 },
    ];

    const metrosFelpa = Number((((largoPierna * 4) + (largoZocaloAlto * 4)) / 1000 * 1.2).toFixed(2));
    const metrosVinil = Number(((areaUnitM2 * 2 * 4) * 0.9).toFixed(2));

    accesorios = [
      { id: 'acc-1', nombre: 'Carretillas dobles regulables de bronce para mampara', cantidad: 4, unidad: 'und', precioUnit: 18.0 },
      { id: 'acc-2', nombre: 'Cerradura embutida con llave para mampara', cantidad: 1, unidad: 'und', precioUnit: 38.0 },
      { id: 'acc-3', nombre: 'Felpa aislante pesada siliconada', cantidad: metrosFelpa, unidad: 'ml', precioUnit: 3.5 },
      { id: 'acc-4', nombre: 'Empaque de jebe para mampara', cantidad: metrosVinil, unidad: 'ml', precioUnit: 2.8 },
      { id: 'acc-5', nombre: 'Topes y frenos de impacto', cantidad: 4, unidad: 'und', precioUnit: 5.0 },
      { id: 'acc-6', nombre: 'Tornillos de fijación estructural a muro', cantidad: 20, unidad: 'und', precioUnit: 1.0 },
    ];

  } else if (tipoEstructura === 'MAMPARA_NOVA_2H') {
    // Sistema Nova Templado
    const largoRielSup = Math.max(0, ancho);
    const largoGuiaPiso = Math.max(0, Math.round(ancho / 2));
    const largoUPerimetral = Math.max(0, alto);

    perfilesAluminio = [
      { id: 'p-riel-sup', nombre: 'Riel Superior Sistema Nova', codigoPerfil: 'NOVA-101', formulaTexto: 'Ancho total vano', longitudMm: largoRielSup, cantidad: 1, corte: 'Recto 90°', categoria: 'Herraje Superior' },
      { id: 'p-guia-inf', nombre: 'Guía Inferior embutida / Guía Piso', codigoPerfil: 'NOVA-102', formulaTexto: 'Ancho móvil (Ancho / 2)', longitudMm: largoGuiaPiso, cantidad: 1, corte: 'Recto 90°', categoria: 'Piso' },
      { id: 'p-perfil-u', nombre: 'Perfil U para Fijo lateral', codigoPerfil: 'NOVA-U15', formulaTexto: 'Alto vano', longitudMm: largoUPerimetral, cantidad: 2, corte: 'Recto 90°', categoria: 'Fijación Fijo' },
    ];

    const anchoPanoFijo = Math.max(0, Math.round((ancho / 2) - 10));
    const anchoPanoMovil = Math.max(0, Math.round((ancho / 2) + 30)); // Traslape de 40mm
    const altoPano = Math.max(0, Math.round(alto - 50));
    const areaFijo = Number(((anchoPanoFijo / 1000) * (altoPano / 1000)).toFixed(3));
    const areaMovil = Number(((anchoPanoMovil / 1000) * (altoPano / 1000)).toFixed(3));

    listaCristales = [
      { id: 'cristal-1', etiqueta: 'Paño Fijo Templado Nova', tipo: 'FIJO', anchoMm: anchoPanoFijo, altoMm: altoPano, anchoCm: Number((anchoPanoFijo / 10).toFixed(1)), altoCm: Number((altoPano / 10).toFixed(1)), areaM2: areaFijo, cantidad: 1 },
      { id: 'cristal-2', etiqueta: 'Paño Corredizo Templado Nova', tipo: 'CORREDIZO', anchoMm: anchoPanoMovil, altoMm: altoPano, anchoCm: Number((anchoPanoMovil / 10).toFixed(1)), altoCm: Number((altoPano / 10).toFixed(1)), areaM2: areaMovil, cantidad: 1 },
    ];

    accesorios = [
      { id: 'acc-1', nombre: 'Kit de rodamientos de acero inoxidable Nova', cantidad: 2, unidad: 'jgo', precioUnit: 65.0 },
      { id: 'acc-2', nombre: 'Freno / Tope magnético Nova', cantidad: 2, unidad: 'und', precioUnit: 15.0 },
      { id: 'acc-3', nombre: 'Tirador tubular de acero inox 30 cm', cantidad: 1, unidad: 'und', precioUnit: 45.0 },
      { id: 'acc-4', nombre: 'Cerradura de piso pico de loro', cantidad: 1, unidad: 'und', precioUnit: 35.0 },
      { id: 'acc-5', nombre: 'Silicona estructural Dow Corning 795', cantidad: 2, unidad: 'tubo', precioUnit: 28.0 },
    ];

  } else if (tipoEstructura === 'FIJO_PANAL') {
    // Paño Fijo con Junquillo
    const marcoAncho = ancho;
    const marcoAlto = alto;
    const junquilloAncho = Math.max(0, ancho - 50);
    const junquilloAlto = Math.max(0, alto - 50);

    perfilesAluminio = [
      { id: 'p-marco-sup', nombre: 'Marco Perimétrico Superior', codigoPerfil: 'PAN-101', formulaTexto: 'Ancho vano', longitudMm: marcoAncho, cantidad: 1, corte: 'Inglete 45°', categoria: 'Marco Perimétrico' },
      { id: 'p-marco-inf', nombre: 'Marco Perimétrico Inferior', codigoPerfil: 'PAN-102', formulaTexto: 'Ancho vano', longitudMm: marcoAncho, cantidad: 1, corte: 'Inglete 45°', categoria: 'Marco Perimétrico' },
      { id: 'p-marco-jambas', nombre: 'Marco Perimétrico Laterales', codigoPerfil: 'PAN-103', formulaTexto: 'Alto vano', longitudMm: marcoAlto, cantidad: 2, corte: 'Inglete 45°', categoria: 'Marco Perimétrico' },
      { id: 'p-junq-horiz', nombre: 'Junquillos Horizontales', codigoPerfil: 'PAN-JUNQ', formulaTexto: 'Ancho vano - 50 mm', longitudMm: junquilloAncho, cantidad: 2, corte: 'Recto 90°', categoria: 'Sujeción Cristal' },
      { id: 'p-junq-vert', nombre: 'Junquillos Verticales', codigoPerfil: 'PAN-JUNQ', formulaTexto: 'Alto vano - 50 mm', longitudMm: junquilloAlto, cantidad: 2, corte: 'Recto 90°', categoria: 'Sujeción Cristal' },
    ];

    const anchoVidrio = Math.max(0, Math.round(ancho - 30));
    const altoVidrio = Math.max(0, Math.round(alto - 30));
    const areaVidrio = Number(((anchoVidrio / 1000) * (altoVidrio / 1000)).toFixed(3));

    listaCristales = [
      { id: 'cristal-1', etiqueta: 'Cristal Paño Fijo Entero', tipo: 'FIJO', anchoMm: anchoVidrio, altoMm: altoVidrio, anchoCm: Number((anchoVidrio / 10).toFixed(1)), altoCm: Number((altoVidrio / 10).toFixed(1)), areaM2: areaVidrio, cantidad: 1 },
    ];

    accesorios = [
      { id: 'acc-1', nombre: 'Jebe cuña / Vinil de presión para junquillo', cantidad: Number((((anchoVidrio * 2) + (altoVidrio * 2)) / 1000).toFixed(2)), unidad: 'ml', precioUnit: 2.2 },
      { id: 'acc-2', nombre: 'Tacos de centrado de neopreno', cantidad: 6, unidad: 'und', precioUnit: 1.5 },
      { id: 'acc-3', nombre: 'Tornillos autorroscantes #8x1.5"', cantidad: 16, unidad: 'und', precioUnit: 0.3 },
      { id: 'acc-4', nombre: 'Sellador acrílico perimétrico Sikaflex', cantidad: 1, unidad: 'tubo', precioUnit: 24.0 },
    ];

  } else {
    // Proyectante u otro
    const largoMarcoAncho = ancho;
    const largoMarcoAlto = alto;
    const largoHojaAncho = Math.max(0, ancho - 40);
    const largoHojaAlto = Math.max(0, alto - 40);

    perfilesAluminio = [
      { id: 'p-marco-h', nombre: 'Marco Exterior Horizontal', codigoPerfil: 'PR-101', formulaTexto: 'Ancho vano', longitudMm: largoMarcoAncho, cantidad: 2, corte: 'Inglete 45°', categoria: 'Marco Exterior' },
      { id: 'p-marco-v', nombre: 'Marco Exterior Vertical', codigoPerfil: 'PR-102', formulaTexto: 'Alto vano', longitudMm: largoMarcoAlto, cantidad: 2, corte: 'Inglete 45°', categoria: 'Marco Exterior' },
      { id: 'p-hoja-h', nombre: 'Hoja Móvil Horizontal', codigoPerfil: 'PR-201', formulaTexto: 'Ancho vano - 40 mm', longitudMm: largoHojaAncho, cantidad: 2, corte: 'Inglete 45°', categoria: 'Hoja Batiente' },
      { id: 'p-hoja-v', nombre: 'Hoja Móvil Vertical', codigoPerfil: 'PR-202', formulaTexto: 'Alto vano - 40 mm', longitudMm: largoHojaAlto, cantidad: 2, corte: 'Inglete 45°', categoria: 'Hoja Batiente' },
    ];

    const anchoVidrio = Math.max(0, Math.round(ancho - 90));
    const altoVidrio = Math.max(0, Math.round(alto - 90));
    const areaVidrio = Number(((anchoVidrio / 1000) * (altoVidrio / 1000)).toFixed(3));

    listaCristales = [
      { id: 'cristal-1', etiqueta: 'Cristal Hoja Proyectante', tipo: 'PROYECTANTE', anchoMm: anchoVidrio, altoMm: altoVidrio, anchoCm: Number((anchoVidrio / 10).toFixed(1)), altoCm: Number((altoVidrio / 10).toFixed(1)), areaM2: areaVidrio, cantidad: 1 },
    ];

    accesorios = [
      { id: 'acc-1', nombre: 'Brazos de fricción de acero inoxidable 12"', cantidad: 2, unidad: 'und', precioUnit: 24.0 },
      { id: 'acc-2', nombre: 'Manija aldaba proyectante con recibidor', cantidad: 1, unidad: 'und', precioUnit: 18.0 },
      { id: 'acc-3', nombre: 'Empaque de hermeticidad EPDM', cantidad: Number((((largoHojaAncho * 2) + (largoHojaAlto * 2)) / 1000).toFixed(2)), unidad: 'ml', precioUnit: 2.8 },
      { id: 'acc-4', nombre: 'Tornillos autorroscantes inox #8x1"', cantidad: 16, unidad: 'und', precioUnit: 0.4 },
    ];
  }

  // Lista aplanada para el optimizador de varillas
  const cortesParaOptimizador = perfilesAluminio.map((p) => ({
    longitudMm: p.longitudMm,
    etiqueta: `${p.nombre} (${p.corte})`,
    cantidad: p.cantidad,
  }));

  // Metros lineales totales de perfil requeridos
  const totalMetrosLinealesPerfil = Number(
    (perfilesAluminio.reduce((acc, p) => acc + (p.longitudMm * p.cantidad), 0) / 1000).toFixed(2)
  );

  // Estimación de varillas de 6.00 m (redondeo hacia arriba con holgura)
  const varillasEstimadas = Math.ceil((totalMetrosLinealesPerfil * 1.08) / 6.0);

  // Costeo preliminar
  const precioVarillaAjustado = estructuraInfo.precioBaseVarilla * (1 + colorInfo.recargoPorcentaje);
  const costoTotalAluminio = varillasEstimadas * precioVarillaAjustado;

  const areaTotalVidrioM2 = Number(
    listaCristales.reduce((acc, c) => acc + (c.areaM2 * c.cantidad), 0).toFixed(3)
  );
  const costoTotalVidrio = areaTotalVidrioM2 * cristalInfo.precioM2;

  const costoTotalAccesorios = accesorios.reduce((acc, a) => acc + (a.cantidad * a.precioUnit), 0);
  const costoManoObra = estructuraInfo.costoManoObraDefecto;

  const costoDirectoTotal = costoTotalAluminio + costoTotalVidrio + costoTotalAccesorios + costoManoObra;
  const precioVentaSugerido = Math.ceil(costoDirectoTotal / (1 - Math.min(0.6, Math.max(0.1, margenUtilidad))));
  const utilidadEstimada = precioVentaSugerido - costoDirectoTotal;

  return {
    estructuraInfo,
    colorInfo,
    cristalInfo,
    anchoVanoMm: ancho,
    altoVanoMm: alto,
    areaVanoM2: Number(((ancho / 1000) * (alto / 1000)).toFixed(2)),
    perimetroVanoMl: Number((((ancho * 2) + (alto * 2)) / 1000).toFixed(2)),
    perfilesAluminio,
    cortesParaOptimizador,
    listaCristales,
    accesorios,
    totalMetrosLinealesPerfil,
    varillasEstimadas,
    areaTotalVidrioM2,
    costeo: {
      precioVarillaUnitario: Number(precioVarillaAjustado.toFixed(2)),
      costoTotalAluminio: Math.ceil(costoTotalAluminio),
      costoTotalVidrio: Math.ceil(costoTotalVidrio),
      costoTotalAccesorios: Math.ceil(costoTotalAccesorios),
      costoManoObra: Math.ceil(costoManoObra),
      costoDirectoTotal: Math.ceil(costoDirectoTotal),
      precioVentaSugerido: Math.ceil(precioVentaSugerido),
      utilidadEstimada: Math.ceil(utilidadEstimada),
      margenUtilidadPorcentaje: Math.round(margenUtilidad * 100),
    },
  };
}
