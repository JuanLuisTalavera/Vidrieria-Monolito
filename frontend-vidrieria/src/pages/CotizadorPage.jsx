import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { usePedido } from '../context/PedidoContext';
import { enviarComprobanteWhatsApp } from '../utils/whatsappHelper';
import TrazadoVarillasGrafico from './components/TrazadoVarillasGrafico';
import { calcularOptimizacionVarillas } from '../utils/optimizadorCorteHelper';
import FormularioMarqueria from './cotizador/components/FormularioMarqueria';
import FormularioVidrioSuelto from './cotizador/components/FormularioVidrioSuelto';
import CatalogoEstandar from './cotizador/components/CatalogoEstandar';
import PanelLiquidacionCaja from './cotizador/components/PanelLiquidacionCaja';
import {
  CheckCircle2,
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

  // Estados de Servicios Extras y carga de catálogo (compartidos con FormularioVidrioSuelto)
  const [serviciosExtras, setServiciosExtras] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);

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

    showToast('Agrega al menos un cristal al pedido para optimizar el trazado de corte', 'error');
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

        {/* Vista VIDRIO_SUELTO: Formulario de Vidrios Sueltos con Manufactura (Subcomponente) */}
        {modoIngreso === 'VIDRIO_SUELTO' && (
          <FormularioVidrioSuelto
            vidrios={vidrios}
            serviciosExtras={serviciosExtras}
            cargandoCatalogo={cargandoCatalogo}
            agregarAlCarrito={agregarAlCarrito}
            showToast={showToast}
          />
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
      <PanelLiquidacionCaja
        estadoCliente={estadoCliente}
        clienteNombre={clienteNombre}
        clienteDocumento={clienteDocumento}
        handleLimpiarCliente={handleLimpiarCliente}
        mensajeCRM={mensajeCRM}
        setMensajeCRM={setMensajeCRM}
        clienteTipoDocumento={clienteTipoDocumento}
        setClienteTipoDocumento={setClienteTipoDocumento}
        setClienteDocumento={setClienteDocumento}
        buscarCliente={buscarCliente}
        buscandoCliente={buscandoCliente}
        esClienteNuevo={esClienteNuevo}
        registrarClienteInline={registrarClienteInline}
        guardandoCliente={guardandoCliente}
        setClienteNombre={setClienteNombre}
        clienteTelefono={clienteTelefono}
        setClienteTelefono={setClienteTelefono}
        clienteDireccion={clienteDireccion}
        setClienteDireccion={setClienteDireccion}
        carritoGlobal={carritoGlobal}
        totalPedido={totalPedido}
        tipoComprobante={tipoComprobante}
        setTipoComprobante={setTipoComprobante}
        metodoPago={metodoPago}
        setMetodoPago={setMetodoPago}
        fechaEntrega={fechaEntrega}
        setFechaEntrega={setFechaEntrega}
        montoAdelanto={montoAdelanto}
        setMontoAdelanto={setMontoAdelanto}
        saldoPendiente={saldoPendiente}
        handleRegistrarVentaCompleta={handleRegistrarVentaCompleta}
      />

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
