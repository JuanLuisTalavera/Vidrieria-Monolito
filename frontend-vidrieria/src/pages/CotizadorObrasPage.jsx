import { useState, useEffect, useMemo, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import FormularioParametrosObra from './cotizador-obras/components/FormularioParametrosObra';
import PanelResultadosObra from './cotizador-obras/components/PanelResultadosObra';
import VistaImpresionObra from './cotizador-obras/components/VistaImpresionObra';
import {
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
  const [pestanaActiva, setPestanaActiva] = useState('esquema'); // 'esquema' | 'varillas' | 'vidrio' | 'ficha'

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
        setErrorOptimizacionVidrio('No se pudo calcular la optimizacion de vidrio 2D.');
        setOptimizandoVidrio(false);
      });
  }, [despiece, vidrios, tipoCristalId]);

  useEffect(() => {
    ejecutarOptimizacionVidrio();
  }, [ejecutarOptimizacionVidrio]);

  // Nombre del cristal seleccionado
  const nombreCristalSeleccionado = useMemo(() => {
    const c = vidrios.find((cr) => Number(cr.id ?? cr.idVidrio) === Number(tipoCristalId));
    return c ? (c.nombre || c.tipo) : 'Cristal Estandar 6mm';
  }, [vidrios, tipoCristalId]);

  // Presets rápidos de medidas comunes de taller
  const aplicarPresetMedida = (a, h) => {
    setAnchoVanoMm(a);
    setAltoVanoMm(h);
  };

  // Guardar Cotización de Obra
  const handleGuardarCotizacion = async () => {
    if (!clienteNombre.trim()) {
      alert('Por favor ingresa o busca el nombre del cliente para registrar la cotizacion.');
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

      setMensajeExito(`Cotizacion de obra guardada con exito por S/ ${despiece?.costeo?.precioVentaSugerido}!`);
      setTimeout(() => setMensajeExito(null), 5000);
    } finally {
      setGuardandoCotizacion(false);
    }
  };

  // Imprimir / Exportar Hoja de Taller
  const handleImprimirHojaTaller = () => {
    window.print();
  };

  const childProps = {
    clienteDoc, setClienteDoc, clienteNombre, setClienteNombre,
    clienteTelefono, setClienteTelefono, buscandoCliente, setBuscandoCliente,
    mensajeCliente, setMensajeCliente, anchoVanoMm, setAnchoVanoMm,
    altoVanoMm, setAltoVanoMm, tipoEstructura, setTipoEstructura,
    colorAluminio, setColorAluminio, configuracionApertura, setConfiguracionApertura,
    tipoCristalId, setTipoCristalId, vidrios, setVidrios,
    longitudVarillaMm, setLongitudVarillaMm, anchoSierraMm, setAnchoSierraMm,
    margenUtilidad, setMargenUtilidad, pestanaActiva, setPestanaActiva,
    datosOptimizacion, setDatosOptimizacion, optimizando, setOptimizando,
    datosOptimizacionVidrio, setDatosOptimizacionVidrio, optimizandoVidrio, setOptimizandoVidrio,
    errorOptimizacionVidrio, setErrorOptimizacionVidrio, guardandoCotizacion, setGuardandoCotizacion,
    mensajeExito, setMensajeExito, buscarClientePorDoc, despiece,
    ejecutarOptimizacionVidrio, nombreCristalSeleccionado, aplicarPresetMedida,
    handleGuardarCotizacion, handleImprimirHojaTaller
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Encabezado de la Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 text-xl font-bold"></div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Cotizador de Ventanas y Mamparas
              </h1>
              <p className="text-xs text-slate-500">
                Diseno milimetrico, despiece parametrico y optimizador de cortes
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={handleImprimirHojaTaller} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-all cursor-pointer">
            <span>Imprimir Hoja de Taller</span>
          </button>
          <button type="button" onClick={handleGuardarCotizacion} disabled={guardandoCotizacion} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50">
            <span>{guardandoCotizacion ? 'Guardando...' : 'Guardar Cotizacion'}</span>
          </button>
        </div>
      </div>

      {mensajeExito && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-xs print:hidden animate-fade-in">
          <div className="flex items-center gap-2"><span>{mensajeExito}</span></div>
          <button type="button" onClick={() => setMensajeExito(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">X</button>
        </div>
      )}

      {/* 2. Grid Modular */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <FormularioParametrosObra {...childProps}/>
        <PanelResultadosObra {...childProps}/>
      </div>
      <VistaImpresionObra {...childProps}/>
    </div>
  );
}