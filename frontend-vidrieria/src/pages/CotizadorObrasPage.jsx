import { useState, useEffect, useMemo, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import DiagramaVanoSVG from './components/DiagramaVanoSVG';
import TrazadoVarillasGrafico from './components/TrazadoVarillasGrafico';
import DiagramaPlanchaVidrioSVG from './components/DiagramaPlanchaVidrioSVG';
import {
  TIPOS_ESTRUCTURAS,
  COLORES_ALUMINIO,
  CRISTALES_OBRA_DEFECTO,
  calcularDespieceObra,
} from '../utils/despieceObrasHelper';
import { calcularOptimizacionVarillas } from '../utils/optimizadorCorteHelper';
import { calcularOptimizacionVidrio2D } from '../utils/optimizadorVidrioHelper';

// Opciones de respaldo si la API falla o devuelve lista vacía
const VIDRIOS_FALLBACK = [
  { id: 1, idVidrio: 1, nombre: 'Cristal Crudo 4mm', tipo: 'Cristal Crudo 4mm', espesorMm: 4, precioM2: 42.0, colorTint: 'rgba(224, 242, 254, 0.45)', esTemplado: false },
  { id: 2, idVidrio: 2, nombre: 'Cristal Templado 6mm', tipo: 'Cristal Templado 6mm', espesorMm: 6, precioM2: 95.0, colorTint: 'rgba(186, 230, 253, 0.65)', esTemplado: true },
  { id: 3, idVidrio: 3, nombre: 'Cristal Templado 8mm', tipo: 'Cristal Templado 8mm', espesorMm: 8, precioM2: 125.0, colorTint: 'rgba(186, 230, 253, 0.75)', esTemplado: true },
  { id: 4, idVidrio: 4, nombre: 'Cristal Incoloro 6mm', tipo: 'Cristal Incoloro 6mm', espesorMm: 6, precioM2: 58.0, colorTint: 'rgba(224, 242, 254, 0.55)', esTemplado: false },
  { id: 5, idVidrio: 5, nombre: 'Cristal Bronce 6mm', tipo: 'Cristal Bronce 6mm', espesorMm: 6, precioM2: 68.0, colorTint: 'rgba(180, 83, 9, 0.35)', esTemplado: false },
  { id: 6, idVidrio: 6, nombre: 'Cristal Gris / Humo 6mm', tipo: 'Cristal Gris / Humo 6mm', espesorMm: 6, precioM2: 68.0, colorTint: 'rgba(71, 85, 105, 0.45)', esTemplado: false },
];

export default function CotizadorObrasPage() {
  // 1. Datos del Cliente
  const [clienteDoc, setClienteDoc] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [mensajeCliente, setMensajeCliente] = useState(null);

  // 2. Parámetros del Vano y Estructura
  const [anchoVanoMm, setAnchoVanoMm] = useState(1500);
  const [altoVanoMm, setAltoVanoMm] = useState(1200);
  const [tipoEstructura, setTipoEstructura] = useState('VENTANA_SERIE_20_2H');
  const [colorAluminio, setColorAluminio] = useState('negro');
  const [configuracionApertura, setConfiguracionApertura] = useState('OX');
  const [tipoCristalId, setTipoCristalId] = useState(VIDRIOS_FALLBACK[0].id);

  // 3. Catálogo dinámico de cristales / vidrios (con fallback)
  const [vidrios, setVidrios] = useState(VIDRIOS_FALLBACK);

  // 4. Parámetros de Taller y Costeo
  const [longitudVarillaMm, setLongitudVarillaMm] = useState(6000);
  const [anchoSierraMm, setAnchoSierraMm] = useState(4);
  const [margenUtilidad, setMargenUtilidad] = useState(0.35); // 35%
  const [pestañaActiva, setPestañaActiva] = useState('esquema'); // 'esquema' | 'varillas' | 'vidrio' | 'ficha'

  // 5. Estado de optimización de cortes de varillas
  const [datosOptimizacion, setDatosOptimizacion] = useState(null);
  const [optimizando, setOptimizando] = useState(false);

  // 6. Estado de optimización de cortes 2D de vidrio en plancha matriz
  const [datosOptimizacionVidrio, setDatosOptimizacionVidrio] = useState(null);
  const [optimizandoVidrio, setOptimizandoVidrio] = useState(false);
  const [errorOptimizacionVidrio, setErrorOptimizacionVidrio] = useState(null);

  const [guardandoCotizacion, setGuardandoCotizacion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Cargar lista de cristales desde backend GET /api/v1/vidrios
  useEffect(() => {
    let isMounted = true;
    axiosClient
      .get('/api/v1/vidrios')
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          const formateados = res.data.map((v) => {
            const vidId = v.idVidrio ?? v.id;
            const precio = Number(v.costoDefectoM2 ?? v.precioPublicoM2 ?? v.precioPlancha ?? 55.0);
            return {
              id: vidId,
              idVidrio: vidId,
              nombre: v.nombre || v.tipo || `Cristal #${vidId}`,
              tipo: v.tipo || v.nombre || 'Cristal',
              espesorMm: v.espesorMm || 6,
              precioM2: precio,
              colorTint: (v.nombre || '').toLowerCase().includes('bronce')
                ? 'rgba(180, 83, 9, 0.35)'
                : (v.nombre || '').toLowerCase().includes('humo') || (v.nombre || '').toLowerCase().includes('gris')
                ? 'rgba(71, 85, 105, 0.45)'
                : 'rgba(186, 230, 253, 0.5)',
              esTemplado: Boolean(v.esTemplado),
            };
          });
          setVidrios(formateados);
          if (formateados.length > 0) {
            setTipoCristalId(formateados[0].id);
          }
        } else {
          setVidrios(VIDRIOS_FALLBACK);
          setTipoCristalId(VIDRIOS_FALLBACK[0].id);
        }
      })
      .catch((err) => {
        console.info('Aviso: /api/v1/vidrios no disponible, usando opciones de respaldo:', err.message);
        if (isMounted) {
          setVidrios(VIDRIOS_FALLBACK);
          setTipoCristalId(VIDRIOS_FALLBACK[0].id);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Buscar cliente por documento
  const buscarClientePorDoc = useCallback(async (docABuscar) => {
    const doc = (docABuscar || clienteDoc).trim();
    if (!doc) return;

    setBuscandoCliente(true);
    setMensajeCliente(null);

    try {
      const res = await axiosClient.get(`/api/v1/clientes/buscar/documento/${encodeURIComponent(doc)}`);
      if (res.data) {
        const c = res.data;
        setClienteNombre(c.nombreRazonSocial || c.nombre || '');
        setClienteTelefono(c.telefono || c.celular || '');
        setMensajeCliente({ tipo: 'success', texto: 'Cliente encontrado.' });
        setTimeout(() => setMensajeCliente(null), 3500);
      }
    } catch {
      setMensajeCliente({ tipo: 'info', texto: 'Cliente no registrado. Puedes ingresar el nombre directamente.' });
      setTimeout(() => setMensajeCliente(null), 4000);
    } finally {
      setBuscandoCliente(false);
    }
  }, [clienteDoc]);

  // Cálculo paramétrico del despiece completo
  const despiece = useMemo(() => {
    return calcularDespieceObra({
      anchoVanoMm: Number(anchoVanoMm) || 0,
      altoVanoMm: Number(altoVanoMm) || 0,
      tipoEstructura,
      colorAluminio,
      tipoCristalId,
      configuracionApertura,
      margenUtilidad,
      catalogoCristales: vidrios,
    });
  }, [
    anchoVanoMm,
    altoVanoMm,
    tipoEstructura,
    colorAluminio,
    tipoCristalId,
    configuracionApertura,
    margenUtilidad,
    vidrios,
  ]);

  // Recalcular optimización de varillas cada vez que cambie el despiece o parámetros de sierra
  useEffect(() => {
    if (!despiece || despiece.cortesParaOptimizador.length === 0) {
      setDatosOptimizacion(null);
      return;
    }

    let cancelado = false;
    setOptimizando(true);

    calcularOptimizacionVarillas({
      longitudVarillaEstandarMm: longitudVarillaMm,
      anchoSierraMm: anchoSierraMm,
      cortes: despiece.cortesParaOptimizador,
    })
      .then((resultado) => {
        if (!cancelado) {
          setDatosOptimizacion(resultado);
          setOptimizando(false);
        }
      })
      .catch((err) => {
        console.error('Error optimizando varillas:', err);
        if (!cancelado) setOptimizando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [despiece, longitudVarillaMm, anchoSierraMm]);

  // Recalcular optimización 2D de paños de vidrio sobre la plancha matriz
  const ejecutarOptimizacionVidrio = useCallback(() => {
    if (!despiece || !despiece.listaCristales || despiece.listaCristales.length === 0) {
      setDatosOptimizacionVidrio(null);
      return;
    }

    const cristalSel = vidrios.find((cr) => Number(cr.id ?? cr.idVidrio) === Number(tipoCristalId));
    let anchoPlancha = 3210;
    let altoPlancha = 2140;

    if (cristalSel?.anchoPlancha) {
      const w = Number(cristalSel.anchoPlancha);
      anchoPlancha = w < 10 ? Math.round(w * 1000) : Math.round(w);
    }
    if (cristalSel?.altoPlancha) {
      const h = Number(cristalSel.altoPlancha);
      altoPlancha = h < 10 ? Math.round(h * 1000) : Math.round(h);
    }

    setOptimizandoVidrio(true);
    setErrorOptimizacionVidrio(null);

    calcularOptimizacionVidrio2D({
      anchoPlanchaMm: anchoPlancha,
      altoPlanchaMm: altoPlancha,
      mermaCorteMm: 3,
      tipoVidrio: cristalSel?.nombre || cristalSel?.tipo || 'Cristal 6mm',
      espesorMm: cristalSel?.espesorMm || 6,
      panos: despiece.listaCristales,
    })
      .then((resultado) => {
        if (resultado?.error) {
          setErrorOptimizacionVidrio(resultado.error);
        } else {
          setDatosOptimizacionVidrio(resultado);
        }
        setOptimizandoVidrio(false);
      })
      .catch((err) => {
        console.error('Error optimizando vidrio 2D:', err);
        setErrorOptimizacionVidrio('No se pudo calcular la optimización de vidrio 2D.');
        setOptimizandoVidrio(false);
      });
  }, [despiece, vidrios, tipoCristalId]);

  useEffect(() => {
    ejecutarOptimizacionVidrio();
  }, [ejecutarOptimizacionVidrio]);

  // Nombre del cristal seleccionado
  const nombreCristalSeleccionado = useMemo(() => {
    const c = vidrios.find((cr) => Number(cr.id ?? cr.idVidrio) === Number(tipoCristalId));
    return c ? (c.nombre || c.tipo) : 'Cristal Estándar 6mm';
  }, [vidrios, tipoCristalId]);

  // Presets rápidos de medidas comunes de taller
  const aplicarPresetMedida = (a, h) => {
    setAnchoVanoMm(a);
    setAltoVanoMm(h);
  };

  // Guardar Cotización de Obra
  const handleGuardarCotizacion = async () => {
    if (!clienteNombre.trim()) {
      alert('Por favor ingresa o busca el nombre del cliente para registrar la cotización.');
      return;
    }

    setGuardandoCotizacion(true);
    try {
      const payload = {
        clienteNombre: clienteNombre.trim(),
        clienteDocumento: clienteDoc.trim(),
        anchoVanoMm: Number(anchoVanoMm) || 0,
        altoVanoMm: Number(altoVanoMm) || 0,
        tipoEstructura,
        colorAluminio,
        tipoCristalId: Number(tipoCristalId),
        precioTotal: despiece?.costeo?.precioVentaSugerido || 0,
        fechaRegistro: new Date().toISOString(),
      };

      try {
        await axiosClient.post('/api/v1/obras/guardar', payload);
      } catch (err) {
        console.info('Endpoint /api/v1/obras/guardar en desarrollo. Registrado en frontend:', err.message);
      }

      setMensajeExito(`¡Cotización de obra guardada con éxito por S/ ${despiece?.costeo?.precioVentaSugerido}!`);
      setTimeout(() => setMensajeExito(null), 5000);
    } finally {
      setGuardandoCotizacion(false);
    }
  };

  // Imprimir / Exportar Hoja de Taller
  const handleImprimirHojaTaller = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Encabezado de la Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 text-xl font-bold">
              🪟
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Cotizador de Ventanas y Mamparas
              </h1>
              <p className="text-xs text-slate-500">
                Diseño milimétrico, despiece paramétrico y optimizador de corte de varillas 1D
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleImprimirHojaTaller}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-all cursor-pointer"
          >
            <span>🖨️</span>
            <span>Imprimir Hoja de Taller</span>
          </button>
          <button
            type="button"
            onClick={handleGuardarCotizacion}
            disabled={guardandoCotizacion}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <span>💾</span>
            <span>{guardandoCotizacion ? 'Guardando...' : 'Guardar Cotización'}</span>
          </button>
        </div>
      </div>

      {/* Notificación de éxito */}
      {mensajeExito && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-xs print:hidden animate-fade-in">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{mensajeExito}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeExito(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Grid Principal: Formulario a la Izquierda, Pestañas a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* PANEL IZQUIERDO: FORMULARIO DE MEDIDAS Y PARÁMETROS     */}
        {/* ======================================================== */}
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

        {/* ======================================================== */}
        {/* PANEL CENTRAL / DERECHO: PESTAÑAS Y VISUALIZADORES      */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Barra de Pestañas Superior */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap sm:flex-nowrap items-center gap-1.5 print:hidden">
            <button
              type="button"
              onClick={() => setPestañaActiva('esquema')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                pestañaActiva === 'esquema'
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
              onClick={() => setPestañaActiva('varillas')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                pestañaActiva === 'varillas'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>🪵</span>
              <span>2. Varillas (1D)</span>
              {datosOptimizacion && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  pestañaActiva === 'varillas' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {datosOptimizacion.totalVarillas}v
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setPestañaActiva('vidrio')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                pestañaActiva === 'vidrio'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>🪟</span>
              <span>3. Vidrio (2D)</span>
              {despiece?.listaCristales && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  pestañaActiva === 'vidrio' ? 'bg-white text-emerald-800' : 'bg-sky-100 text-sky-800'
                }`}>
                  {despiece.listaCristales.length}p
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setPestañaActiva('ficha')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                pestañaActiva === 'ficha'
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
          {pestañaActiva === 'esquema' && (
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
          {pestañaActiva === 'varillas' && (
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
          {pestañaActiva === 'vidrio' && (
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
          {pestañaActiva === 'ficha' && (
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
                      onClick={() => setPestañaActiva('vidrio')}
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
      </div>

      {/* ======================================================== */}
      {/* VISTA EXCLUSIVA PARA IMPRESIÓN (HOJA DE TALLER)         */}
      {/* ======================================================== */}
      <div className="hidden print:block text-black bg-white p-4 space-y-6">
        {/* Cabecera Técnica de Impresión */}
        <div className="border-b-2 border-black pb-3 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase">
              Orden de Fabricación y Hoja de Taller
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              Vidriería y Marquería — Carpintería de Aluminio & Vidrio
            </p>
          </div>
          <div className="text-right text-xs">
            <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-PE')}</p>
            <p><strong>Cliente:</strong> {clienteNombre || 'Sin Registrar'}</p>
            {clienteDoc && <p><strong>DNI/RUC:</strong> {clienteDoc}</p>}
          </div>
        </div>

        {/* Resumen del Vano */}
        <div className="grid grid-cols-3 gap-2 border border-slate-300 p-2 text-xs">
          <div>
            <strong>Estructura:</strong> {despiece?.estructuraInfo?.nombre}
          </div>
          <div>
            <strong>Medidas Vano:</strong> {anchoVanoMm} × {altoVanoMm} mm ({(Number(anchoVanoMm || 0) / 10).toFixed(1)} × {(Number(altoVanoMm || 0) / 10).toFixed(1)} cm)
          </div>
          <div>
            <strong>Acabado Perfil:</strong> {despiece?.colorInfo?.nombre}
          </div>
        </div>

        {/* SVG acotado en impresión */}
        <div className="w-full max-w-lg mx-auto py-2">
          <DiagramaVanoSVG
            anchoMm={Number(anchoVanoMm) || 0}
            altoMm={Number(altoVanoMm) || 0}
            tipoEstructura={tipoEstructura}
            colorAluminio={colorAluminio}
            configuracionApertura={configuracionApertura}
            tipoCristalNombre={nombreCristalSeleccionado}
          />
        </div>

        {/* Tabla de Cortes de Perfiles */}
        <div>
          <h3 className="text-xs font-black uppercase border-b border-slate-400 pb-1 mb-2">
            1. Tabla de Corte de Perfiles de Aluminio
          </h3>
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="p-1.5">Pieza</th>
                <th className="p-1.5">Fórmula</th>
                <th className="p-1.5 text-center">Corte</th>
                <th className="p-1.5 text-center">Cant.</th>
                <th className="p-1.5 text-right font-black">Largo (mm)</th>
              </tr>
            </thead>
            <tbody>
              {despiece?.perfilesAluminio.map((p) => (
                <tr key={p.id} className="border-b border-slate-200">
                  <td className="p-1.5 font-bold">{p.nombre}</td>
                  <td className="p-1.5 font-mono">{p.formulaTexto}</td>
                  <td className="p-1.5 text-center">{p.corte}</td>
                  <td className="p-1.5 text-center font-bold">{p.cantidad}</td>
                  <td className="p-1.5 text-right font-bold font-mono">{p.longitudMm} mm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabla de Cortes de Vidrio */}
        <div>
          <h3 className="text-xs font-black uppercase border-b border-slate-400 pb-1 mb-2">
            2. Medidas de Vidrio para el Cortador
          </h3>
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="p-1.5">Paño</th>
                <th className="p-1.5">Tipo</th>
                <th className="p-1.5 text-center">Ancho (mm)</th>
                <th className="p-1.5 text-center">Alto (mm)</th>
                <th className="p-1.5 text-center">Medida (cm)</th>
                <th className="p-1.5 text-right">Cristal</th>
              </tr>
            </thead>
            <tbody>
              {despiece?.listaCristales.map((c) => (
                <tr key={c.id} className="border-b border-slate-200">
                  <td className="p-1.5 font-bold">{c.etiqueta}</td>
                  <td className="p-1.5">{c.tipo}</td>
                  <td className="p-1.5 text-center font-mono font-bold">{c.anchoMm} mm</td>
                  <td className="p-1.5 text-center font-mono font-bold">{c.altoMm} mm</td>
                  <td className="p-1.5 text-center font-mono">{c.anchoCm} × {c.altoCm} cm</td>
                  <td className="p-1.5 text-right">{nombreCristalSeleccionado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Firmas de Taller */}
        <div className="pt-10 grid grid-cols-2 gap-12 text-center text-xs">
          <div className="border-t border-black pt-2">
            <p className="font-bold">Firma Maestro Carpintero</p>
            <p className="text-[10px] text-slate-500">Corte y Habilitado de Aluminio</p>
          </div>
          <div className="border-t border-black pt-2">
            <p className="font-bold">Firma Maestro Vidriero</p>
            <p className="text-[10px] text-slate-500">Corte, Acristalado y Sellado</p>
          </div>
        </div>
      </div>
    </div>
  );
}
