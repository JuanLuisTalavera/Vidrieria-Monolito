import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import DiagramaPlanchaVidrioSVG from './components/DiagramaPlanchaVidrioSVG';
import { normalizarResultadoVidrio } from '../utils/optimizadorVidrioHelper';

// Presets de planchas completas y retazos comunes de taller
const PRESETS_PLANCHA = [
  { label: '3210 × 2140 (Jumbo Estándar)', ancho: 3210, alto: 2140, icon: '🏭' },
  { label: '2600 × 1800 (Mediana)', ancho: 2600, alto: 1800, icon: '📐' },
  { label: '2440 × 1830 (8×6 pies)', ancho: 2440, alto: 1830, icon: '📦' },
  { label: '1500 × 1000 (Retazo Taller Mediano)', ancho: 1500, alto: 1000, icon: '✂️' },
  { label: '1000 × 600 (Retazo Taller Chico)', ancho: 1000, alto: 600, icon: '🔍' },
];

// Presets de piezas comunes que los clientes piden al vuelo
const PRESETS_PIEZAS_RAPIDAS = [
  { etiqueta: 'Ventana Fija 80x60', ancho: 800, alto: 600, cantidad: 1 },
  { etiqueta: 'Repisa 60x20', ancho: 600, alto: 200, cantidad: 2 },
  { etiqueta: 'Cuadro 40x30', ancho: 400, alto: 300, cantidad: 1 },
  { etiqueta: 'Mesa de Centro 90x50', ancho: 900, alto: 500, cantidad: 1 },
];

// 3. Auto-Conversión Inteligente (Metros a Milímetros)
// Si el valor recibido es menor a 100 (ej. 2.44 o 3.21), se multiplica automáticamente por 1000 para setearlo en mm (2440 o 3210).
const convertirAMilimetros = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;
  const num = Number(valor);
  if (isNaN(num) || num <= 0) return null;
  return num < 100 ? Math.round(num * 1000) : Math.round(num);
};

// 2. Lee el ancho y alto verificando las propiedades anchoPlancha y altoPlancha (o anchoPlanchaMm)
const resolverDimensionesVidrio = (vidrio) => {
  if (!vidrio) return { anchoMm: null, altoMm: null };

  const rawW =
    vidrio.anchoPlancha !== undefined && vidrio.anchoPlancha !== null && Number(vidrio.anchoPlancha) > 0
      ? vidrio.anchoPlancha
      : vidrio.anchoPlanchaMm;

  const rawH =
    vidrio.altoPlancha !== undefined && vidrio.altoPlancha !== null && Number(vidrio.altoPlancha) > 0
      ? vidrio.altoPlancha
      : vidrio.altoPlanchaMm;

  const anchoMm = convertirAMilimetros(rawW);
  const altoMm = convertirAMilimetros(rawH);

  return { anchoMm, altoMm };
};

export default function TrazadorVidriosLibrePage() {
  // 1. Plancha Base / Retazo
  const [anchoPlancha, setAnchoPlancha] = useState(3210);
  const [altoPlancha, setAltoPlancha] = useState(2140);
  const [permitirRotacion, setPermitirRotacion] = useState(true);
  const [tipoCristalId, setTipoCristalId] = useState('');
  const [vidrioReferencia, setVidrioReferencia] = useState(null);

  // 1. Catálogo de cristales poblado estrictamente desde el API
  const [vidrios, setVidrios] = useState([]);
  const [cargandoVidrios, setCargandoVidrios] = useState(true);

  const location = useLocation();

  // 2. Formulario de Entrada Rápida de Piezas a Cortar
  const [piezas, setPiezas] = useState([]);

  // Precarga automática si venimos desde CotizadorVidriosPage u otra pantalla
  useEffect(() => {
    if (location.state) {
      if (Array.isArray(location.state.piezas) && location.state.piezas.length > 0) {
        setPiezas(location.state.piezas);
      } else if (location.state.anchoMm && location.state.altoMm) {
        setPiezas([
          {
            id: String(Date.now()),
            etiqueta: location.state.etiqueta || `Vidrio Suelto ${location.state.anchoMm}×${location.state.altoMm}`,
            anchoMm: Number(location.state.anchoMm),
            altoMm: Number(location.state.altoMm),
            cantidad: Number(location.state.cantidad) || 1,
          },
        ]);
      }
      if (location.state.tipoCristalId) {
        setTipoCristalId(String(location.state.tipoCristalId));
      }
    }
  }, [location.state]);

  const [inputAncho, setInputAncho] = useState('');
  const [inputAlto, setInputAlto] = useState('');
  const [inputCantidad, setInputCantidad] = useState(1);
  const [inputEtiqueta, setInputEtiqueta] = useState('');

  const refInputAncho = useRef(null);

  // 3. Estados de Optimización Asíncrona basada en Jobs
  const [datosOptimizacion, setDatosOptimizacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);
  const [progresoJob, setProgresoJob] = useState(null);
  const [deteniendo, setDeteniendo] = useState(false);
  const [errorOptimizacion, setErrorOptimizacion] = useState(null);

  // Referencias para control de temporizadores y evitar memory leaks
  const pollingIntervalRef = useRef(null);
  const cronometroIntervalRef = useRef(null);
  const activeJobIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const isMountedRef = useRef(true);

  // Limpieza rigurosa de intervalos
  const limpiarTemporizadores = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (cronometroIntervalRef.current) {
      clearInterval(cronometroIntervalRef.current);
      cronometroIntervalRef.current = null;
    }
  }, []);

  // Cleanup al desmontar componente
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      limpiarTemporizadores();
    };
  }, [limpiarTemporizadores]);

  // Formateador de tiempo visual MM:SS
  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${String(mins).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
  };

  // 1. Cargar catálogo de cristales estrictamente con GET a /api/v1/vidrios
  useEffect(() => {
    let isMounted = true;
    axiosClient
      .get('/api/v1/vidrios')
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res.data)) {
          setVidrios(res.data);
        }
      })
      .catch((err) => {
        console.error('Error al cargar catálogo de vidrios desde /api/v1/vidrios:', err);
      })
      .finally(() => {
        if (isMounted) setCargandoVidrios(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Cristal seleccionado o de referencia para costos
  const cristalSeleccionado = useMemo(() => {
    if (tipoCristalId) {
      return vidrios.find((v) => String(v.idVidrio ?? v.id) === String(tipoCristalId)) || null;
    }
    return vidrioReferencia || vidrios[0] || null;
  }, [vidrios, tipoCristalId, vidrioReferencia]);

  // 2. Lógica del onChange del Selector
  const handleSeleccionarVidrio = (e) => {
    const selectedId = e.target.value;
    setTipoCristalId(selectedId);

    if (!selectedId) {
      // Opción "Usar retazo / Medidas manuales"
      return;
    }

    // Busca el objeto completo en el estado devuelto por el API (vidrios)
    const vidrio = vidrios.find((v) => String(v.idVidrio ?? v.id) === String(selectedId));
    if (vidrio) {
      setVidrioReferencia(vidrio);
      // Lee y auto-convierte el ancho y alto a milímetros
      const { anchoMm, altoMm } = resolverDimensionesVidrio(vidrio);

      // Inyecta estos valores en los estados numéricos que controlan los inputs de "Ancho Plancha" y "Alto Plancha"
      if (anchoMm && anchoMm > 0) {
        setAnchoPlancha(anchoMm);
      }
      if (altoMm && altoMm > 0) {
        setAltoPlancha(altoMm);
      }
    }
  };

  // Aplicar preset de plancha o retazo
  const handleAplicarPresetPlancha = (preset) => {
    setAnchoPlancha(preset.ancho);
    setAltoPlancha(preset.alto);
    setTipoCristalId(''); // Cambia a retazo / medidas manuales
  };

  // 4. Flexibilidad: Modificación manual de ancho para retazos
  const handleCambioAncho = (e) => {
    setAnchoPlancha(Number(e.target.value) || 0);
    setTipoCristalId(''); // Cambia a retazo / medidas manuales
  };

  // 4. Flexibilidad: Modificación manual de alto para retazos
  const handleCambioAlto = (e) => {
    setAltoPlancha(Number(e.target.value) || 0);
    setTipoCristalId(''); // Cambia a retazo / medidas manuales
  };

  // Agregar pieza desde formulario
  const handleAgregarPieza = (e) => {
    if (e) e.preventDefault();

    const w = Math.round(Number(inputAncho) || 0);
    const h = Math.round(Number(inputAlto) || 0);
    const cant = Math.max(1, parseInt(inputCantidad, 10) || 1);

    if (w <= 0 || h <= 0) {
      alert('Por favor ingresa un ancho y alto válidos en milímetros.');
      refInputAncho.current?.focus();
      return;
    }

    const nuevaPieza = {
      id: String(Date.now()),
      etiqueta: inputEtiqueta.trim() || `Corte #${piezas.length + 1} (${w}×${h})`,
      anchoMm: w,
      altoMm: h,
      cantidad: cant,
    };

    setPiezas((prev) => [...prev, nuevaPieza]);

    // Limpiar inputs y devolver foco para entrada continua
    setInputAncho('');
    setInputAlto('');
    setInputCantidad(1);
    setInputEtiqueta('');
    refInputAncho.current?.focus();
  };

  // Agregar preset rápido de pieza
  const handleAgregarPresetPieza = (preset) => {
    const nuevaPieza = {
      id: String(Date.now()),
      etiqueta: preset.etiqueta,
      anchoMm: preset.ancho,
      altoMm: preset.alto,
      cantidad: preset.cantidad,
    };
    setPiezas((prev) => [...prev, nuevaPieza]);
  };

  // Eliminar pieza de la lista
  const handleEliminarPieza = (id) => {
    setPiezas((prev) => prev.filter((p) => p.id !== id));
  };

  // Duplicar pieza en la lista
  const handleDuplicarPieza = (p) => {
    const duplicada = {
      ...p,
      id: String(Date.now()),
      etiqueta: `${p.etiqueta} (Copia)`,
    };
    setPiezas((prev) => [...prev, duplicada]);
  };

  // Limpiar todas las piezas
  const handleLimpiarPiezas = () => {
    if (piezas.length === 0) return;
    if (window.confirm('¿Deseas limpiar todos los cortes ingresados?')) {
      setPiezas([]);
      setDatosOptimizacion(null);
    }
  };

  // Métricas de piezas ingresadas
  const metricasPiezas = useMemo(() => {
    const totalCortes = piezas.reduce((acc, p) => acc + p.cantidad, 0);
    const areaTotalCortesM2 = piezas.reduce(
      (acc, p) => acc + ((p.anchoMm * p.altoMm) / 1_000_000) * p.cantidad,
      0
    );
    const areaPlanchaM2 = (Number(anchoPlancha) * Number(altoPlancha)) / 1_000_000;
    const aprovechamientoTeorico = areaPlanchaM2 > 0 ? (areaTotalCortesM2 / areaPlanchaM2) * 100 : 0;

    const precioM2 = Number(
      cristalSeleccionado?.precioPublicoM2 ??
      cristalSeleccionado?.costoDefectoM2 ??
      cristalSeleccionado?.precioPlancha ??
      55
    );
    const precioEstimadoVenta = areaTotalCortesM2 * precioM2;

    return {
      totalCortes,
      areaTotalCortesM2: Number(areaTotalCortesM2.toFixed(3)),
      areaPlanchaM2: Number(areaPlanchaM2.toFixed(2)),
      aprovechamientoTeorico: Number(aprovechamientoTeorico.toFixed(1)),
      precioEstimadoVenta: Math.ceil(precioEstimadoVenta),
      precioM2,
    };
  }, [piezas, anchoPlancha, altoPlancha, cristalSeleccionado]);

  // 1. Polling recurrente de estado del job
  const pollJobStatus = useCallback(
    async (idJob) => {
      if (!idJob || !isMountedRef.current) return;

      try {
        const res = await axiosClient.get(`/api/v1/optimizador-corte/vidrio/status/${idJob}`);
        if (!isMountedRef.current || !res.data) return;

        const jobData = res.data;
        setProgresoJob(jobData);

        const estado = String(jobData.estado || '').toUpperCase();

        if (estado === 'COMPLETADO' || estado === 'DETENIDO') {
          limpiarTemporizadores();
          if (jobData.resultado) {
            const normalizado = normalizarResultadoVidrio(jobData.resultado, anchoPlancha, altoPlancha);
            setDatosOptimizacion(normalizado);
            setErrorOptimizacion(null);
          }
          setLoading(false);
          setDeteniendo(false);
        } else if (estado === 'ERROR') {
          limpiarTemporizadores();
          setErrorOptimizacion(jobData.mensaje || 'Error en el cálculo del algoritmo genético en el servidor.');
          setLoading(false);
          setDeteniendo(false);
        }
      } catch (err) {
        console.error('Error al consultar estado del job:', err);
        if (err.response?.status === 404) {
          limpiarTemporizadores();
          setErrorOptimizacion('La tarea de optimización expiró o no fue encontrada en el servidor.');
          setLoading(false);
          setDeteniendo(false);
        }
      }
    },
    [anchoPlancha, altoPlancha, limpiarTemporizadores]
  );

  // 2. Iniciar optimización asíncrona (POST para obtener jobId y comenzar polling)
  const handleOptimizarCorte = async () => {
    if (piezas.length === 0) {
      alert('Por favor agrega al menos una pieza a cortar.');
      refInputAncho.current?.focus();
      return;
    }

    if (!anchoPlancha || !altoPlancha || anchoPlancha <= 0 || altoPlancha <= 0) {
      alert('Especifica las dimensiones de la plancha base o retazo.');
      return;
    }

    limpiarTemporizadores();
    setLoading(true);
    setDeteniendo(false);
    setErrorOptimizacion(null);
    setSegundosTranscurridos(0);
    setProgresoJob(null);

    const payload = {
      anchoPlancha: Math.round(Number(anchoPlancha) || 3210),
      altoPlancha: Math.round(Number(altoPlancha) || 2140),
      permitirRotacion: Boolean(permitirRotacion),
      tipoVidrio: cristalSeleccionado?.nombre || 'Cristal Incoloro',
      espesorMm: Number(cristalSeleccionado?.espesorMm) || 6,
      piezas: piezas
        .map((p, idx) => ({
          anchoMm: Math.round(Number(p.anchoMm) || 0),
          altoMm: Math.round(Number(p.altoMm) || 0),
          cantidad: Math.max(1, parseInt(p.cantidad, 10) || 1),
          descripcion: String(p.etiqueta || p.descripcion || `Pieza #${idx + 1}`).trim(),
        }))
        .filter((p) => p.anchoMm > 0 && p.altoMm > 0),
    };

    try {
      const res = await axiosClient.post('/api/v1/optimizador-corte/vidrio', payload);

      // Si el backend retornó directamente resultado síncrono
      if (res.data?.planchas) {
        const normalizado = normalizarResultadoVidrio(res.data, anchoPlancha, altoPlancha);
        setDatosOptimizacion(normalizado);
        setLoading(false);
        return;
      }

      const nuevoJobId = res.data?.jobId;
      if (!nuevoJobId) {
        throw new Error('El backend no devolvió un identificador de tarea (jobId).');
      }

      setJobId(nuevoJobId);
      activeJobIdRef.current = nuevoJobId;

      // Iniciar Cronómetro en tiempo real
      startTimeRef.current = Date.now();
      cronometroIntervalRef.current = setInterval(() => {
        if (isMountedRef.current && startTimeRef.current) {
          const transcurrido = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setSegundosTranscurridos(transcurrido);
        }
      }, 1000);

      // Primer chequeo inmediato
      pollJobStatus(nuevoJobId);

      // Intervalo de Polling cada 1 segundo (1000 ms)
      pollingIntervalRef.current = setInterval(() => {
        pollJobStatus(nuevoJobId);
      }, 1000);
    } catch (err) {
      console.error('Error al iniciar job de optimización:', err);
      limpiarTemporizadores();
      setErrorOptimizacion(
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        'Ocurrió un error al enviar la tarea de optimización al servidor.'
      );
      setLoading(false);
    }
  };

  // 3. Detener algoritmo y obtener el mejor resultado parcial alcanzado
  const handleDetenerOptimizacion = async () => {
    const idJobActual = activeJobIdRef.current || jobId;
    if (!idJobActual) return;

    setDeteniendo(true);

    try {
      // Notificar al backend la señal de detención inmediata
      await axiosClient.post(`/api/v1/optimizador-corte/vidrio/stop/${idJobActual}`);

      limpiarTemporizadores();

      // Consultar el estado para recuperar el mejor resultado parcial guardado
      let resultadoObtenido = null;
      for (let intento = 0; intento < 5 && !resultadoObtenido && isMountedRef.current; intento++) {
        try {
          const res = await axiosClient.get(`/api/v1/optimizador-corte/vidrio/status/${idJobActual}`);
          if (res.data?.resultado) {
            resultadoObtenido = res.data.resultado;
            break;
          }
        } catch (e) {
          console.warn('Reintento al recuperar resultado parcial:', e);
        }
        await new Promise((r) => setTimeout(r, 200));
      }

      if (resultadoObtenido) {
        const normalizado = normalizarResultadoVidrio(resultadoObtenido, anchoPlancha, altoPlancha);
        setDatosOptimizacion(normalizado);
        setErrorOptimizacion(null);
      } else {
        setErrorOptimizacion('El cálculo se detuvo, pero no se pudo extraer una solución parcial.');
      }
    } catch (err) {
      console.error('Error al solicitar detención del job:', err);
      limpiarTemporizadores();
      setErrorOptimizacion('Error de comunicación al solicitar detener el algoritmo.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setDeteniendo(false);
      }
    }
  };

  // Nota: El cálculo de corte 2D solo se ejecuta manualmente al presionar "Optimizar"

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ======================================================== */}
      {/* 1. ENCABEZADO PRINCIPAL DE LA CALCULADORA                */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 text-xl font-bold">
              🪟
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Trazador de Vidrios 2D & Optimizador de Retazos
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Calculadora Rápida
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Acomodo milimétrico para ventas de vidrios sueltos sobre planchas completas o retazos de taller
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOptimizarCorte}
            disabled={loading || piezas.length === 0}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              loading || piezas.length === 0
                ? 'bg-sky-400 text-white/90 cursor-not-allowed opacity-75'
                : 'bg-sky-600 hover:bg-sky-700 hover:shadow text-white active:scale-98 cursor-pointer'
            }`}
          >
            {loading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin text-white shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Calculando mejor opción...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Optimizar Corte 2D</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. GRID PRINCIPAL: CALCULADORA (IZQ) Y PLANO SVG (DER)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL IZQUIERDO: PLANCHA BASE + ENTRADA DE PIEZAS */}
        <div className="lg:col-span-5 space-y-5">
          {/* CARD 1: PLANCHA BASE O RETAZO */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>🏭</span>
                <span>Plancha Base / Retazo Matriz</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400 font-bold">
                {metricasPiezas.areaPlanchaM2} m²
              </span>
            </div>

            {/* Único Selector de Cristal del Inventario */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>📦</span>
                  <span>Seleccionar Cristal del Inventario</span>
                </span>
                {cargandoVidrios && (
                  <span className="text-[10px] text-slate-400 font-normal animate-pulse">Cargando catálogo...</span>
                )}
              </label>
              <select
                value={tipoCristalId}
                onChange={handleSeleccionarVidrio}
                disabled={cargandoVidrios}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer shadow-2xs"
              >
                <option value="">Usar retazo / Medidas manuales</option>
                {vidrios.map((v) => {
                  const idV = String(v.idVidrio ?? v.id);
                  const { anchoMm, altoMm } = resolverDimensionesVidrio(v);
                  const dims = anchoMm && altoMm ? ` (${anchoMm} × ${altoMm} mm)` : '';
                  const precio = Number(v.precioPublicoM2 ?? v.costoDefectoM2 ?? 55).toFixed(2);
                  return (
                    <option key={`inv-vidrio-${idV}`} value={idV}>
                      {v.nombre || v.tipo || `Vidrio #${idV}`}{dims} - S/ {precio}/m²
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Presets de plancha o retazo */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                Presets Rápidos (Plancha o Retazo):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS_PLANCHA.map((p) => {
                  const activo = !tipoCristalId && anchoPlancha === p.ancho && altoPlancha === p.alto;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleAplicarPresetPlancha(p)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        activo
                          ? 'bg-sky-600 text-white border-sky-600 shadow-2xs font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs de dimensiones de la plancha */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ancho Plancha (mm) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  value={anchoPlancha}
                  onChange={handleCambioAncho}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alto Plancha (mm) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="100"
                  max="6000"
                  value={altoPlancha}
                  onChange={handleCambioAlto}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Configuración de Corte: Rotación 90° */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={permitirRotacion}
                  onChange={(e) => setPermitirRotacion(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
                <span>Permitir rotar piezas a 90° (Mejor acomodo)</span>
              </label>
            </div>
          </div>

          {/* CARD 2: FORMULARIO DE ENTRADA RÁPIDA DE PIEZAS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span>✂️</span>
                  <span>Piezas a Cortar</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Ingresa las medidas y presiona <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">Enter</kbd> para agregar
                </p>
              </div>

              {piezas.length > 0 && (
                <button
                  type="button"
                  onClick={handleLimpiarPiezas}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  Limpiar lista
                </button>
              )}
            </div>

            {/* Fila de inputs de entrada rápida */}
            <form onSubmit={handleAgregarPieza} className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs items-end">
                <div className="col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">Ancho (mm)</label>
                  <input
                    ref={refInputAncho}
                    type="number"
                    min="50"
                    placeholder="ej. 800"
                    value={inputAncho}
                    onChange={(e) => setInputAncho(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">Alto (mm)</label>
                  <input
                    type="number"
                    min="50"
                    placeholder="ej. 600"
                    value={inputAlto}
                    onChange={(e) => setInputAlto(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Cant.</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={inputCantidad}
                    onChange={(e) => setInputCantidad(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-300 font-bold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="col-span-4">
                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>➕</span>
                    <span>Agregar</span>
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Etiqueta / Descripción opcional (ej. Ventana baño, Mesa, Repisa...)"
                  value={inputEtiqueta}
                  onChange={(e) => setInputEtiqueta(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </form>

            {/* Atajos de cortes frecuentes */}
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Atajos de cortes comunes:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS_PIEZAS_RAPIDAS.map((preset) => (
                  <button
                    key={preset.etiqueta}
                    type="button"
                    onClick={() => handleAgregarPresetPieza(preset)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-200 cursor-pointer"
                  >
                    +{preset.etiqueta} ({preset.ancho}×{preset.alto})
                  </button>
                ))}
              </div>
            </div>

            {/* TABLA DE PIEZAS AGREGADAS */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {piezas.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No hay piezas agregadas aún. Ingresa medidas arriba para comenzar el trazado.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Pieza</th>
                        <th className="px-3 py-2 text-center">Medida</th>
                        <th className="px-2 py-2 text-center">Cant.</th>
                        <th className="px-3 py-2 text-right">Área m²</th>
                        <th className="px-2 py-2 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {piezas.map((p, idx) => {
                        const areaM2 = ((p.anchoMm * p.altoMm) / 1_000_000) * p.cantidad;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80">
                            <td className="px-3 py-2 text-slate-800 font-bold truncate max-w-[130px]">
                              {p.etiqueta}
                            </td>
                            <td className="px-3 py-2 text-center font-mono text-slate-700">
                              {p.anchoMm} × {p.altoMm}
                            </td>
                            <td className="px-2 py-2 text-center font-bold text-slate-900">
                              {p.cantidad}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-slate-600">
                              {areaM2.toFixed(3)}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicarPieza(p)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5"
                                  title="Duplicar corte"
                                >
                                  📋
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEliminarPieza(p.id)}
                                  className="text-rose-500 hover:text-rose-800 p-0.5"
                                  title="Eliminar corte"
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* RESUMEN RÁPIDO DE COTIZACIÓN */}
            <div className="p-3.5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Total Piezas Programadas:</span>
                <strong className="font-mono text-white text-sm">{metricasPiezas.totalCortes} cortes</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Área Neta de Vidrio:</span>
                <strong className="font-mono text-sky-300">{metricasPiezas.areaTotalCortesM2} m²</strong>
              </div>
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/10">
                <div>
                  <span className="text-[11px] text-slate-400 block">Cotización Estimada:</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    (Base: S/ {metricasPiezas.precioM2}/m²)
                  </span>
                </div>
                <strong className="text-xl font-black text-emerald-400 font-mono">
                  S/ {metricasPiezas.precioEstimadoVenta}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: DIAGRAMA SVG DE CORTE 2D */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-2xl overflow-hidden shadow-2xs">
            {errorOptimizacion && !loading ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-800 space-y-3">
                <div className="text-3xl">⚠️</div>
                <h4 className="font-bold text-sm">No se pudo realizar el trazado</h4>
                <p className="text-xs text-rose-600 max-w-md mx-auto">{errorOptimizacion}</p>
                <button
                  type="button"
                  onClick={handleOptimizarCorte}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Reintentar Optimización
                </button>
              </div>
            ) : datosOptimizacion ? (
              <div className="space-y-4">
                <DiagramaPlanchaVidrioSVG
                  optimizacionVidrio={datosOptimizacion}
                  titulo={`Plano de Corte 2D - ${anchoPlancha} × ${altoPlancha} mm`}
                  subtitulo="Aprovechamiento y distribución exacta sobre lámina matriz"
                  unidadMedida="mm"
                />
              </div>
            ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
              {/* Encabezado del contenedor de plano de corte en blanco */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-100 text-slate-600 text-base font-bold shadow-2xs">
                      📐
                    </span>
                    <h3 className="text-base font-bold text-slate-800">
                      Plano de Corte 2D - {anchoPlancha} × {altoPlancha} mm
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Sin optimizar
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Lámina matriz lista ({metricasPiezas.areaPlanchaM2} m²)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    {piezas.length > 0
                      ? `${metricasPiezas.totalCortes} corte(s) pendiente(s)`
                      : 'Esperando cortes'}
                  </span>
                </div>
              </div>

              {/* Área visual con contorno de la plancha base vacía y mensaje tenue */}
              <div className="relative w-full p-4 sm:p-8 flex items-center justify-center min-h-[420px] bg-slate-50/40">
                {/* SVG del contorno técnico de la plancha base vacía */}
                <svg
                  viewBox={`-120 -80 ${Number(anchoPlancha) + 180} ${Number(altoPlancha) + 140}`}
                  className="w-full h-auto max-h-[520px] select-none"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    {/* Cuadrícula milimétrica sutil */}
                    <pattern
                      id="gridPlanchaVacia"
                      width="100"
                      height="100"
                      patternUnits="userSpaceOnUse"
                    >
                      <line x1="0" y1="0" x2="100" y2="0" stroke="#f1f5f9" strokeWidth="1.5" />
                      <line x1="0" y1="0" x2="0" y2="100" stroke="#f1f5f9" strokeWidth="1.5" />
                    </pattern>
                    {/* Marcadores de flechas para cotas */}
                    <marker
                      id="cotaFlechaVacia"
                      markerWidth="6"
                      markerHeight="6"
                      refX="3"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M 0 1.5 L 4.5 3 L 0 4.5 z" fill="#94a3b8" />
                    </marker>
                    <marker
                      id="cotaFlechaVaciaRev"
                      markerWidth="6"
                      markerHeight="6"
                      refX="3"
                      refY="3"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 4.5 3 L 0 4.5 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* Plancha Base Vacía: Fondo blanco con cuadrícula y borde punteado técnico */}
                  <rect
                    x="0"
                    y="0"
                    width={anchoPlancha}
                    height={altoPlancha}
                    fill="#ffffff"
                    stroke="#cbd5e1"
                    strokeWidth="3"
                    strokeDasharray="10 6"
                    rx="6"
                  />
                  <rect
                    x="0"
                    y="0"
                    width={anchoPlancha}
                    height={altoPlancha}
                    fill="url(#gridPlanchaVacia)"
                    rx="6"
                  />

                  {/* Cota Superior (Ancho) */}
                  <line
                    x1="0"
                    y1="-30"
                    x2={anchoPlancha}
                    y2="-30"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    markerStart="url(#cotaFlechaVaciaRev)"
                    markerEnd="url(#cotaFlechaVacia)"
                  />
                  <line x1="0" y1="-45" x2="0" y2="-10" stroke="#cbd5e1" strokeWidth="1" />
                  <line
                    x1={anchoPlancha}
                    y1="-45"
                    x2={anchoPlancha}
                    y2="-10"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <text
                    x={anchoPlancha / 2}
                    y="-40"
                    fill="#64748b"
                    fontSize="36"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {anchoPlancha} mm
                  </text>

                  {/* Cota Izquierda (Alto) */}
                  <line
                    x1="-30"
                    y1="0"
                    x2="-30"
                    y2={altoPlancha}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    markerStart="url(#cotaFlechaVaciaRev)"
                    markerEnd="url(#cotaFlechaVacia)"
                  />
                  <line x1="-45" y1="0" x2="-10" y2="0" stroke="#cbd5e1" strokeWidth="1" />
                  <line
                    x1="-45"
                    y1={altoPlancha}
                    x2="-10"
                    y2={altoPlancha}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <text
                    x="-45"
                    y={altoPlancha / 2}
                    fill="#64748b"
                    fontSize="36"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                    transform={`rotate(-90, -45, ${altoPlancha / 2})`}
                  >
                    {altoPlancha} mm
                  </text>
                </svg>

                {/* Mensaje tenue superpuesto */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                  <div className="max-w-md bg-white/95 backdrop-blur-xs px-6 py-5 rounded-2xl border border-slate-200/90 shadow-sm pointer-events-auto space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center text-2xl">
                      🪟
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">
                      Plano de corte vacío
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Ingresa las medidas y presiona <strong className="text-sky-600 font-semibold">Optimizar</strong> para generar el plano de corte
                    </p>

                    {piezas.length > 0 && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleOptimizarCorte}
                          disabled={loading}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            loading
                              ? 'bg-sky-400 text-white cursor-not-allowed opacity-75'
                              : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs cursor-pointer'
                          }`}
                        >
                          {loading ? (
                            <>
                              <svg
                                className="w-3.5 h-3.5 animate-spin text-white shrink-0"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                              </svg>
                              <span>Calculando mejor opción...</span>
                            </>
                          ) : (
                            <>
                              <span>⚡</span>
                              <span>Optimizar {metricasPiezas.totalCortes} corte{metricasPiezas.totalCortes > 1 ? 's' : ''} ahora</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL DE OPTIMIZACIÓN ASÍNCRONA (POLLING & DETENCIÓN)     */}
      {/* ======================================================== */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-xl">
                  🧬
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                    <span>Optimizando Cortes 2D</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                      En Ejecución
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Búsqueda metaheurística en servidor
                  </p>
                </div>
              </div>

              {/* Cronómetro Visual Compacto en Header */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono font-bold text-sky-400 text-xs shadow-inner">
                <span className="text-sm animate-pulse">⏱️</span>
                <span>{formatearTiempo(segundosTranscurridos)}</span>
              </div>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-6">
              {/* Spinner y Gran Cronómetro Visual */}
              <div className="text-center space-y-3">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-sky-100 border-t-sky-600 animate-spin" />
                  <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center text-2xl shadow-inner select-none">
                    📐
                  </div>
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-slate-100 border border-slate-200 font-mono font-extrabold text-slate-800 text-3xl tracking-wider shadow-inner">
                    <span className="text-xl text-slate-500">⏱️</span>
                    <span>{formatearTiempo(segundosTranscurridos)}</span>
                    <span className="text-xs font-sans font-bold text-slate-400 uppercase">seg</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mt-3">
                    Optimizando cortes mediante algoritmo genético. Esto puede tomar unos segundos...
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    El motor metaheurístico explora miles de permutaciones y giros a 90° para maximizar el aprovechamiento de la plancha matriz.
                  </p>
                </div>
              </div>

              {/* Métricas en vivo reportadas por el backend */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Iteraciones Calculadas
                  </span>
                  <strong className="font-mono text-slate-800 text-sm">
                    {progresoJob?.iteraciones !== undefined
                      ? Number(progresoJob.iteraciones).toLocaleString()
                      : 'Procesando...'}
                  </strong>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Mejor Rendimiento
                  </span>
                  <strong className="font-mono text-emerald-600 text-sm font-black">
                    {progresoJob?.mejorAprovechamientoActual
                      ? `${Number(progresoJob.mejorAprovechamientoActual).toFixed(1)}%`
                      : 'Buscando...'}
                  </strong>
                </div>

                {progresoJob?.mejorPlanchasActual && (
                  <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Planchas requeridas para mejor solución:</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {progresoJob.mejorPlanchasActual} {progresoJob.mejorPlanchasActual === 1 ? 'lámina' : 'láminas'}
                    </span>
                  </div>
                )}
              </div>

              {/* Barra de progreso de convergencia */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                  <span>Progreso de convergencia</span>
                  <span className="font-mono font-bold text-sky-600">
                    {progresoJob?.progreso
                      ? `${Math.round(Number(progresoJob.progreso) * 100)}%`
                      : 'Calculando...'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  {progresoJob?.progreso ? (
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, Math.round(Number(progresoJob.progreso) * 100)))}%` }}
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 rounded-full animate-pulse w-full" />
                  )}
                </div>
              </div>

              {/* Botón Rojo: Detener y ver resultado parcial */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDetenerOptimizacion}
                  disabled={deteniendo}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deteniendo ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      <span>Deteniendo y extrayendo mejor solución...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base">⏹️</span>
                      <span>Detener y ver resultado parcial</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Al presionar detener, el backend frena el algoritmo y devuelve la mejor distribución obtenida hasta ese milisegundo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
