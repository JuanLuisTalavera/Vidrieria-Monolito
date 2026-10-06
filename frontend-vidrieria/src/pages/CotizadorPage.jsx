import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { usePedido } from '../context/PedidoContext';
import { enviarComprobanteWhatsApp } from '../utils/whatsappHelper';
import TrazadoVarillasGrafico from './components/TrazadoVarillasGrafico';
import { calcularOptimizacionVarillas } from '../utils/optimizadorCorteHelper';
import FormularioMarqueria from './cotizador/components/FormularioMarqueria';
import CatalogoEstandar from './cotizador/components/CatalogoEstandar';
import {
  CheckCircle2,
  Copy,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Scissors,
  Layers,
  Trash2,
  ShoppingCart,
} from 'lucide-react';

export default function CotizadorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 1. Consumir el Contexto Global de Pedido Unificado
  const {
    carritoGlobal,
    agregarAlCarrito,
    eliminarDelCarrito,
    vaciarCarrito,
    datosCliente,
    setDatosCliente,
    vaciarCliente,
  } = usePedido();
  const detalles = carritoGlobal;

  // Estados del Cliente enlazados directamente al contexto global
  const clienteDocumento = datosCliente.documento || '';
  const clienteTipoDocumento = datosCliente.tipoDocumento || 'DNI';
  const clienteNombre = datosCliente.nombre || '';
  const clienteTelefono = datosCliente.telefono || '';
  const clienteDireccion = datosCliente.direccion || '';

  const setClienteDocumento = (doc) => setDatosCliente({ documento: doc });
  const setClienteTipoDocumento = (tipo) => setDatosCliente({ tipoDocumento: tipo });
  const setClienteNombre = (nom) => setDatosCliente({ nombre: nom });
  const setClienteTelefono = (tel) => setDatosCliente({ telefono: tel });
  const setClienteDireccion = (dir) => setDatosCliente({ direccion: dir });
  const [tipoPrecio, setTipoPrecio] = useState('publico');

  // Estados de Búsqueda y Feedback CRM
  const [esClienteNuevo, setEsClienteNuevo] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [estadoCliente, setEstadoCliente] = useState(null); // null | 'encontrado' | 'nuevo'
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [mensajeCRM, setMensajeCRM] = useState(null);

  // 2. Datos del Cuadro que se está configurando actualmente
  const [modoIngreso, setModoIngreso] = useState('A_MEDIDA');
  const [productosEstandar, setProductosEstandar] = useState([]);
  const [vidrios, setVidrios] = useState([]);
  const [molduras, setMolduras] = useState([]);

  // Estados del Vidrio Suelto y Servicios Extras (Migración desde CotizadorVidriosPage)
  const [serviciosExtras, setServiciosExtras] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [vidrioId, setVidrioId] = useState('');
  const [anchoMm, setAnchoMm] = useState(1000); // en mm
  const [altoMm, setAltoMm] = useState(600);   // en mm
  const [cantidad, setCantidad] = useState(1);

  // Estados de Procesos / Manufactura del Vidrio
  const [tienePulido, setTienePulido] = useState(false);
  const [metrosPulido, setMetrosPulido] = useState('');
  const [pulidoModificadoManualmente, setPulidoModificadoManualmente] = useState(false);

  const [tieneBiselado, setTieneBiselado] = useState(false);
  const [metrosBiselado, setMetrosBiselado] = useState('');
  const [biseladoModificadoManualmente, setBiseladoModificadoManualmente] = useState(false);

  const [tienePerforaciones, setTienePerforaciones] = useState(false);
  const [cantidadPerforaciones, setCantidadPerforaciones] = useState(1);
  const [agregandoALista, setAgregandoALista] = useState(false);

  // Notificación Toast reactiva para vidrios y acciones del cotizador
  const [notificacion, setNotificacion] = useState(null);
  const showToast = (mensaje, tipo = 'success') => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => {
      setNotificacion(null);
    }, 3500);
  };

  // Estados para Modal de Confirmación de Venta
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);
  const [modalConfirmacionAbierto, setModalConfirmacionAbierto] = useState(false);

  // Estados para Modal de Trazado de Molduras 1D
  const [modalTrazadoAbierto, setModalTrazadoAbierto] = useState(false);
  const [optimizandoMolduras, setOptimizandoMolduras] = useState(false);
  const [datosOptimizacionMolduras, setDatosOptimizacionMolduras] = useState(null);

  // Handler para extraer los lados de los cuadros del carrito y optimizar cortes en varillas de 3.00 m
  const handleAbrirTrazadoMolduras = async () => {
    const cuadrosConMoldura = carritoGlobal.filter(
      (cuadro) =>
        (cuadro.idMoldura || cuadro.tipoItem === 'MARQUERIA') &&
        cuadro.tipoItem !== 'ESTANDAR' &&
        (Number(cuadro.ancho) > 0 || Number(cuadro.alto) > 0)
    );
    if (cuadrosConMoldura.length === 0) {
      alert('No hay cuadros con moldura en el pedido para optimizar el trazado.');
      return;
    }

    setOptimizandoMolduras(true);
    setModalTrazadoAbierto(true);

    const listaCortes = [];
    cuadrosConMoldura.forEach((cuadro, idx) => {
      const anchoMm = Math.round((Number(cuadro.ancho) || 0) * 10);
      const altoMm = Math.round((Number(cuadro.alto) || 0) * 10);
      const cant = Math.max(1, parseInt(cuadro.cantidad, 10) || 1);
      const nombreMoldura = cuadro.molduraNombre || `Cuadro #${idx + 1}`;

      if (anchoMm > 0) {
        listaCortes.push({
          longitudMm: anchoMm,
          etiqueta: `${nombreMoldura} - Ancho`,
          cantidad: 2 * cant,
        });
      }
      if (altoMm > 0) {
        listaCortes.push({
          longitudMm: altoMm,
          etiqueta: `${nombreMoldura} - Alto`,
          cantidad: 2 * cant,
        });
      }
    });

    if (listaCortes.length === 0) {
      alert('Las medidas de los cuadros deben ser mayores a 0 cm.');
      setOptimizandoMolduras(false);
      return;
    }

    try {
      const resultado = await calcularOptimizacionVarillas({
        longitudVarillaEstandarMm: 3000, // 3.00 metros para molduras de madera
        anchoSierraMm: 3, // 3 mm merma de disco ingletadora de madera
        cortes: listaCortes,
      });
      setDatosOptimizacionMolduras(resultado);
    } catch (err) {
      console.error('Error calculando optimización de molduras:', err);
    } finally {
      setOptimizandoMolduras(false);
    }
  };

  // 4. Datos de Liquidación y Pago Final
  const [montoAdelanto, setMontoAdelanto] = useState(0);
  const [tipoComprobante, setTipoComprobante] = useState('NOTA_VENTA');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [fechaEntrega, setFechaEntrega] = useState('');

  // Total acumulado sumando todos los ítems agregados al carrito global (redondeo al entero superior)
  const totalPedido = useMemo(() => {
    return Math.ceil(
      carritoGlobal.reduce(
        (sum, item) => sum + Number(item.subtotal || item.precio || item.precioUnitario || 0),
        0
      )
    );
  }, [carritoGlobal]);

  // Saldo pendiente calculado
  const saldoPendiente = Math.max(
    0,
    Math.ceil(totalPedido - (Number(montoAdelanto) || 0))
  );

  // Función para buscar cliente por número de documento (GET /api/v1/clientes/buscar/documento/{numero})
  const buscarCliente = useCallback(async (docParam) => {
    const docABuscar = (docParam !== undefined ? docParam : clienteDocumento).trim();
    if (!docABuscar) {
      setMensajeCRM({
        texto: 'Por favor ingresa un número de documento para buscar.',
        tipo: 'error',
      });
      setTimeout(() => setMensajeCRM(null), 3500);
      return;
    }

    setBuscandoCliente(true);
    setMensajeCRM(null);

    try {
      const res = await axiosClient.get(
        `/api/v1/clientes/buscar/documento/${encodeURIComponent(docABuscar)}`
      );

      if (res.data) {
        const c = res.data;
        const nombreObtenido = c.nombreRazonSocial || c.nombre || c.razonSocial || '';
        const telefonoObtenido = c.telefono || c.celular || '';
        const direccionObtenida = c.direccion || '';
        const tipoObtenido = c.tipoDocumento || (docABuscar.length === 11 ? 'RUC' : 'DNI');

        setDatosCliente({
          documento: docABuscar,
          tipoDocumento: tipoObtenido,
          nombre: nombreObtenido,
          telefono: telefonoObtenido,
          direccion: direccionObtenida,
        });
        setEsClienteNuevo(false);
        setEstadoCliente('encontrado');
        setMensajeCRM({
          texto: `Cliente encontrado: "${nombreObtenido}". Datos autocompletados.`,
          tipo: 'success',
        });
        setTimeout(() => setMensajeCRM(null), 4000);
      }
    } catch {
      // Si devuelve 404 (o error al no existir), limpia campos y activa esClienteNuevo
      setDatosCliente({
        nombre: '',
        telefono: '',
        direccion: '',
      });
      setEsClienteNuevo(true);
      setEstadoCliente('nuevo');
      setMensajeCRM({
        texto: 'Cliente no encontrado, por favor ingrese los datos',
        tipo: 'nuevo',
      });
    } finally {
      setBuscandoCliente(false);
    }
  }, [clienteDocumento, setDatosCliente]);

  // Si llega ?documento=... por URL (ej. desde ClientesPage), autoiniciar la búsqueda
  useEffect(() => {
    const docQuery = searchParams.get('documento');
    if (docQuery && docQuery.trim()) {
      setClienteDocumento(docQuery.trim());
      buscarCliente(docQuery.trim());
    }
  }, [searchParams, buscarCliente]);

  // Registrar cliente inline directamente desde el cotizador (POST /api/v1/clientes)
  const registrarClienteInline = async () => {
    const doc = clienteDocumento.trim();
    const nom = clienteNombre.trim();

    if (!doc) {
      alert('Ingresa el número de documento antes de guardar.');
      return;
    }
    if (!nom) {
      alert('Por favor ingrese el nombre o razón social del cliente.');
      return;
    }

    setGuardandoCliente(true);
    try {
      const payload = {
        tipoDocumento: clienteTipoDocumento,
        numeroDocumento: doc,
        numero: doc,
        nombreRazonSocial: nom,
        nombre: nom,
        razonSocial: nom,
        telefono: clienteTelefono.trim(),
        direccion: clienteDireccion.trim(),
      };

      const res = await axiosClient.post('/api/v1/clientes', payload);
      if (res.status === 200 || res.status === 201 || res.data) {
        alert('Cliente guardado exitosamente');
        setEsClienteNuevo(false);
        setEstadoCliente('encontrado');
        setMensajeCRM({
          texto: `¡Cliente "${nom}" guardado exitosamente en la base de datos!`,
          tipo: 'success',
        });
        setTimeout(() => setMensajeCRM(null), 4000);
      }
    } catch (err) {
      console.error('Error al registrar cliente inline:', err);
      const msg = err.response?.data?.message || 'Error al guardar el cliente en la base de datos.';
      alert(msg);
    } finally {
      setGuardandoCliente(false);
    }
  };

  // Limpiar campos del cliente
  const handleLimpiarCliente = () => {
    vaciarCliente();
    setEsClienteNuevo(false);
    setEstadoCliente(null);
    setMensajeCRM(null);
  };

  // Carga inicial de catálogos (vidrios, molduras, productos estándar y servicios extras)
  useEffect(() => {
    let isMounted = true;

    const cargarCatalogos = async () => {
      try {
        const [resVidrios, resMateriales, resEstandar, resServicios] = await Promise.all([
          axiosClient.get('/api/v1/vidrios'),
          axiosClient.get('/api/v1/materiales', {
            params: { categoria: 'MOLDURA' },
          }),
          axiosClient.get('/api/v1/materiales?categoria=PRODUCTO_ESTANDAR'),
          axiosClient.get('/api/v1/servicios-extras').catch(() => ({ data: [] })),
        ]);
        if (isMounted) {
          const listVidrios = Array.isArray(resVidrios.data) ? resVidrios.data : [];
          setVidrios(listVidrios);
          if (listVidrios.length > 0) {
            setVidrioId(String(listVidrios[0].idVidrio ?? listVidrios[0].id));
          }
          setMolduras(Array.isArray(resMateriales.data) ? resMateriales.data : []);
          setProductosEstandar(Array.isArray(resEstandar.data) ? resEstandar.data : []);
          if (Array.isArray(resServicios?.data)) {
            setServiciosExtras(resServicios.data);
          }
        }
      } catch (error) {
        console.error('Error al cargar catálogos (vidrios/materiales/estándar/servicios):', error);
      } finally {
        if (isMounted) setCargandoCatalogo(false);
      }
    };

    cargarCatalogos();

    return () => {
      isMounted = false;
    };
  }, []);





  // ============================================================
  // LÓGICA DE MATEMÁTICAS Y PROCESOS DE VIDRIOS SUELTOS
  // ============================================================

  // Vidrio seleccionado del catálogo para Vidrios Sueltos
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

  // Acción: Agregar Vidrio Suelto con Manufactura al Carrito Unificado
  const handleAgregarVidrioSuelto = async (e) => {
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

      showToast(`¡"${nombreVidrio} (${dimTexto})" agregado al pedido!`);
    } catch (error) {
      console.error("Error al agregar vidrio a la lista:", error);
      alert('Error inesperado al agregar el cristal a la lista.');
    } finally {
      setAgregandoALista(false);
    }
  };

  // Copiar resumen de la pieza en configuración para WhatsApp
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
      showToast('¡Cotización de cristal copiada al portapapeles!');
    });
  };

  // Optimizar corte de vidrios en trazador 2D
  const handleOptimizarCorteVidrio = () => {
    const vidriosEnCarrito = carritoGlobal.filter(
      (item) => item.tipoItem === 'VIDRIO_SUELTO' || item.origen === 'VIDRIO_SUELTO'
    );

    if (vidriosEnCarrito.length > 0) {
      const piezas = vidriosEnCarrito.map((item, idx) => ({
        id: `${item.id}-${idx}`,
        etiqueta: `${item.nombreVidrio} (${item.anchoMm}×${item.altoMm})`,
        anchoMm: item.anchoMm,
        altoMm: item.altoMm,
        cantidad: item.cantidad,
      }));

      const stateData = {
        piezas,
        tipoCristalId: vidriosEnCarrito[0]?.vidrioId || vidriosEnCarrito[0]?.idVidrio,
      };

      navigate('/trazador-vidrio', { state: stateData });
      return;
    }

    if (geometria.anchoMm <= 0 || geometria.altoMm <= 0) {
      showToast('Ingresa las medidas del vidrio o agrega cristales al pedido para optimizar', 'error');
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

  // Acción 2: Eliminar un cuadro del carrito
  const handleEliminarCuadro = (id) => {
    eliminarDelCarrito(id);
  };

  // Acción 3: Vaciar todos los cuadros del carrito
  const handleVaciarCarrito = () => {
    if (window.confirm('¿Deseas eliminar todos los cuadros e ítems agregados al pedido?')) {
      vaciarCarrito();
    }
  };

  // Acción 4: Registrar la Venta Completa en el Backend (POST /api/v1/pedidos)
  const handleRegistrarVentaCompleta = async () => {
    if (carritoGlobal.length === 0) {
      alert('Debes agregar al menos un ítem al pedido antes de registrar la venta.');
      return;
    }

    const adelantoNum = Number(montoAdelanto) || 0;
    const saldo = Math.max(0, Math.round((totalPedido - adelantoNum) * 100) / 100);

    // Determinar la categoría principal o mixta
    const tieneMarqueria = carritoGlobal.some(
      (i) => i.tipoItem === 'MARQUERIA' || i.origen === 'MARQUERIA' || i.idMoldura
    );
    const tieneVidrioSuelto = carritoGlobal.some(
      (i) => i.tipoItem === 'VIDRIO_SUELTO' || i.origen === 'VIDRIO_SUELTO'
    );

    let tipoTrabajo = 'MARQUERIA';
    if (tieneMarqueria && tieneVidrioSuelto) {
      tipoTrabajo = 'GENERAL';
    } else if (tieneVidrioSuelto && !tieneMarqueria) {
      tipoTrabajo = 'VIDRIERIA';
    }

    const referencia =
      carritoGlobal.length === 1
        ? carritoGlobal[0].descripcion
        : `${carritoGlobal.length} ítems (${tieneMarqueria ? 'Cuadros' : ''}${tieneMarqueria && tieneVidrioSuelto ? ' y ' : ''}${tieneVidrioSuelto ? 'Vidrios Sueltos' : ''})`;

    const datosPedido = {
      clienteNombre: clienteNombre.trim() !== '' ? clienteNombre.trim() : 'Cliente en Mostrador',
      clienteTelefono: clienteTelefono.trim() !== '' ? clienteTelefono.trim() : 'Sin teléfono',
      clienteDocumento: clienteDocumento.trim() !== '' ? clienteDocumento.trim() : null,
      clienteDireccion: clienteDireccion.trim() !== '' ? clienteDireccion.trim() : null,
      referenciaObra: referencia,
      tipoTrabajo: tipoTrabajo,
      total: Number(totalPedido || 0),
      montoAdelanto: Number(adelantoNum || 0),
      saldoPendiente: Number(saldo || 0),
      tipoComprobante: tipoComprobante,
      metodoPago: metodoPago,
      fechaEntrega: fechaEntrega ? new Date(fechaEntrega).toISOString() : null,
      detalles: detalles.map((d) => ({
        ancho: Number(d.ancho || (d.anchoMm ? d.anchoMm / 10 : 0)),
        alto: Number(d.alto || (d.altoMm ? d.altoMm / 10 : 0)),
        anchoVano: Number(d.anchoVano || (d.anchoMm ? d.anchoMm / 10 : 0)),
        altoVano: Number(d.altoVano || (d.altoMm ? d.altoMm / 10 : 0)),
        cantidad: Number(d.cantidad || 1),
        precioUnitario: Number(d.precioUnitario || d.precio || 0),
        subtotal: Number(d.subtotal || d.precioTotal || d.total || 0),
        idMoldura: d.idMoldura ? Number(d.idMoldura) : null,
        idVidrio: d.idVidrio ? Number(d.idVidrio) : (d.vidrioId ? Number(d.vidrioId) : null),
        descontarStock: d.descontarStock !== undefined ? Boolean(d.descontarStock) : true,
        descripcion: d.descripcion || 'Cristal/Cuadro a medida',
        detallesDespiece: d.detallesDespiece || null,
      })),
    };

    try {
      const res = await axiosClient.post('/api/v1/pedidos', datosPedido);
      const pedidoCreado = {
        ...(res.data || {}),
        idPedido: res.data?.idPedido || res.data?.id,
        clienteNombre: datosPedido.clienteNombre,
        clienteTelefono: datosPedido.clienteTelefono,
        total: totalPedido,
        montoAdelanto: adelantoNum,
        saldoPendiente: saldo,
        fechaEntrega: datosPedido.fechaEntrega,
        estado: res.data?.estado || 'COTIZADO',
        detalles: [...carritoGlobal],
      };

      setPedidoConfirmado(pedidoCreado);
      setModalConfirmacionAbierto(true);

      // Limpiar pedido completo
      vaciarCarrito();
      setMontoAdelanto(0);
      setTipoComprobante('NOTA_VENTA');
      setMetodoPago('EFECTIVO');
      setFechaEntrega('');
      handleLimpiarCliente();
    } catch (error) {
      alert('Error al registrar el pedido. Revisa la consola para más detalles.');
      console.error(error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
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
          <button onClick={() => setNotificacion(null)} className="text-slate-400 hover:text-slate-600 ml-2 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* ENCABEZADO PRINCIPAL                                         */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Punto de Venta Omnicanal &bull; Carrito Multiproducto
            </span>
            <span className="text-xs text-slate-400">Marquería &bull; Vidriería &bull; Almacén</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Punto de Venta & Cotizador Unificado
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configura cuadros a medida, cristales sueltos con manufactura o productos estándar en un solo pedido con liquidación y caja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {carritoGlobal.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              🛒 {carritoGlobal.length} {carritoGlobal.length === 1 ? 'ítem en carrito' : 'ítems en carrito'}
            </span>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECCIÓN 1: FORMULARIO CONFIGURADOR / CATÁLOGO ESTÁNDAR       */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${
                modoIngreso === 'A_MEDIDA' ? 'bg-blue-50 text-blue-600' : modoIngreso === 'VIDRIO_SUELTO' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {modoIngreso === 'A_MEDIDA' ? '📐' : modoIngreso === 'VIDRIO_SUELTO' ? '🪟' : '🛍️'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {modoIngreso === 'A_MEDIDA'
                    ? '1. Configuración del Cuadro'
                    : modoIngreso === 'VIDRIO_SUELTO'
                    ? '1. Cotizador de Vidrios Sueltos'
                    : '1. Catálogo de Productos Estándar'}
                </h2>
                <p className="text-xs text-slate-400">
                  {modoIngreso === 'A_MEDIDA'
                    ? 'Ingresa las dimensiones y selecciona la moldura, el vidrio y los acabados'
                    : modoIngreso === 'VIDRIO_SUELTO'
                    ? 'Calcula cortes de cristal con manufactura (pulido, biselado y perforaciones)'
                    : 'Selecciona productos terminados listos para agregar directamente al pedido'}
                </p>
              </div>
            </div>

            {/* Botones Toggle Switch (A Medida / Vidrio Suelto / Productos Estándar) */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setModoIngreso('A_MEDIDA')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  modoIngreso === 'A_MEDIDA'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>📐</span>
                <span>A Medida</span>
              </button>
              <button
                type="button"
                onClick={() => setModoIngreso('VIDRIO_SUELTO')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  modoIngreso === 'VIDRIO_SUELTO'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>🪟</span>
                <span>Vidrio Suelto</span>
              </button>
              <button
                type="button"
                onClick={() => setModoIngreso('ESTANDAR')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  modoIngreso === 'ESTANDAR'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>🛍️</span>
                <span>Productos Estándar</span>
                {productosEstandar.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                    modoIngreso === 'ESTANDAR'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {productosEstandar.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Selector de Tarifa: Visible únicamente si modoIngreso === 'A_MEDIDA' */}
          {modoIngreso === 'A_MEDIDA' && (
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <label htmlFor="tipoTarifa" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Tarifa:
              </label>
              <select
                id="tipoTarifa"
                value={tipoPrecio}
                onChange={(e) => setTipoPrecio(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition cursor-pointer"
              >
                <option value="publico">Público General</option>
                <option value="mayorista">Mayorista</option>
                <option value="corte_chico">Corte Chico / Retazo</option>
              </select>
            </div>
          )}
        </div>

        {/* Vista A MEDIDA: Formulario de Marquería (Subcomponente) */}
        {modoIngreso === 'A_MEDIDA' && (
          <FormularioMarqueria
            vidrios={vidrios}
            molduras={molduras}
            tipoPrecio={tipoPrecio}
            agregarAlCarrito={agregarAlCarrito}
          />
        )}

        {/* Vista VIDRIO_SUELTO: Formulario de Vidrios Sueltos con Manufactura */}
        {modoIngreso === 'VIDRIO_SUELTO' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <div className="lg:col-span-7 space-y-6">
              {/* Tarjeta 1: Selección de Cristal y Medidas */}
              <div className="bg-slate-50/50 p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>1. Cristal y Dimensiones</span>
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
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
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition bg-white cursor-pointer"
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
                    <div className="mt-2.5 p-3 rounded-xl bg-white border border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
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
                        className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold font-mono text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
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
                        className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold font-mono text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
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
                        className="w-full py-2.5 text-center border-y border-slate-300 bg-white text-sm font-bold font-mono text-slate-800 outline-none"
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
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Área x Pieza</span>
                    <span className="text-sm font-bold text-slate-700 font-mono">{geometria.areaUnitariaM2} m²</span>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">Área Total</span>
                    <span className="text-sm font-extrabold text-emerald-800 font-mono">{geometria.areaTotalM2} m²</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
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
              <div className="bg-slate-50/50 p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <span>2. Procesos y Manufactura del Vidrio</span>
                    </h3>
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

              {/* BOTÓN PRINCIPAL DEL FORMULARIO: CALCULAR Y AGREGAR AL PEDIDO */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>¿Medidas y acabados listos?</span>
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Calcula el subtotal con el backend y suma este cristal al pedido unificado.
                  </p>
                </div>

                <button
                  id="btn-calcular-y-agregar-principal"
                  type="button"
                  onClick={handleAgregarVidrioSuelto}
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
                      <span>Calcular y Agregar Vidrio</span>
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
                      type="button"
                      onClick={handleAgregarVidrioSuelto}
                      disabled={agregandoALista}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm rounded-xl shadow-xs hover:shadow transition cursor-pointer"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>{agregandoALista ? 'Agregando...' : 'Calcular y Agregar al Pedido'}</span>
                    </button>

                    <button
                      id="btn-copiar-resumen-individual"
                      type="button"
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
        )}

        {/* Vista ESTÁNDAR: Catálogo de Productos Estándar (Subcomponente) */}
        {modoIngreso === 'ESTANDAR' && (
          <CatalogoEstandar
            productosEstandar={productosEstandar}
            agregarAlCarrito={agregarAlCarrito}
          />
        )}
      </div>

      {/* ============================================================ */}
      {/* SECCIÓN 2: TABLA DEL CARRITO (CUADROS Y VIDRIOS EN EL PEDIDO) */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-base">
              📦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  2. Ítems en el Pedido (Cuadros y Vidrios Sueltos)
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  {carritoGlobal.length} {carritoGlobal.length === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Lista unificada de ítems listos para fabricar y cobrar.
              </p>
            </div>
          </div>

          {carritoGlobal.length > 0 && (
            <div className="flex items-center gap-2">
              {carritoGlobal.some((cuadro) => (cuadro.idMoldura || cuadro.tipoItem === 'MARQUERIA') && cuadro.tipoItem !== 'ESTANDAR') && (
                <button
                  type="button"
                  onClick={handleAbrirTrazadoMolduras}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 shadow-xs transition-all cursor-pointer"
                  title="Calcular esquema óptimo de corte de molduras en varillas de 3.00m"
                >
                  <span>📐</span>
                  <span>Trazado Molduras 1D</span>
                </button>
              )}

              {carritoGlobal.some((i) => i.tipoItem === 'VIDRIO_SUELTO' || i.origen === 'VIDRIO_SUELTO') && (
                <button
                  type="button"
                  onClick={handleOptimizarCorteVidrio}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 active:scale-95 text-white shadow-xs transition-all cursor-pointer"
                  title="Optimizar corte de vidrios en plancha 2D"
                >
                  <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Optimizar Corte 2D Vidrios</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleVaciarCarrito}
                className="self-start sm:self-auto text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold cursor-pointer ml-1"
              >
                Vaciar lista
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5 w-12 text-center">#</th>
                <th className="px-5 py-3.5">Tipo & Medidas</th>
                <th className="px-5 py-3.5">Moldura / Perfil</th>
                <th className="px-5 py-3.5">Vidrio & Acabados</th>
                <th className="px-5 py-3.5 text-center">Inventario</th>
                <th className="px-5 py-3.5 text-right">Extras / Manufactura</th>
                <th className="px-5 py-3.5 text-right">Subtotal</th>
                <th className="px-5 py-3.5 text-center w-24">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carritoGlobal.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                      <span className="text-3xl">🛒</span>
                      <span className="font-bold text-slate-700">El carrito de pedidos está vacío</span>
                      <span className="text-xs text-slate-500">
                        Agrega cuadros a medida, cristales sueltos con manufactura o productos listos desde las pestañas superiores.
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setModoIngreso('A_MEDIDA')}
                          className="text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          📐 Configurar Cuadro
                        </button>
                        <button
                          type="button"
                          onClick={() => setModoIngreso('VIDRIO_SUELTO')}
                          className="text-xs font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          🪟 Configurar Vidrio Suelto
                        </button>
                        <button
                          type="button"
                          onClick={() => setModoIngreso('ESTANDAR')}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          🛍️ Ver Productos Listos
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                carritoGlobal.map((cuadro, idx) => {
                  const item = cuadro;
                  const esVidrioSuelto = item.tipoItem === 'VIDRIO_SUELTO' || item.origen === 'VIDRIO_SUELTO';
                  const esEstandar = item.tipoItem === 'ESTANDAR' || item.origen === 'ESTANDAR';
                  const subtotalItem = Number(item.subtotal || item.precio || 0);

                  return (
                    <tr
                      key={item.id || idx}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        esVidrioSuelto ? 'bg-sky-50/20' : esEstandar ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-500 text-xs">
                        {idx + 1}
                      </td>

                      {/* Tipo & Medidas */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {esVidrioSuelto ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                🪟 Vidrio Suelto
                              </span>
                            ) : esEstandar ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                🛍️ Estándar
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                🖼️ Cuadro
                              </span>
                            )}
                            {(item.cantidad || 1) > 1 && (
                              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.cantidad}x
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-slate-800 font-mono text-xs">
                            {esVidrioSuelto
                              ? `${item.anchoMm ?? (item.ancho * 10)} × ${item.altoMm ?? (item.alto * 10)} mm`
                              : esEstandar
                                ? 'Producto Terminado'
                                : `${item.ancho} × ${item.alto} cm`}
                            {item.areaTotalM2 != null && (
                              <span className="text-[10px] text-slate-400 font-normal ml-1">
                                ({item.areaTotalM2} m²)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Moldura / Producto */}
                      <td className="px-5 py-3.5 text-slate-700">
                        {esEstandar ? (
                          <div className="font-semibold text-slate-800">{item.molduraNombre}</div>
                        ) : cuadro.idMoldura || (cuadro.molduraNombre && cuadro.molduraNombre !== 'Sin Moldura' && cuadro.molduraNombre !== 'Sin moldura') ? (
                          <div className="font-medium text-slate-800">{cuadro.molduraNombre}</div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">
                            Corte de Cristal Directo
                          </span>
                        )}
                        {cuadro.cobrarVarillaEntera && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 block w-fit mt-1">
                            Varilla entera
                          </span>
                        )}
                      </td>

                      {/* Vidrio */}
                      <td className="px-5 py-3.5 text-slate-700">
                        {esEstandar ? (
                          <span className="text-slate-400 text-xs italic">N/A (Listo)</span>
                        ) : (
                          <>
                            <div className="font-medium text-slate-800">
                              {cuadro.vidrioNombre || cuadro.nombreVidrio || 'Sin Vidrio'}
                            </div>
                            {cuadro.serviciosList && cuadro.serviciosList.length > 0 && (
                              <div className="text-xs text-sky-600 font-medium mt-0.5">
                                {cuadro.serviciosList.join(' + ')}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      {/* Inventario */}
                      <td className="px-5 py-3.5 text-center">
                        {item.descontarStock !== false ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" title="Se descontará del inventario">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Descuenta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200" title="No se descontará del inventario">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            No descuenta
                          </span>
                        )}
                      </td>

                      {/* Extras / Armado / Manufactura */}
                      <td className="px-5 py-3.5 text-right font-mono text-slate-600 text-xs">
                        {esEstandar ? (
                          <span className="text-slate-400 text-xs">-</span>
                        ) : esVidrioSuelto ? (
                          <div>
                            <span className="text-slate-800 font-semibold">
                              S/ {Number(item.costoManufactura || 0).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-sans">
                              Manufactura
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-800 font-semibold">
                              S/ {Number(item.costoArmado || 0).toFixed(0)}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-sans">
                              Kit armado
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Subtotal */}
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600 text-base whitespace-nowrap">
                        S/ {subtotalItem.toFixed(0)}
                      </td>

                      {/* Acción */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleEliminarCuadro(item.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar este ítem del pedido"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen del Carrito */}
        {carritoGlobal.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <span className="text-slate-600 text-xs">
              Total de ítems configurados en pedido: <strong>{carritoGlobal.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Total del Pedido ({carritoGlobal.length} ítems):
              </span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                S/ {totalPedido.toFixed(0)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECCIÓN 3: PAGO FINAL, COMPROBANTE Y DATOS DEL CLIENTE       */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h2 className="text-lg font-bold text-slate-800">
              3. Datos del Cliente & Liquidación de Pago
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Identifica o registra al cliente en el CRM y define las condiciones de pago para cerrar la venta completa.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* TARJETA IZQUIERDA: CRM / DATOS DEL CLIENTE */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
                  👤
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Cliente / CRM
                  </h3>
                  <p className="text-xs text-slate-400">Búsqueda rápida por documento o registro directo</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {estadoCliente === 'encontrado' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    En CRM
                  </span>
                )}
                {estadoCliente === 'nuevo' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Nuevo
                  </span>
                )}
                {(clienteNombre || clienteDocumento) && (
                  <button
                    type="button"
                    onClick={handleLimpiarCliente}
                    className="text-xs text-slate-400 hover:text-slate-600 transition underline cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* MENSAJE FEEDBACK CRM */}
            {mensajeCRM && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                  mensajeCRM.tipo === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : mensajeCRM.tipo === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{mensajeCRM.tipo === 'success' ? '✅' : mensajeCRM.tipo === 'error' ? '⚠️' : 'ℹ️'}</span>
                  <span>{mensajeCRM.texto}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMensajeCRM(null)}
                  className="opacity-60 hover:opacity-100 cursor-pointer ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* BÚSQUEDA POR DOCUMENTO */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div className="flex flex-col sm:flex-row sm:items-end gap-2.5">
                <div className="w-full sm:w-32 shrink-0">
                  <label htmlFor="tipoDoc" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo
                  </label>
                  <select
                    id="tipoDoc"
                    value={clienteTipoDocumento}
                    onChange={(e) => setClienteTipoDocumento(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition cursor-pointer"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">C.E.</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label htmlFor="clienteDocumento" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Número de Documento
                  </label>
                  <div className="relative">
                    <input
                      id="clienteDocumento"
                      type="text"
                      value={clienteDocumento}
                      onChange={(e) => {
                        setClienteDocumento(e.target.value);
                        if (estadoCliente) setEstadoCliente(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          buscarCliente();
                        }
                      }}
                      placeholder="Ej. 72345678 y Enter..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition"
                    />
                    {clienteDocumento && (
                      <button
                        type="button"
                        onClick={() => {
                          setClienteDocumento('');
                          setEstadoCliente(null);
                        }}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => buscarCliente()}
                  disabled={buscandoCliente}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-all cursor-pointer text-xs disabled:opacity-70"
                >
                  {buscandoCliente ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Buscar</span>
                  )}
                </button>
              </div>
            </div>

            {/* SI ES NUEVO: BOTÓN GUARDAR CLIENTE EN BD */}
            {esClienteNuevo && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3">
                <div className="text-xs text-emerald-900">
                  <strong>Cliente nuevo:</strong> Llena sus datos y regístralo en CRM con un clic.
                </div>
                <button
                  type="button"
                  onClick={registrarClienteInline}
                  disabled={guardandoCliente}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer shrink-0 disabled:opacity-60"
                >
                  {guardandoCliente ? 'Guardando...' : '💾 Guardar en CRM'}
                </button>
              </div>
            )}

            {/* INPUTS DETALLE CLIENTE */}
            <div className="space-y-3">
              <div>
                <label htmlFor="clienteNombre" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre o Razón Social {esClienteNuevo && <span className="text-emerald-600 font-bold">*</span>}
                </label>
                <input
                  id="clienteNombre"
                  type="text"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez o Inversiones S.A.C."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="clienteTelefono" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    id="clienteTelefono"
                    type="text"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    placeholder="Ej. 987654321"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition"
                  />
                </div>

                <div>
                  <label htmlFor="clienteDireccion" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dirección / Referencia
                  </label>
                  <input
                    id="clienteDireccion"
                    type="text"
                    value={clienteDireccion}
                    onChange={(e) => setClienteDireccion(e.target.value)}
                    placeholder="Ej. Jr. Ayacucho 123"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TARJETA DERECHA: LIQUIDACIÓN, PAGO Y REGISTRO FINAL (POS) */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Caja & Liquidación
                  </h3>
                  <p className="text-xs text-slate-400">Total acumulado de los cuadros en carrito</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {carritoGlobal.length} {carritoGlobal.length === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>

            {/* Total Acumulado a Cobrar */}
            <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border-2 border-emerald-500/80 rounded-xl p-4 text-center">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
                Total de la Venta
              </p>
              <p className="text-3xl sm:text-4xl text-emerald-700 font-extrabold tracking-tight font-mono">
                S/ {totalPedido.toFixed(0)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Suma total de los {carritoGlobal.length} ítems agregados al pedido
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Selector Tipo de Comprobante */}
              <div>
                <label htmlFor="tipoComprobante" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Comprobante
                </label>
                <select
                  id="tipoComprobante"
                  value={tipoComprobante}
                  onChange={(e) => setTipoComprobante(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-500 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs outline-none cursor-pointer"
                >
                  <option value="NOTA_VENTA">Nota de Venta (Interno)</option>
                  <option value="BOLETA">Boleta de Venta</option>
                  <option value="FACTURA">Factura Electrónica</option>
                </select>
              </div>

              {/* Selector Método de Pago */}
              <div>
                <label htmlFor="metodoPago" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Método de Pago
                </label>
                <select
                  id="metodoPago"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-500 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs outline-none cursor-pointer"
                >
                  <option value="EFECTIVO">EFECTIVO</option>
                  <option value="YAPE">YAPE / PLIN</option>
                  <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                </select>
              </div>

              {/* Selector Fecha Estimada de Entrega */}
              <div>
                <label htmlFor="fechaEntrega" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Fecha y Hora de Entrega
                </label>
                <input
                  id="fechaEntrega"
                  type="datetime-local"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-500 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Adelanto / A Cuenta */}
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="montoAdelanto" className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                  Adelanto en Caja (S/)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMontoAdelanto(Math.ceil(totalPedido / 2))}
                    className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors cursor-pointer"
                    title="Cobrar 50% de adelanto"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setMontoAdelanto(totalPedido)}
                    className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors cursor-pointer"
                    title="Cobrar 100% / Total"
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setMontoAdelanto(0)}
                    className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                    title="Sin adelanto"
                  >
                    S/ 0
                  </button>
                </div>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600 font-bold text-sm">
                  S/
                </span>
                <input
                  id="montoAdelanto"
                  type="number"
                  step="any"
                  min="0"
                  value={montoAdelanto === 0 ? '' : montoAdelanto}
                  onChange={(e) =>
                    setMontoAdelanto(e.target.value === '' ? 0 : Number(e.target.value))
                  }
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-blue-300 focus:border-blue-500 rounded-lg text-base font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400/20 shadow-2xs text-right transition"
                />
              </div>
            </div>

            {/* Saldo Pendiente */}
            <div
              className={`rounded-xl p-3 border text-center transition-colors ${
                saldoPendiente <= 0 && totalPedido > 0
                  ? 'bg-emerald-50/50 border-emerald-300 text-emerald-800'
                  : 'bg-rose-50/60 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span>Saldo Pendiente:</span>
                <span className="font-mono text-base font-extrabold">
                  S/ {saldoPendiente.toFixed(0)}
                </span>
              </div>
              {saldoPendiente <= 0 && totalPedido > 0 && (
                <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  ✓ Pagado por completo
                </span>
              )}
            </div>

            {/* Botón Final: Registrar Venta Completa */}
            <button
              type="button"
              onClick={handleRegistrarVentaCompleta}
              disabled={carritoGlobal.length === 0}
              className={`w-full font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                carritoGlobal.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-98 text-white shadow-blue-500/25'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>
                {carritoGlobal.length === 0
                  ? 'Agrega productos para registrar venta'
                  : `Registrar Venta Completa (S/ ${totalPedido.toFixed(0)})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL DE CONFIRMACIÓN DE VENTA Y ENVÍO POR WHATSAPP          */}
      {/* ============================================================ */}
      {modalConfirmacionAbierto && pedidoConfirmado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header con estilo festivo */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-white text-center relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center text-3xl mb-3 shadow-inner">
                🎉
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">¡Venta Registrada Exitosamente!</h3>
              <p className="text-emerald-100 text-xs mt-1">
                Nota de Pedido #{pedidoConfirmado.idPedido} guardada en el sistema
              </p>
            </div>

            {/* Contenido del Resumen */}
            <div className="p-6 space-y-5">
              {/* Tarjeta de Resumen Financiero */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5 text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wider">Cliente:</span>
                  <span className="font-bold text-slate-900">{pedidoConfirmado.clienteNombre}</span>
                </div>
                {pedidoConfirmado.clienteTelefono && (
                  <div className="flex justify-between items-center text-slate-600 text-xs">
                    <span>Teléfono / WhatsApp:</span>
                    <span className="font-mono font-medium text-slate-800">{pedidoConfirmado.clienteTelefono}</span>
                  </div>
                )}
                <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center">
                  <span className="font-medium text-slate-700">Total de la Venta:</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    S/ {Number(pedidoConfirmado.total || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-blue-700">
                  <span>Adelanto pagado:</span>
                  <span className="font-bold font-mono">
                    S/ {Number(pedidoConfirmado.montoAdelanto || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-rose-700 font-semibold">
                  <span>Saldo pendiente:</span>
                  <span className="font-mono font-bold">
                    S/ {Number(pedidoConfirmado.saldoPendiente || 0).toFixed(2)}
                  </span>
                </div>
                {pedidoConfirmado.fechaEntrega && (
                  <div className="flex justify-between items-center text-xs text-blue-800 bg-blue-50/80 px-2.5 py-1.5 rounded-lg border border-blue-200 font-semibold">
                    <span>📅 Entrega estimada:</span>
                    <span className="font-mono font-bold">
                      {new Date(pedidoConfirmado.fechaEntrega).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Botón Principal: Enviar Comprobante por WhatsApp */}
              <button
                type="button"
                onClick={() => enviarComprobanteWhatsApp(pedidoConfirmado)}
                className="w-full inline-flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold px-5 py-3.5 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer text-sm"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>Enviar Comprobante por WhatsApp</span>
              </button>

              {/* Botones Secundarios */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalConfirmacionAbierto(false);
                    navigate('/pedidos');
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Ir a Lista de Pedidos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalConfirmacionAbierto(false)}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Nueva Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================ */}
      {/* MODAL DE TRAZADO Y CORTE DE MOLDURAS (3.00 M)                 */}
      {/* ============================================================ */}
      {modalTrazadoAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
                  📐
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">
                    Trazado y Optimización de Molduras de Madera
                  </h3>
                  <p className="text-xs text-slate-400">
                    Varillas estándar de 3.00 m (3000 mm) con disco de 3 mm para enmarcado
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTrazadoAbierto(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido con scroll */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {optimizandoMolduras ? (
                <div className="py-16 text-center">
                  <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">Calculando empaquetado de molduras...</p>
                  <p className="text-xs text-slate-400 mt-1">Optimizando varillas de 3.00 metros para el enmarcador</p>
                </div>
              ) : (
                <TrazadoVarillasGrafico
                  datosOptimizacion={datosOptimizacionMolduras}
                  titulo="Esquema de Corte de Molduras en Taller"
                  subtitulo="Medidas exactas en mm para cortes a inglete 45° en varillas de madera de 3.00 metros"
                  unidadMedida="cm"
                />
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>
                Total cuadros procesados:{' '}
                <strong>
                  {
                    carritoGlobal.filter(
                      (c) => c.idMoldura || c.tipoItem === 'MARQUERIA'
                    ).length
                  }
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setModalTrazadoAbierto(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Cerrar Trazador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
