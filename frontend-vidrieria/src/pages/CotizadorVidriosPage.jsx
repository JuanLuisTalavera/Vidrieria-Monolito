import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { usePedido } from '../context/PedidoContext';
import {
  Trash2,
  PlusCircle,
  ShoppingCart,
  CheckCircle2,
  RefreshCw,
  Copy,
  Scissors,
  Layers,
  Sparkles
} from 'lucide-react';

export default function CotizadorVidriosPage() {
  const navigate = useNavigate();

  // Estados del Catálogo
  const [vidrios, setVidrios] = useState([]);
  const [serviciosExtras, setServiciosExtras] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);

  // Estados del Formulario (Configuración del Vidrio en Curso)
  const [vidrioId, setVidrioId] = useState('');
  const [anchoMm, setAnchoMm] = useState(1000); // en mm
  const [altoMm, setAltoMm] = useState(600);   // en mm
  const [cantidad, setCantidad] = useState(1);

  // Estados de Procesos / Manufactura
  const [tienePulido, setTienePulido] = useState(false);
  const [metrosPulido, setMetrosPulido] = useState('');
  const [pulidoModificadoManualmente, setPulidoModificadoManualmente] = useState(false);

  const [tieneBiselado, setTieneBiselado] = useState(false);
  const [metrosBiselado, setMetrosBiselado] = useState('');
  const [biseladoModificadoManualmente, setBiseladoModificadoManualmente] = useState(false);

  const [tienePerforaciones, setTienePerforaciones] = useState(false);
  const [cantidadPerforaciones, setCantidadPerforaciones] = useState(1);

  // Contexto Global de Pedido Unificado
  const {
    carritoGlobal,
    agregarAlCarrito,
    eliminarDelCarrito,
    vaciarCarrito,
  } = usePedido();
  const listaVidrios = carritoGlobal;

  // Notificación y Estado de la Lista
  const [notificacion, setNotificacion] = useState(null);
  const [agregandoALista, setAgregandoALista] = useState(false);

  // Toast feedback helper
  const showToast = (mensaje, tipo = 'success') => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => {
      setNotificacion(null);
    }, 3500);
  };


  // Cargar catálogo de vidrios y servicios extras al montar
  useEffect(() => {
    let cancel = false;
    Promise.all([
      axiosClient.get('/api/v1/vidrios'),
      axiosClient.get('/api/v1/servicios-extras').catch(() => ({ data: [] })),
    ])
      .then(([resVidrios, resServicios]) => {
        if (!cancel) {
          const listVidrios = Array.isArray(resVidrios.data) ? resVidrios.data : [];
          setVidrios(listVidrios);
          if (listVidrios.length > 0) {
            setVidrioId(String(listVidrios[0].idVidrio ?? listVidrios[0].id));
          }
          if (Array.isArray(resServicios?.data)) {
            setServiciosExtras(resServicios.data);
          }
        }
      })
      .catch((err) => {
        console.error('Error al cargar datos para cotizador de vidrios:', err);
      })
      .finally(() => {
        if (!cancel) setCargandoCatalogo(false);
      });

    return () => {
      cancel = true;
    };
  }, []);

  // Vidrio seleccionado del catálogo
  const vidrioSeleccionado = useMemo(() => {
    return vidrios.find((v) => String(v.idVidrio ?? v.id) === String(vidrioId)) || vidrios[0] || null;
  }, [vidrios, vidrioId]);

  // Tarifas de manufactura dinámicas obtenidas de servicios extras (con fallback seguro)
  const tarifas = useMemo(() => {
    const buscarTarifa = (termino, defecto) => {
      const extra = serviciosExtras.find((s) => {
        const nom = (s.nombre || '').toUpperCase();
        return nom.includes(termino);
      });
      if (extra) {
        const val = extra.precio ?? extra.precioSugerido ?? extra.precioBase;
        if (val !== undefined && val !== null && Number(val) > 0) {
          return Number(val);
        }
      }
      return defecto;
    };

    return {
      pulido: buscarTarifa('PULIDO', 6.0),
      biselado: buscarTarifa('BISEL', 12.0),
      perforacion: buscarTarifa('HUECO', 15.0),
    };
  }, [serviciosExtras]);

  // Cálculos Geométricos en mm y m del vidrio en configuración
  const geometria = useMemo(() => {
    const w = Math.max(0, Number(anchoMm) || 0);
    const h = Math.max(0, Number(altoMm) || 0);
    const cant = Math.max(0, Number(cantidad) || 0);

    const areaUnitariaM2 = (w * h) / 1_000_000;
    const areaTotalM2 = cant > 0 ? areaUnitariaM2 * cant : areaUnitariaM2;

    const perimetroUnitarioM = ((w + h) * 2) / 1000;
    const perimetroTotalM = cant > 0 ? perimetroUnitarioM * cant : perimetroUnitarioM;

    return {
      anchoMm: w,
      altoMm: h,
      cantidad: cant,
      areaUnitariaM2: Number(areaUnitariaM2.toFixed(4)),
      areaTotalM2: Number(areaTotalM2.toFixed(4)),
      perimetroUnitarioM: Number(perimetroUnitarioM.toFixed(2)),
      perimetroTotalM: Number(perimetroTotalM.toFixed(2)),
    };
  }, [anchoMm, altoMm, cantidad]);

  // Sincronización automática de Metros de Pulido con el perímetro si no se ha modificado manualmente
  useEffect(() => {
    if (!pulidoModificadoManualmente && tienePulido) {
      setMetrosPulido(String(geometria.perimetroTotalM));
    }
  }, [geometria.perimetroTotalM, tienePulido, pulidoModificadoManualmente]);

  // Sincronización automática de Metros de Biselado con el perímetro si no se ha modificado manualmente
  useEffect(() => {
    if (!biseladoModificadoManualmente && tieneBiselado) {
      setMetrosBiselado(String(geometria.perimetroTotalM));
    }
  }, [geometria.perimetroTotalM, tieneBiselado, biseladoModificadoManualmente]);

  // Manejador al activar/desactivar Pulido
  const handleTogglePulido = (checked) => {
    setTienePulido(checked);
    if (checked) {
      setMetrosPulido(String(geometria.perimetroTotalM));
      setPulidoModificadoManualmente(false);
    }
  };

  // Manejador al activar/desactivar Biselado
  const handleToggleBiselado = (checked) => {
    setTieneBiselado(checked);
    if (checked) {
      setMetrosBiselado(String(geometria.perimetroTotalM));
      setBiseladoModificadoManualmente(false);
    }
  };

  // Restablecer Pulido al perímetro completo
  const handleResetearPerimetroPulido = () => {
    setMetrosPulido(String(geometria.perimetroTotalM));
    setPulidoModificadoManualmente(false);
  };

  // Restablecer Biselado al perímetro completo
  const handleResetearPerimetroBiselado = () => {
    setMetrosBiselado(String(geometria.perimetroTotalM));
    setBiseladoModificadoManualmente(false);
  };

  // Cálculo Local en vivo (garantía de inmediatez y fallback reactivo)
  const calculoLocal = useMemo(() => {
    const precioM2 = Number(
      vidrioSeleccionado?.precioPublicoM2 ??
      vidrioSeleccionado?.precio ??
      vidrioSeleccionado?.costoRealM2 ??
      45.0
    );

    const costoCristal = Number((geometria.areaTotalM2 * precioM2).toFixed(2));

    const mlPulido = tienePulido ? Math.max(0, parseFloat(metrosPulido) || 0) : 0;
    const costoPulido = Number((mlPulido * tarifas.pulido).toFixed(2));

    const mlBiselado = tieneBiselado ? Math.max(0, parseFloat(metrosBiselado) || 0) : 0;
    const costoBiselado = Number((mlBiselado * tarifas.biselado).toFixed(2));

    const numHuecos = tienePerforaciones ? Math.max(0, parseInt(cantidadPerforaciones, 10) || 0) : 0;
    const costoPerforaciones = Number((numHuecos * tarifas.perforacion).toFixed(2));

    const costoManufactura = Number((costoPulido + costoBiselado + costoPerforaciones).toFixed(2));
    const subtotal = Number((costoCristal + costoManufactura).toFixed(2));
    const precioTotal = subtotal;

    return {
      costoCristal,
      precioM2,
      costoPulido,
      mlPulido,
      costoBiselado,
      mlBiselado,
      costoPerforaciones,
      numHuecos,
      costoManufactura,
      precioTotal,
      precioUnitarioPieza: geometria.cantidad > 0 ? Number((precioTotal / geometria.cantidad).toFixed(2)) : 0,
    };
  }, [
    vidrioSeleccionado,
    geometria,
    tienePulido,
    metrosPulido,
    tieneBiselado,
    metrosBiselado,
    tienePerforaciones,
    cantidadPerforaciones,
    tarifas,
  ]);

  // Datos consolidados para la tarjeta de previsualización (calculado localmente en tiempo real)
  const datosResumen = calculoLocal;

  // Botón "Calcular y Agregar" a la lista
  const handleCalcularYAgregar = async (e) => {
    if (e) e.preventDefault();

    // Saneamiento y extracción estricta
    const idVidrio = Number(vidrioSeleccionado?.idVidrio ?? vidrioSeleccionado?.id ?? vidrioId);
    const anchoNum = Number(anchoMm);
    const altoNum = Number(altoMm);
    const cantNum = Number(cantidad);

    // 1. Bloqueo estricto a prueba de fallos sin depender de librerías externas de toast
    if (!idVidrio || isNaN(anchoNum) || anchoNum <= 0 || isNaN(altoNum) || altoNum <= 0 || isNaN(cantNum) || cantNum <= 0) {
      alert("Por favor ingrese medidas y cantidad válidas mayores a 0");
      return; // Detiene la ejecución aquí
    }

    setAgregandoALista(true);

    const pulidoActivo = Boolean(tienePulido);
    const biseladoActivo = Boolean(tieneBiselado);
    const huecosActivo = Boolean(tienePerforaciones);

    // Precios personalizados: si están vacíos o inactivos DEBEN ser null, NUNCA ""
    const precioPulidoPersonalizado = null;
    const precioBiseladoPersonalizado = null;
    const precioPerforacionPersonalizado = null;

    // Construcción Estricta del Payload validando campo por campo
    const payload = {
      idVidrio: Number(idVidrio),
      nombreVidrio: vidrioSeleccionado?.nombre || '',
      anchoMm: Number(anchoNum),
      altoMm: Number(altoNum),
      cantidad: Number(cantNum),
      tienePulido: pulidoActivo,
      metrosPulido: pulidoActivo ? Number(metrosPulido || 0) : 0,
      precioMetroPulido: pulidoActivo ? (tarifas.pulido ? Number(tarifas.pulido) : null) : null,
      precioPulidoPersonalizado: (pulidoActivo && precioPulidoPersonalizado) ? Number(precioPulidoPersonalizado) : null,
      tieneBiselado: biseladoActivo,
      metrosBiselado: biseladoActivo ? Number(metrosBiselado || 0) : 0,
      precioMetroBiselado: biseladoActivo ? (tarifas.biselado ? Number(tarifas.biselado) : null) : null,
      precioBiseladoPersonalizado: (biseladoActivo && precioBiseladoPersonalizado) ? Number(precioBiseladoPersonalizado) : null,
      tienePerforaciones: huecosActivo,
      cantidadPerforaciones: huecosActivo ? Number(cantidadPerforaciones || 0) : 0,
      cantidadHuecos: huecosActivo ? Number(cantidadPerforaciones || 0) : 0,
      huecos: huecosActivo ? Number(cantidadPerforaciones || 0) : 0,
      precioPerforacion: huecosActivo ? (tarifas.perforacion ? Number(tarifas.perforacion) : null) : null,
      precioPerforacionPersonalizado: (huecosActivo && precioPerforacionPersonalizado) ? Number(precioPerforacionPersonalizado) : null,
      precioUnitarioVidrioM2: Number(calculoLocal.precioM2 || 0),
      precioM2VidrioPersonalizado: Number(calculoLocal.precioM2 || 0),
      precioM2Personalizado: Number(calculoLocal.precioM2 || 0),
    };

    try {
      let data = null;
      try {
        const response = await axiosClient.post('/api/v1/cotizador/vidrio-suelto', payload);
        data = response?.data || null;
        console.log("Respuesta de Cotización del Backend:", data);
      } catch (apiErr) {
        console.warn("Aviso del endpoint de cotización, usando cálculo local reactivo:", apiErr);
      }

      // Obtener el monto de subtotal: del backend si devolvió un total válido > 0,
      // o del cálculo local en vivo que se muestra en la tarjeta de previsualización
      const subtotalMonto = Number(
        (data && Number(data.totalCalculado) > 0 ? Number(data.totalCalculado) : null) ??
        (data && Number(data.totalRedondeado) > 0 ? Number(data.totalRedondeado) : null) ??
        (data && Number(data.subtotalNeto) > 0 ? Number(data.subtotalNeto) : null) ??
        (calculoLocal && Number(calculoLocal.precioTotal) > 0 ? Number(calculoLocal.precioTotal) : null) ??
        (datosResumen && Number(datosResumen.precioTotal) > 0 ? Number(datosResumen.precioTotal) : null) ??
        0
      );

      // Construcción del objeto descriptivo (ej. "Cristal Templado 6mm - 800x600mm + Pulido")
      const nombreVidrio = vidrioSeleccionado?.nombre || 'Cristal';
      const dimTexto = `${anchoNum}x${altoNum}mm`;
      const servicios = [];
      const mlPulidoVal = pulidoActivo ? Number(metrosPulido || 0) : 0;
      const mlBiseladoVal = biseladoActivo ? Number(metrosBiselado || 0) : 0;
      const huecosVal = huecosActivo ? Number(cantidadPerforaciones || 0) : 0;

      if (pulidoActivo) servicios.push(`Pulido (${mlPulidoVal}m)`);
      if (biseladoActivo) servicios.push(`Biselado (${mlBiseladoVal}m)`);
      if (huecosActivo && huecosVal > 0) servicios.push(`${huecosVal} ${huecosVal === 1 ? 'Hueco' : 'Huecos'}`);

      const descServicios = servicios.length > 0 ? ` + ${servicios.join(' + ')}` : '';
      const descripcion = `${nombreVidrio} - ${dimTexto}${descServicios}`;

      const areaUnitariaM2 = (anchoNum * altoNum) / 1_000_000;
      const areaTotalM2 = areaUnitariaM2 * cantNum;

      const nuevoItem = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        tipoItem: 'VIDRIO_SUELTO',
        origen: 'VIDRIO_SUELTO',
        tipo: 'VIDRIO_SUELTO',
        vidrioId: idVidrio,
        idVidrio: idVidrio,
        nombreVidrio,
        esTemplado: Boolean(vidrioSeleccionado?.esTemplado),
        anchoMm: Number(anchoNum),
        altoMm: Number(altoNum),
        ancho: Number((anchoNum / 10).toFixed(1)), // en cm para compatibilidad con marquería
        alto: Number((altoNum / 10).toFixed(1)),   // en cm para compatibilidad con marquería
        anchoVano: Number((anchoNum / 10).toFixed(1)),
        altoVano: Number((altoNum / 10).toFixed(1)),
        cantidad: Number(cantNum),
        areaUnitariaM2: Number(areaUnitariaM2.toFixed(4)),
        areaTotalM2: Number(areaTotalM2.toFixed(4)),
        tienePulido: pulidoActivo,
        metrosPulido: mlPulidoVal,
        tieneBiselado: biseladoActivo,
        metrosBiselado: mlBiseladoVal,
        tienePerforaciones: huecosActivo,
        cantidadPerforaciones: huecosVal,
        serviciosList: servicios,
        descripcion,
        subtotal: subtotalMonto,
        precio: subtotalMonto,
        precioTotal: subtotalMonto,
        total: subtotalMonto,
        precioUnitario: cantNum > 0 ? Number((subtotalMonto / cantNum).toFixed(2)) : subtotalMonto,
        costoCristal: Number(Number((data && Number(data.subtotalVidrio) > 0 ? data.subtotalVidrio : null) ?? calculoLocal.costoCristal ?? 0).toFixed(2)),
        costoManufactura: Number(Number(calculoLocal.costoManufactura ?? 0).toFixed(2)),
        idMoldura: null,
        molduraNombre: 'Sin moldura',
        descontarStock: true,
      };

      // Agregar al carrito unificado en el contexto global
      agregarAlCarrito(nuevoItem);

      // Reset seguro de inputs tras POST exitoso (preservando vidrioId)
      setAnchoMm("");
      setAltoMm("");
      setCantidad(1);
      setTienePulido(false);
      setMetrosPulido("");
      setPulidoModificadoManualmente(false);
      setTieneBiselado(false);
      setMetrosBiselado("");
      setBiseladoModificadoManualmente(false);
      setTienePerforaciones(false);
      setCantidadPerforaciones(1);

      showToast(`¡"${nombreVidrio} (${dimTexto})" agregado a la cotización!`);
    } catch (error) {
      console.error("Error al agregar vidrio a la lista:", error);
      alert('Error inesperado al agregar el cristal a la lista.');
    } finally {
      setAgregandoALista(false);
    }
  };

  // Eliminar un ítem de la lista
  const handleEliminarItem = (idEliminar) => {
    eliminarDelCarrito(idEliminar);
    showToast('Cristal eliminado del pedido');
  };

  // Vaciar toda la lista
  const handleLimpiarLista = () => {
    if (window.confirm('¿Deseas vaciar todos los cristales cotizados de la lista?')) {
      vaciarCarrito();
      showToast('Lista de cristales vaciada');
    }
  };

  // Gran Total sumando todos los subtotales de listaVidrios
  const granTotal = useMemo(() => {
    return Number(
      listaVidrios.reduce((acc, item) => acc + Number(item.precio || item.subtotal || 0), 0).toFixed(2)
    );
  }, [listaVidrios]);

  // Métricas agregadas de la lista
  const totalPiezas = useMemo(() => {
    return listaVidrios.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);
  }, [listaVidrios]);

  const totalAreaM2 = useMemo(() => {
    return Number(
      listaVidrios.reduce((acc, item) => acc + (Number(item.areaTotalM2) || 0), 0).toFixed(4)
    );
  }, [listaVidrios]);

  // 4. Botón "Crear Pedido / Enviar a Caja" -> Redirige al cotizador unificado
  const handleCrearPedido = () => {
    if (listaVidrios.length === 0) {
      showToast('Agrega al menos un cristal a la lista para enviar a caja', 'error');
      return;
    }

    showToast('Redirigiendo a caja para liquidar pedido unificado...');
    navigate('/cotizador');
  };

  // Copiar resumen de cotización completa para WhatsApp
  const handleCopiarResumenCompleto = () => {
    if (listaVidrios.length === 0) {
      handleCopiarResumenIndividual();
      return;
    }

    let texto = `📋 *COTIZACIÓN DE VIDRIOS Y CRISTALES SUELTOS*\n` +
      `📅 Fecha: ${new Date().toLocaleDateString('es-PE')}\n` +
      `--------------------------------\n`;

    listaVidrios.forEach((item, index) => {
      const subtotalItem = Number(item.precio || item.subtotal || 0);
      texto += `*#${index + 1}. ${item.nombreVidrio}*\n` +
        `   • Medidas: ${item.anchoMm} × ${item.altoMm} mm (${item.areaTotalM2} m²)\n` +
        `   • Cantidad: ${item.cantidad} ${item.cantidad === 1 ? 'unidad' : 'unidades'}\n` +
        (item.serviciosList && item.serviciosList.length > 0 ? `   • Procesos: ${item.serviciosList.join(' + ')}\n` : '') +
        `   • Subtotal: S/ ${subtotalItem.toFixed(2)}\n\n`;
    });

    texto += `--------------------------------\n` +
      `📦 *Total Piezas:* ${totalPiezas} und\n` +
      `📐 *Área Total:* ${totalAreaM2.toFixed(3)} m²\n` +
      `💰 *GRAN TOTAL: S/ ${granTotal.toFixed(2)}*\n` +
      `--------------------------------\n` +
      `_Precios válidos por 7 días. Taller de Vidriería._`;

    navigator.clipboard.writeText(texto).then(() => {
      showToast('¡Cotización completa copiada al portapapeles para WhatsApp!');
    });
  };

  // Copiar resumen del ítem actual en configuración (preview)
  const handleCopiarResumenIndividual = () => {
    const texto = `📋 *COTIZACIÓN DE VIDRIO SUELTO*\n` +
      `--------------------------------\n` +
      `🪟 *Cristal:* ${vidrioSeleccionado?.nombre || 'Vidrio'}\n` +
      `📏 *Medidas:* ${geometria.anchoMm} mm × ${geometria.altoMm} mm\n` +
      `🔢 *Cantidad:* ${geometria.cantidad} unidad(es)\n` +
      `📐 *Área Total:* ${geometria.areaTotalM2} m²\n` +
      `--------------------------------\n` +
      `• Costo Cristal: S/ ${datosResumen.costoCristal.toFixed(2)}\n` +
      (tienePulido ? `• Pulido de bordes (${datosResumen.mlPulido} ml): S/ ${datosResumen.costoPulido.toFixed(2)}\n` : '') +
      (tieneBiselado ? `• Biselado perimétrico (${datosResumen.mlBiselado} ml): S/ ${datosResumen.costoBiselado.toFixed(2)}\n` : '') +
      (tienePerforaciones ? `• Perforaciones (${datosResumen.numHuecos} und): S/ ${datosResumen.costoPerforaciones.toFixed(2)}\n` : '') +
      `• Costo Manufactura: S/ ${datosResumen.costoManufactura.toFixed(2)}\n` +
      `--------------------------------\n` +
      `💰 *PRECIO TOTAL: S/ ${datosResumen.precioTotal.toFixed(2)}*\n` +
      `✨ *Unitario:* S/ ${datosResumen.precioUnitarioPieza.toFixed(2)} c/u\n\n` +
      `_Precios válidos por 7 días. Taller de Vidriería._`;

    navigator.clipboard.writeText(texto).then(() => {
      showToast('¡Cotización copiada al portapapeles para WhatsApp!');
    });
  };

  // Optimizar corte en trazador (todas las piezas de la lista o la actual)
  const handleOptimizarCorte = () => {
    if (listaVidrios.length > 0) {
      const piezas = listaVidrios.map((item, idx) => ({
        id: `${item.id}-${idx}`,
        etiqueta: `${item.nombreVidrio} (${item.anchoMm}×${item.altoMm})`,
        anchoMm: item.anchoMm,
        altoMm: item.altoMm,
        cantidad: item.cantidad,
      }));

      const stateData = {
        piezas,
        tipoCristalId: listaVidrios[0]?.vidrioId,
      };

      navigate('/trazador-vidrio', { state: stateData });
      return;
    }

    if (geometria.anchoMm <= 0 || geometria.altoMm <= 0) {
      showToast('Ingresa las medidas del vidrio o agrega cristales a la lista para optimizar', 'error');
      return;
    }

    const etiqueta = `${vidrioSeleccionado?.nombre || 'Vidrio Suelto'} (${geometria.anchoMm}×${geometria.altoMm})`;
    const stateData = {
      piezas: [
        {
          id: String(Date.now()),
          etiqueta,
          anchoMm: geometria.anchoMm,
          altoMm: geometria.altoMm,
          cantidad: geometria.cantidad,
        },
      ],
      tipoCristalId: vidrioSeleccionado?.idVidrio ?? vidrioSeleccionado?.id,
    };

    navigate('/trazador-vidrio', { state: stateData });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {notificacion && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold transition-all transform animate-in fade-in slide-in-from-top-4 duration-200 ${
            notificacion.tipo === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {notificacion.tipo === 'error' ? (
            <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{notificacion.mensaje}</span>
          <button onClick={() => setNotificacion(null)} className="text-slate-400 hover:text-slate-600 ml-2">
            &times;
          </button>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-sky-100 text-sky-700 rounded-xl flex items-center justify-center font-bold text-xl">
              🪟
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Cotizador de Vidrios Sueltos
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Calcula y acumula múltiples vidrios con manufactura (pulido, biselado y huecos) en un solo presupuesto.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {listaVidrios.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
              <ShoppingCart className="w-3.5 h-3.5" />
              {listaVidrios.length} {listaVidrios.length === 1 ? 'cristal' : 'cristales'} en lista
            </span>
          )}

          <button
            onClick={handleOptimizarCorte}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition cursor-pointer"
            title="Optimizar corte en plancha 2D"
          >
            <Scissors className="w-4 h-4 text-emerald-400" />
            <span>Optimizar Corte 2D</span>
          </button>
        </div>
      </div>

      {/* Grid de Contenido: Formulario Izquierda | Previsualización Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tarjeta 1: Selección de Cristal y Medidas */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>1. Cristal y Dimensiones</span>
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                Paso 1 de 2
              </span>
            </div>

            {/* Selector de Cristal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipo de Cristal / Vidrio *
              </label>
              {cargandoCatalogo ? (
                <div className="h-10 bg-slate-100 animate-pulse rounded-xl"></div>
              ) : (
                <div className="relative">
                  <select
                    id="select-tipo-cristal"
                    value={vidrioId}
                    onChange={(e) => setVidrioId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition bg-white"
                  >
                    {vidrios.map((v) => {
                      const id = String(v.idVidrio ?? v.id);
                      const precio = Number(v.precioPublicoM2 ?? v.costoRealM2 ?? 0).toFixed(2);
                      const tipo = v.esTemplado ? 'Templado' : 'Estándar';
                      return (
                        <option key={id} value={id}>
                          {v.nombre} ({tipo}) — S/ {precio} /m²
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Ficha técnica del vidrio seleccionado */}
              {vidrioSeleccionado && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        vidrioSeleccionado.esTemplado
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-sky-100 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {vidrioSeleccionado.esTemplado ? 'Cristal Templado' : 'Vidrio Estándar'}
                    </span>
                    <span className="text-slate-500">
                      Plancha: {vidrioSeleccionado.anchoPlancha || '2.14'}m × {vidrioSeleccionado.altoPlancha || '3.30'}m
                    </span>
                  </div>
                  <div className="font-bold text-slate-700 font-mono">
                    Tarifa Base: S/ {calculoLocal.precioM2.toFixed(2)} /m²
                  </div>
                </div>
              )}
            </div>

            {/* Inputs: Ancho, Alto, Cantidad */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Ancho (mm) *
                </label>
                <div className="relative">
                  <input
                    id="input-ancho-mm"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={anchoMm || ""}
                    onChange={(e) => setAnchoMm(e.target.value)}
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold font-mono text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                    placeholder="Ej. 1000"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs font-semibold">
                    mm
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {anchoMm ? ((Number(anchoMm) || 0) / 1000).toFixed(2) : '0.00'} metros
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Alto (mm) *
                </label>
                <div className="relative">
                  <input
                    id="input-alto-mm"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={altoMm || ""}
                    onChange={(e) => setAltoMm(e.target.value)}
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold font-mono text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                    placeholder="Ej. 600"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs font-semibold">
                    mm
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {altoMm ? ((Number(altoMm) || 0) / 1000).toFixed(2) : '0.00'} metros
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Cantidad *
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setCantidad((prev) => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-l-xl border border-r-0 border-slate-300 font-bold transition cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    id="input-cantidad"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="1"
                    className="w-full py-2.5 text-center border-y border-slate-300 text-sm font-bold font-mono text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCantidad((prev) => (parseInt(prev, 10) || 0) + 1)}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-r-xl border border-l-0 border-slate-300 font-bold transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block text-center">
                  Piezas idénticas
                </span>
              </div>
            </div>

            {/* Ficha métrica en tiempo real de área y perímetro */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Área x Pieza</span>
                <span className="text-sm font-bold text-slate-700 font-mono">{geometria.areaUnitariaM2} m²</span>
              </div>
              <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">Área Total</span>
                <span className="text-sm font-extrabold text-emerald-800 font-mono">{geometria.areaTotalM2} m²</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Perímetro 1 Pieza</span>
                <span className="text-sm font-bold text-slate-700 font-mono">{geometria.perimetroUnitarioM} m</span>
              </div>
              <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-200/80">
                <span className="text-[10px] uppercase font-bold text-sky-700 block tracking-wider">Perímetro Total</span>
                <span className="text-sm font-extrabold text-sky-800 font-mono">{geometria.perimetroTotalM} m</span>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Panel de Procesos del Vidrio (Manufactura) */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>2. Procesos y Manufactura del Vidrio</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecciona los tratamientos de bordes y perforaciones requeridos para este cristal.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Opcional
              </span>
            </div>

            {/* Proceso 1: Pulido de Cantos */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                tienePulido
                  ? 'bg-sky-50/50 border-sky-300 ring-1 ring-sky-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <input
                    id="check-pulido"
                    type="checkbox"
                    checked={tienePulido}
                    onChange={(e) => handleTogglePulido(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="check-pulido" className="text-sm font-bold text-slate-800 cursor-pointer select-none">
                      📏 Pulido de Cantos / Bordes
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Lijado y abrillantado plano para evitar bordes cortantes y brindar acabado de alta gama.
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-slate-400 block font-mono">
                    S/ {tarifas.pulido.toFixed(2)} /m
                  </span>
                  {tienePulido && (
                    <span className="text-sm font-bold text-sky-700 font-mono block">
                      + S/ {calculoLocal.costoPulido.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-formulario desplegable al activar Pulido */}
              {tienePulido && (
                <div className="mt-4 pt-3 border-t border-sky-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Metros Lineales a Pulir (m):
                    </label>
                    <div className="relative">
                      <input
                        id="input-metros-pulido"
                        type="number"
                        step="0.01"
                        min="0"
                        value={metrosPulido || ""}
                        onChange={(e) => {
                          setMetrosPulido(e.target.value);
                          setPulidoModificadoManualmente(true);
                        }}
                        className="w-full pr-8 pl-3 py-2 rounded-lg border border-sky-300 bg-white text-sm font-bold font-mono text-slate-800 focus:ring-1 focus:ring-sky-500 outline-none"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs font-bold">
                        m
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 sm:pt-0">
                    {pulidoModificadoManualmente && (
                      <button
                        type="button"
                        onClick={handleResetearPerimetroPulido}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-800 underline transition cursor-pointer"
                        title="Restablece al perímetro de todos los lados"
                      >
                        Autocompletar perímetro ({geometria.perimetroTotalM} m)
                      </button>
                    )}
                    <span className="text-xs text-slate-400">
                      (Perímetro total: {geometria.perimetroTotalM} m)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Proceso 2: Biselado */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                tieneBiselado
                  ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <input
                    id="check-biselado"
                    type="checkbox"
                    checked={tieneBiselado}
                    onChange={(e) => handleToggleBiselado(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="check-biselado" className="text-sm font-bold text-slate-800 cursor-pointer select-none">
                      ✨ Biselado Perimétrico
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Corte en ángulo decorativo (10mm a 25mm) para espejos, tableros y repisas.
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-slate-400 block font-mono">
                    S/ {tarifas.biselado.toFixed(2)} /m
                  </span>
                  {tieneBiselado && (
                    <span className="text-sm font-bold text-amber-700 font-mono block">
                      + S/ {calculoLocal.costoBiselado.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-formulario desplegable al activar Biselado */}
              {tieneBiselado && (
                <div className="mt-4 pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Metros Lineales a Biselar (m):
                    </label>
                    <div className="relative">
                      <input
                        id="input-metros-biselado"
                        type="number"
                        step="0.01"
                        min="0"
                        value={metrosBiselado || ""}
                        onChange={(e) => {
                          setMetrosBiselado(e.target.value);
                          setBiseladoModificadoManualmente(true);
                        }}
                        className="w-full pr-8 pl-3 py-2 rounded-lg border border-amber-300 bg-white text-sm font-bold font-mono text-slate-800 focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs font-bold">
                        m
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 sm:pt-0">
                    {biseladoModificadoManualmente && (
                      <button
                        type="button"
                        onClick={handleResetearPerimetroBiselado}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-800 underline transition cursor-pointer"
                      >
                        Autocompletar perímetro ({geometria.perimetroTotalM} m)
                      </button>
                    )}
                    <span className="text-xs text-slate-400">
                      (Perímetro total: {geometria.perimetroTotalM} m)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Proceso 3: Perforaciones / Huecos */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                tienePerforaciones
                  ? 'bg-purple-50/50 border-purple-300 ring-1 ring-purple-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <input
                    id="check-perforaciones"
                    type="checkbox"
                    checked={tienePerforaciones}
                    onChange={(e) => setTienePerforaciones(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="check-perforaciones" className="text-sm font-bold text-slate-800 cursor-pointer select-none">
                      🔘 Perforaciones / Huecos
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Orificios circulares para cerraduras pico de loro, tiradores o sujeciones.
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-slate-400 block font-mono">
                    S/ {tarifas.perforacion.toFixed(2)} /und
                  </span>
                  {tienePerforaciones && (
                    <span className="text-sm font-bold text-purple-700 font-mono block">
                      + S/ {calculoLocal.costoPerforaciones.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-formulario desplegable al activar Perforaciones */}
              {tienePerforaciones && (
                <div className="mt-4 pt-3 border-t border-purple-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Cantidad Total de Huecos:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="input-cantidad-huecos"
                        type="number"
                        min="1"
                        step="1"
                        value={cantidadPerforaciones || ""}
                        onChange={(e) => setCantidadPerforaciones(e.target.value)}
                        className="w-24 pl-3 pr-2 py-2 rounded-lg border border-purple-300 bg-white text-sm font-bold font-mono text-slate-800 focus:ring-1 focus:ring-purple-500 outline-none"
                      />
                      <div className="flex items-center gap-1">
                        {[1, 2, 4].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setCantidadPerforaciones(n)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              cantidadPerforaciones === n
                                ? 'bg-purple-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {n} {n === 1 ? 'hueco' : 'huecos'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 pt-2 sm:pt-0">
                    Costo unitario: S/ {tarifas.perforacion.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* BOTÓN PRINCIPAL DEL FORMULARIO: CALCULAR Y AGREGAR A LA LISTA */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>¿Medidas y acabados listos?</span>
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Calcula el subtotal con el backend y suma este cristal al carrito de cotización.
              </p>
            </div>

            <button
              id="btn-calcular-y-agregar-principal"
              type="button"
              onClick={handleCalcularYAgregar}
              disabled={agregandoALista}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer shrink-0"
            >
              {agregandoALista ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calculando y Agregando...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 text-emerald-100" />
                  <span>Calcular y Agregar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: TARJETA DE RESUMEN EN VIVO (CONFIGURACIÓN ACTUAL) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header del Resumen */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 block">
                  Vista Previa en Vivo
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                  Cristal en Configuración
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                🧾
              </div>
            </div>

            {/* Cuerpo del Resumen */}
            <div className="p-5 space-y-4">
              {/* Resumen de Medidas e Identificación */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Cristal:</span>
                  <span className="text-right truncate max-w-[200px]">
                    {vidrioSeleccionado?.nombre || 'Seleccione un cristal'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 font-mono">
                  <span>Dimensiones:</span>
                  <span>{geometria.anchoMm > 0 ? `${geometria.anchoMm} × ${geometria.altoMm} mm` : 'Pendiente de ingresar'}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-mono">
                  <span>Cantidad:</span>
                  <span>{geometria.cantidad} {geometria.cantidad === 1 ? 'pieza' : 'piezas'}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-mono">
                  <span>Área Total:</span>
                  <span>{geometria.areaTotalM2} m²</span>
                </div>
              </div>

              {/* Items Desglosados */}
              <div className="space-y-3 pt-1">
                {/* 1. Costo del Cristal */}
                <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      1. Costo del Cristal
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {geometria.areaTotalM2} m² × S/ {calculoLocal.precioM2.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono text-base">
                    S/ {datosResumen.costoCristal.toFixed(2)}
                  </span>
                </div>

                {/* 2. Costos de Manufactura */}
                <div className="py-1.5 border-b border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-sm block">
                      2. Manufactura & Acabados
                    </span>
                    <span className="font-bold text-slate-800 font-mono text-sm">
                      S/ {datosResumen.costoManufactura.toFixed(2)}
                    </span>
                  </div>

                  {/* Sub-items de manufactura */}
                  <div className="pl-3 space-y-1 text-xs text-slate-600 border-l-2 border-slate-200 font-mono">
                    {tienePulido ? (
                      <div className="flex justify-between">
                        <span>Pulido ({datosResumen.mlPulido} m):</span>
                        <span>S/ {datosResumen.costoPulido.toFixed(2)}</span>
                      </div>
                    ) : null}

                    {tieneBiselado ? (
                      <div className="flex justify-between">
                        <span>Biselado ({datosResumen.mlBiselado} m):</span>
                        <span>S/ {datosResumen.costoBiselado.toFixed(2)}</span>
                      </div>
                    ) : null}

                    {tienePerforaciones ? (
                      <div className="flex justify-between">
                        <span>Huecos ({datosResumen.numHuecos} und):</span>
                        <span>S/ {datosResumen.costoPerforaciones.toFixed(2)}</span>
                      </div>
                    ) : null}

                    {!tienePulido && !tieneBiselado && !tienePerforaciones && (
                      <span className="text-slate-400 italic">Corte estándar al hilo (sin procesos adicionales)</span>
                    )}
                  </div>
                </div>

                {/* Subtotal del Cristal Actual */}
                <div className="bg-slate-100/80 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Subtotal Esta Pieza
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {geometria.cantidad > 1
                        ? `S/ ${datosResumen.precioUnitarioPieza.toFixed(2)} c/u (${geometria.cantidad} und)`
                        : 'Precio de este corte'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-800 font-mono block">
                      S/ {datosResumen.precioTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de Acción Directa en Resumen */}
              <div className="pt-2 space-y-2">
                <button
                  id="btn-calcular-y-agregar-secundario"
                  onClick={handleCalcularYAgregar}
                  disabled={agregandoALista}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm rounded-xl shadow-xs hover:shadow transition cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>{agregandoALista ? 'Agregando...' : 'Calcular y Agregar a la Lista'}</span>
                </button>

                <button
                  id="btn-copiar-resumen-individual"
                  onClick={handleCopiarResumenIndividual}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar sólo este vidrio para WhatsApp</span>
                </button>
              </div>

              {/* Mini Vista Previa Gráfica Proporcional */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Vista Previa Proporcional de Corte
                </p>
                <div className="w-full h-28 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-3 relative overflow-hidden">
                  {geometria.anchoMm > 0 && geometria.altoMm > 0 ? (
                    (() => {
                      const maxW = 200;
                      const maxH = 80;
                      const aspect = (geometria.anchoMm || 1) / (geometria.altoMm || 1);
                      let w = maxW;
                      let h = maxW / aspect;
                      if (h > maxH) {
                        h = maxH;
                        w = maxH * aspect;
                      }

                      return (
                        <div
                          style={{ width: `${Math.round(w)}px`, height: `${Math.round(h)}px` }}
                          className={`relative rounded-xs border-2 transition-all flex items-center justify-center shadow-xs ${
                            tienePulido
                              ? 'border-sky-500 bg-sky-100/60'
                              : tieneBiselado
                              ? 'border-amber-500 bg-amber-100/50'
                              : 'border-emerald-600 bg-emerald-100/40'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-slate-700 font-mono select-none">
                            {geometria.anchoMm} × {geometria.altoMm}
                          </span>

                          {tienePerforaciones && (
                            <div className="absolute inset-0 flex items-center justify-around px-2 pointer-events-none">
                              {Array.from({ length: Math.min(4, cantidadPerforaciones) }).map((_, idx) => (
                                <div
                                  key={idx}
                                  className="w-2.5 h-2.5 rounded-full bg-slate-800/80 border border-white"
                                  title="Perforación"
                                ></div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <span className="text-xs text-slate-400 font-medium italic">
                      Ingresa el ancho y alto para visualizar el cristal
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. INTERFAZ DE LA LISTA: TABLA / RESUMEN DE CRISTALES COTIZADOS (CARRITO) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
        {/* Cabecera de la Sección de Lista */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  Lista de Cristales Cotizados
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                  {listaVidrios.length} {listaVidrios.length === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cristales calculados y acumulados para este pedido o presupuesto comercial.
              </p>
            </div>
          </div>

          {listaVidrios.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLimpiarLista}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
              >
                Vaciar lista
              </button>
            </div>
          )}
        </div>

        {/* Contenido: Tabla o Estado Vacío */}
        {listaVidrios.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Layers className="w-8 h-8 stroke-1" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-700">
                Aún no has agregado vidrios a la cotización
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Configura el cristal, medidas y acabados en el formulario de arriba y haz clic en{' '}
                <strong className="text-emerald-700 font-semibold">"Calcular y Agregar"</strong> para ir sumando cada cristal a esta lista.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] uppercase tracking-wider font-bold text-slate-600">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Descripción del Cristal & Acabados</th>
                  <th className="py-3 px-4 text-center">Medidas & Área</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 w-16 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {listaVidrios.map((item, index) => {
                  const esVidrioSuelto = item.tipoItem === 'VIDRIO_SUELTO' || item.origen === 'VIDRIO_SUELTO';
                  const nombreItem = item.nombreVidrio || item.descripcion || (item.molduraNombre ? `Cuadro: ${item.molduraNombre}` : 'Ítem');
                  const subtotalItem = Number(item.precio || item.subtotal || 0);
                  const precioUnitarioItem = Number(
                    item.precioUnitario || (item.cantidad > 0 ? subtotalItem / item.cantidad : subtotalItem)
                  );

                  return (
                    <tr
                      key={item.id || index}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* # Índice */}
                      <td className="py-4 px-4 text-center text-xs font-mono font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Descripción y Servicios */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">
                              {nombreItem}
                            </span>
                            {esVidrioSuelto ? (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  item.esTemplado
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                    : 'bg-sky-100 text-sky-700 border border-sky-200'
                                }`}
                              >
                                {item.esTemplado ? 'Templado' : 'Cristal Suelto'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                🖼️ Cuadro
                              </span>
                            )}
                          </div>

                          {/* Badges de Procesos y Manufactura */}
                          {esVidrioSuelto ? (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {item.tienePulido && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                                  <span>📏 Pulido:</span>
                                  <strong className="font-mono">{item.metrosPulido}m</strong>
                                </span>
                              )}
                              {item.tieneBiselado && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                  <span>✨ Biselado:</span>
                                  <strong className="font-mono">{item.metrosBiselado}m</strong>
                                </span>
                              )}
                              {item.tienePerforaciones && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                  <span>🔘</span>
                                  <strong className="font-mono">
                                    {item.cantidadPerforaciones} {item.cantidadPerforaciones === 1 ? 'hueco' : 'huecos'}
                                  </strong>
                                </span>
                              )}
                              {!item.tienePulido && !item.tieneBiselado && !item.tienePerforaciones && (
                                <span className="text-[11px] text-slate-400 italic">
                                  Corte estándar
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">
                              {item.descripcion}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Medidas y Área */}
                      <td className="py-4 px-4 text-center">
                        <div className="font-mono text-xs font-semibold text-slate-700">
                          {item.anchoMm && item.altoMm
                            ? `${item.anchoMm} × ${item.altoMm} mm`
                            : `${item.ancho} × ${item.alto} cm`}
                        </div>
                        {item.areaTotalM2 != null ? (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {item.areaTotalM2} m² total
                          </div>
                        ) : null}
                      </td>

                      {/* Cantidad */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                          {item.cantidad} {item.cantidad === 1 ? 'und' : 'unds'}
                        </span>
                      </td>

                      {/* Subtotal */}
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold font-mono text-slate-900 text-base block">
                          S/ {subtotalItem.toFixed(2)}
                        </span>
                        {item.cantidad > 1 && (
                          <span className="text-[11px] text-slate-400 font-mono block">
                            S/ {precioUnitarioItem.toFixed(2)} c/u
                          </span>
                        )}
                      </td>

                      {/* Botón Eliminar con ícono Trash de Lucide */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleEliminarItem(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Eliminar este ítem de la lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pie de Tabla: Gran Total y Botones de Acción Global */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Métricas Acumuladas */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <div className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400 uppercase tracking-wider font-bold block text-[10px]">
                  Total Ítems
                </span>
                <span className="font-extrabold text-slate-800 font-mono text-sm">
                  {listaVidrios.length} {listaVidrios.length === 1 ? 'cristal' : 'cristales'}
                </span>
              </div>

              <div className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400 uppercase tracking-wider font-bold block text-[10px]">
                  Total Piezas
                </span>
                <span className="font-extrabold text-slate-800 font-mono text-sm">
                  {totalPiezas} unidades
                </span>
              </div>

              <div className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400 uppercase tracking-wider font-bold block text-[10px]">
                  Área Acumulada
                </span>
                <span className="font-extrabold text-slate-800 font-mono text-sm">
                  {totalAreaM2} m²
                </span>
              </div>
            </div>

            {/* Tarjeta del Gran Total */}
            <div className="bg-emerald-500/10 border-2 border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between gap-6 sm:min-w-[280px]">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block">
                  GRAN TOTAL
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {listaVidrios.length > 0 ? `${totalPiezas} piezas en pedido` : 'Sin cristales'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-emerald-700 font-mono tracking-tight block">
                  S/ {granTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Botón de Acción Global: Crear Pedido / Enviar a Caja */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-slate-200/80">
            {listaVidrios.length > 0 && (
              <button
                type="button"
                onClick={handleCopiarResumenCompleto}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-sm transition shadow-2xs cursor-pointer"
              >
                <Copy className="w-4 h-4 text-emerald-600" />
                <span>Copiar Todo para WhatsApp</span>
              </button>
            )}

            <button
              id="btn-crear-pedido-caja"
              type="button"
              onClick={handleCrearPedido}
              disabled={listaVidrios.length === 0}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl font-extrabold text-base transition-all shadow-md active:scale-[0.99] cursor-pointer ${
                listaVidrios.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Crear Pedido / Enviar a Caja</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
