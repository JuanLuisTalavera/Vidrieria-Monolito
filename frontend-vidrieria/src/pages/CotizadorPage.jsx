import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function CotizadorPage() {
  const [searchParams] = useSearchParams();

  // 1. Datos del Cliente y CRM
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [clienteTipoDocumento, setClienteTipoDocumento] = useState('DNI');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [tipoPrecio, setTipoPrecio] = useState('publico');

  // Estados de Búsqueda y Feedback CRM
  const [esClienteNuevo, setEsClienteNuevo] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [estadoCliente, setEstadoCliente] = useState(null); // null | 'encontrado' | 'nuevo'
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [mensajeCRM, setMensajeCRM] = useState(null);

  // 2. Datos del Cuadro que se está configurando actualmente
  const [ancho, setAncho] = useState(0);
  const [alto, setAlto] = useState(0);
  const [vidrios, setVidrios] = useState([]);
  const [molduras, setMolduras] = useState([]);
  const [idVidrioSeleccionado, setIdVidrioSeleccionado] = useState('');
  const [idMolduraSeleccionada, setIdMolduraSeleccionada] = useState('');
  const [cobrarVarillaEntera, setCobrarVarillaEntera] = useState(false);
  const [costoArmado, setCostoArmado] = useState(5.00);
  const [total, setTotal] = useState(0); // Subtotal del cuadro actual en configuración

  // 3. Nuevo Estado del Carrito (Múltiples Cuadros)
  const [detalles, setDetalles] = useState([]);

  // 4. Datos de Liquidación y Pago Final
  const [montoAdelanto, setMontoAdelanto] = useState(0);
  const [tipoComprobante, setTipoComprobante] = useState('NOTA_VENTA');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');

  // Total acumulado sumando todos los cuadros agregados al carrito (redondeo al entero superior)
  const totalPedido = useMemo(() => {
    return Math.ceil(
      detalles.reduce(
        (sum, item) => sum + Number(item.subtotal || item.precioUnitario || 0),
        0
      )
    );
  }, [detalles]);

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

        setClienteNombre(nombreObtenido);
        setClienteTelefono(telefonoObtenido);
        setClienteDireccion(direccionObtenida);
        setClienteTipoDocumento(tipoObtenido);
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
      setClienteNombre('');
      setClienteTelefono('');
      setClienteDireccion('');
      setEsClienteNuevo(true);
      setEstadoCliente('nuevo');
      setMensajeCRM({
        texto: 'Cliente no encontrado, por favor ingrese los datos',
        tipo: 'nuevo',
      });
    } finally {
      setBuscandoCliente(false);
    }
  }, [clienteDocumento]);

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
    setClienteDocumento('');
    setClienteNombre('');
    setClienteTelefono('');
    setClienteDireccion('');
    setEsClienteNuevo(false);
    setEstadoCliente(null);
    setMensajeCRM(null);
  };

  // Carga inicial de catálogos (vidrios y molduras)
  useEffect(() => {
    let isMounted = true;

    const cargarCatalogos = async () => {
      try {
        const [resVidrios, resMateriales] = await Promise.all([
          axiosClient.get('/api/v1/vidrios'),
          axiosClient.get('/api/v1/materiales'),
        ]);
        if (isMounted) {
          setVidrios(Array.isArray(resVidrios.data) ? resVidrios.data : []);
          setMolduras(Array.isArray(resMateriales.data) ? resMateriales.data : []);
        }
      } catch (error) {
        console.error('Error al cargar catálogos (vidrios/materiales):', error);
      }
    };

    cargarCatalogos();

    return () => {
      isMounted = false;
    };
  }, []);

  // Función auxiliar para obtener el precio de un vidrio según la tarifa
  const getPrecioVidrioPorTarifa = (vidrio, tarifa) => {
    if (!vidrio) return 0;
    switch (tarifa) {
      case 'publico':
        return vidrio.precioPublicoM2 ?? vidrio.costoDefectoM2 ?? 0;
      case 'mayorista':
        return vidrio.precioMayoristaM2 ?? 0;
      case 'corte_chico':
        return vidrio.precioCorteChicoM2 ?? 0;
      default:
        return vidrio.precioPublicoM2 ?? 0;
    }
  };

  // Función auxiliar para obtener el precio por metro de una moldura según la tarifa
  const getPrecioMolduraMetroPorTarifa = (moldura, tarifa) => {
    if (!moldura) return 0;
    switch (tarifa) {
      case 'publico':
        return moldura.precioPublicoMetro ?? moldura.costoDefectoUnitario ?? 0;
      case 'mayorista':
        return moldura.precioMayoristaMetro ?? 0;
      case 'corte_chico':
        return moldura.precioCorteChicoMetro ?? 0;
      default:
        return moldura.precioPublicoMetro ?? 0;
    }
  };

  // Cálculo del total en tiempo real del cuadro actualmente en edición
  useEffect(() => {
    const vidrio = vidrios.find((v) => v.idVidrio === Number(idVidrioSeleccionado));
    const moldura = molduras.find((m) => m.idMaterial === Number(idMolduraSeleccionada));

    // 1. Cálculo de Vidrio
    let precioVidrioM2 = 0;
    if (vidrio) {
      switch (tipoPrecio) {
        case 'publico':
          precioVidrioM2 = vidrio.precioPublicoM2 ?? 0;
          break;
        case 'mayorista':
          precioVidrioM2 = vidrio.precioMayoristaM2 ?? 0;
          break;
        case 'corte_chico':
          precioVidrioM2 = vidrio.precioCorteChicoM2 ?? 0;
          break;
        default:
          precioVidrioM2 = vidrio.precioPublicoM2 ?? vidrio.costoDefectoM2 ?? 0;
          break;
      }
    }
    const area = (Number(ancho) * Number(alto)) / 10000;
    const costoTotalVidrio = area * precioVidrioM2;

    // 2. Cálculo de Moldura
    let costoTotalMoldura = 0;
    if (moldura) {
      let precioMetroSeleccionado = 0;
      let precioVarillaSeleccionado = 0;

      switch (tipoPrecio) {
        case 'publico':
          precioMetroSeleccionado = moldura.precioPublicoMetro ?? 0;
          precioVarillaSeleccionado = moldura.precioPublicoVarilla ?? 0;
          break;
        case 'mayorista':
          precioMetroSeleccionado = moldura.precioMayoristaMetro ?? 0;
          precioVarillaSeleccionado = moldura.precioMayoristaVarilla ?? 0;
          break;
        case 'corte_chico':
          precioMetroSeleccionado = moldura.precioCorteChicoMetro ?? 0;
          precioVarillaSeleccionado = moldura.precioCorteChicoVarilla ?? 0;
          break;
        default:
          precioMetroSeleccionado = moldura.precioPublicoMetro ?? moldura.costoDefectoUnitario ?? 0;
          precioVarillaSeleccionado = moldura.precioPublicoVarilla ?? 0;
          break;
      }

      const anchoM = Number(ancho) || 0;
      const altoM = Number(alto) || 0;
      const metrosNecesarios = (anchoM + altoM) * 2 * 1.10;

      if (cobrarVarillaEntera) {
        const longitudVarilla = Number(moldura.longitudVarilla) || 1;
        const cantidadVarillas = Math.ceil(metrosNecesarios / longitudVarilla);
        costoTotalMoldura = cantidadVarillas * precioVarillaSeleccionado;
      } else {
        costoTotalMoldura = metrosNecesarios * precioMetroSeleccionado;
      }
    }

    // 3. Suma total con Kit de Armado / Extras (redondeo al entero superior a favor del negocio)
    const totalCalculado = costoTotalVidrio + costoTotalMoldura + (Number(costoArmado) || 0);
    setTotal(Math.ceil(totalCalculado));
  }, [
    ancho,
    alto,
    idVidrioSeleccionado,
    idMolduraSeleccionada,
    vidrios,
    molduras,
    tipoPrecio,
    cobrarVarillaEntera,
    costoArmado,
  ]);

  // Acción 1: Agregar cuadro configurado al carrito
  const handleAgregarCuadro = (e) => {
    if (e) e.preventDefault();
    const anchoNum = Number(ancho) || 0;
    const altoNum = Number(alto) || 0;

    if (anchoNum <= 0 || altoNum <= 0) {
      alert('Por favor ingresa un ancho y alto válidos mayores a 0 cm.');
      return;
    }

    if (total <= 0) {
      alert('Por favor selecciona una moldura o tipo de vidrio para calcular el precio del cuadro.');
      return;
    }

    const vidrio = vidrios.find((v) => v.idVidrio === Number(idVidrioSeleccionado));
    const moldura = molduras.find((m) => m.idMaterial === Number(idMolduraSeleccionada));

    const tarifaEtiqueta = {
      publico: 'Público General',
      mayorista: 'Mayorista',
      corte_chico: 'Corte Chico',
    }[tipoPrecio] || tipoPrecio;

    const partesDescripcion = [
      `Cuadro ${anchoNum}x${altoNum} cm`,
      `Tarifa: ${tarifaEtiqueta}`,
      moldura
        ? `Moldura: ${moldura.nombre} (${cobrarVarillaEntera ? 'Varilla entera' : 'Al corte'})`
        : 'Sin Moldura',
      vidrio ? `Vidrio: ${vidrio.nombre}` : 'Sin Vidrio',
      Number(costoArmado) > 0 ? `Kit Armado: S/ ${Math.ceil(Number(costoArmado))}` : null,
    ].filter(Boolean);

    const subtotalCuadro = Math.ceil(total);

    const nuevoCuadro = {
      id: Date.now() + Math.random(),
      ancho: anchoNum,
      alto: altoNum,
      anchoVano: anchoNum,
      altoVano: altoNum,
      cantidad: 1,
      idMoldura: idMolduraSeleccionada,
      molduraNombre: moldura ? moldura.nombre : 'Sin Moldura',
      cobrarVarillaEntera: cobrarVarillaEntera,
      idVidrio: idVidrioSeleccionado,
      vidrioNombre: vidrio ? vidrio.nombre : 'Sin Vidrio',
      costoArmado: Math.ceil(Number(costoArmado) || 0),
      subtotal: subtotalCuadro,
      precioUnitario: subtotalCuadro,
      descripcion: partesDescripcion.join(' | '),
      detallesDespiece: null,
    };

    setDetalles((prev) => [...prev, nuevoCuadro]);

    // Limpiar campos para ingresar el siguiente cuadro
    setAncho(0);
    setAlto(0);
    setIdMolduraSeleccionada('');
    setIdVidrioSeleccionado('');
    setCobrarVarillaEntera(false);
    setCostoArmado(5.00);
  };

  // Acción 2: Eliminar un cuadro del carrito
  const handleEliminarCuadro = (id) => {
    setDetalles((prev) => prev.filter((item) => item.id !== id));
  };

  // Acción 3: Vaciar todos los cuadros del carrito
  const handleVaciarCarrito = () => {
    if (window.confirm('¿Deseas eliminar todos los cuadros agregados al pedido?')) {
      setDetalles([]);
    }
  };

  // Acción 4: Registrar la Venta Completa en el Backend
  const handleRegistrarVentaCompleta = async () => {
    if (detalles.length === 0) {
      alert('Debes agregar al menos un cuadro al pedido antes de registrar la venta.');
      return;
    }

    const adelantoNum = Number(montoAdelanto) || 0;
    const saldo = Math.max(0, Math.round((totalPedido - adelantoNum) * 100) / 100);

    const referencia =
      detalles.length === 1
        ? detalles[0].descripcion
        : `${detalles.length} Cuadros a medida`;

    const datosPedido = {
      clienteNombre: clienteNombre.trim() !== '' ? clienteNombre.trim() : 'Cliente en Mostrador',
      clienteTelefono: clienteTelefono.trim() !== '' ? clienteTelefono.trim() : 'Sin teléfono',
      clienteDocumento: clienteDocumento.trim() !== '' ? clienteDocumento.trim() : null,
      clienteDireccion: clienteDireccion.trim() !== '' ? clienteDireccion.trim() : null,
      referenciaObra: referencia,
      tipoTrabajo: 'MARQUERIA',
      total: totalPedido,
      montoAdelanto: adelantoNum,
      saldoPendiente: saldo,
      tipoComprobante: tipoComprobante,
      metodoPago: metodoPago,
      detalles: detalles.map((d) => ({
        descripcion: d.descripcion,
        anchoVano: d.anchoVano,
        altoVano: d.altoVano,
        cantidad: d.cantidad || 1,
        precioUnitario: d.precioUnitario,
        detallesDespiece: null,
      })),
    };

    try {
      await axiosClient.post('/api/v1/pedidos', datosPedido);
      alert(`¡Venta registrada exitosamente!\nTotal: S/ ${totalPedido.toFixed(0)} (${detalles.length} cuadros)`);

      // Limpiar pedido completo
      setDetalles([]);
      setMontoAdelanto(0);
      setTipoComprobante('NOTA_VENTA');
      setMetodoPago('EFECTIVO');
      handleLimpiarCliente();
    } catch (error) {
      alert('Error al registrar el pedido. Revisa la consola para más detalles.');
      console.error(error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* ============================================================ */}
      {/* ENCABEZADO PRINCIPAL                                         */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Punto de Venta &bull; Carrito Multiproducto
            </span>
            <span className="text-xs text-slate-400">Marquería y Vidriería</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Cotizador de Cuadros a Medida
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configura las medidas y materiales de cada cuadro, agrégalos a la lista y registra la venta completa con control de adelantos y caja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {detalles.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              🛒 {detalles.length} {detalles.length === 1 ? 'cuadro en carrito' : 'cuadros en carrito'}
            </span>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECCIÓN 1: FORMULARIO CONFIGURADOR DEL CUADRO                 */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
              📐
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                1. Configuración del Cuadro
              </h2>
              <p className="text-xs text-slate-400">
                Ingresa las dimensiones y selecciona la moldura, el vidrio y los acabados
              </p>
            </div>
          </div>

          {/* Selector de Tarifa */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
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
        </div>

        {/* Inputs de Medidas y Materiales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Ancho */}
          <div>
            <label htmlFor="ancho" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ancho (cm) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="ancho"
                type="number"
                step="any"
                min="0"
                value={ancho === 0 ? '' : ancho}
                onChange={(e) => setAncho(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ej. 40"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition"
              />
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                cm
              </span>
            </div>
          </div>

          {/* Alto */}
          <div>
            <label htmlFor="alto" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Alto (cm) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="alto"
                type="number"
                step="any"
                min="0"
                value={alto === 0 ? '' : alto}
                onChange={(e) => setAlto(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ej. 60"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition"
              />
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-medium text-slate-400 pointer-events-none">
                cm
              </span>
            </div>
          </div>

          {/* Kit de Armado / Extras */}
          <div>
            <label htmlFor="costoArmado" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kit de Armado / Extras (S/)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                S/
              </span>
              <input
                id="costoArmado"
                type="number"
                step="any"
                min="0"
                value={costoArmado}
                onChange={(e) => setCostoArmado(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="5.00"
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition"
              />
            </div>
          </div>

          {/* Moldura */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="moldura" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Moldura / Perfil
            </label>
            <select
              id="moldura"
              value={idMolduraSeleccionada}
              onChange={(e) => setIdMolduraSeleccionada(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition cursor-pointer"
            >
              <option value="">Seleccionar Moldura (o Sin Moldura)</option>
              {molduras.map((m) => (
                <option key={m.idMaterial} value={m.idMaterial}>
                  {m.nombre} &bull; S/ {getPrecioMolduraMetroPorTarifa(m, tipoPrecio)} /m
                </option>
              ))}
            </select>

            {/* Checkbox cobrar varilla entera */}
            <div className="mt-2.5 flex items-center gap-2">
              <input
                id="cobrarVarillaEntera"
                type="checkbox"
                checked={cobrarVarillaEntera}
                onChange={(e) => setCobrarVarillaEntera(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="cobrarVarillaEntera" className="text-xs text-slate-600 select-none cursor-pointer">
                Cobrar varilla(s) entera(s) (Cálculo exacto de desperdicio según longitud de fábrica)
              </label>
            </div>
          </div>

          {/* Tipo de Vidrio */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="vidrio" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo de Vidrio
            </label>
            <select
              id="vidrio"
              value={idVidrioSeleccionado}
              onChange={(e) => setIdVidrioSeleccionado(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition cursor-pointer"
            >
              <option value="">Seleccionar Vidrio (o Sin Vidrio)</option>
              {vidrios.map((v) => (
                <option key={v.idVidrio} value={v.idVidrio}>
                  {v.nombre} &bull; S/ {getPrecioVidrioPorTarifa(v, tipoPrecio)} /m²
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de Subtotal del Cuadro y Botón de Agregar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              <span>Medidas: </span>
              <strong className="text-slate-800 font-mono">
                {Number(ancho) || 0} x {Number(alto) || 0} cm
              </strong>
            </div>
            <span className="text-slate-300">&bull;</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold text-slate-600 uppercase">Subtotal del Cuadro:</span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono">
                S/ {total.toFixed(0)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAgregarCuadro}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-6 py-3 rounded-xl shadow-sm shadow-emerald-600/30 transition-all cursor-pointer text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Agregar Cuadro al Pedido</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECCIÓN 2: TABLA DEL CARRITO (CUADROS AGREGADOS AL PEDIDO)    */}
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
                  2. Cuadros en el Pedido
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  {detalles.length} {detalles.length === 1 ? 'cuadro' : 'cuadros'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Lista de ítems listos para fabricar. Puedes agregar más cuadros antes de cobrar.
              </p>
            </div>
          </div>

          {detalles.length > 0 && (
            <button
              type="button"
              onClick={handleVaciarCarrito}
              className="self-start sm:self-auto text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold cursor-pointer"
            >
              Vaciar lista
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5 w-12 text-center">#</th>
                <th className="px-5 py-3.5">Medidas</th>
                <th className="px-5 py-3.5">Moldura</th>
                <th className="px-5 py-3.5">Vidrio</th>
                <th className="px-5 py-3.5 text-right">Extras / Armado</th>
                <th className="px-5 py-3.5 text-right">Subtotal</th>
                <th className="px-5 py-3.5 text-center w-24">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detalles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <span className="text-3xl">🖼️</span>
                      <span className="font-bold text-slate-700">El carrito de cuadros está vacío</span>
                      <span className="text-xs text-slate-500">
                        Configura las medidas y materiales en el formulario de arriba y haz clic en <strong>"Agregar Cuadro al Pedido"</strong>.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                detalles.map((cuadro, idx) => (
                  <tr key={cuadro.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-500 text-xs">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-mono text-xs">
                        📏 {cuadro.ancho} x {cuadro.alto} cm
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      <div className="font-medium text-slate-800">{cuadro.molduraNombre}</div>
                      {cuadro.cobrarVarillaEntera && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Varilla entera
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      <span className="font-medium text-slate-800">{cuadro.vidrioNombre}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-600 text-xs">
                      S/ {Number(cuadro.costoArmado || 0).toFixed(0)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600 text-base whitespace-nowrap">
                      S/ {Number(cuadro.subtotal || 0).toFixed(0)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleEliminarCuadro(cuadro.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar este cuadro del pedido"
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen del Carrito */}
        {detalles.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <span className="text-slate-600 text-xs">
              Total de cuadros configurados: <strong>{detalles.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Total del Pedido ({detalles.length} ítems):
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
                {detalles.length} {detalles.length === 1 ? 'ítem' : 'ítems'}
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
                Suma total de los {detalles.length} cuadros agregados en el paso 2
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              disabled={detalles.length === 0}
              className={`w-full font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                detalles.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-98 text-white shadow-blue-500/25'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>
                {detalles.length === 0
                  ? 'Agrega cuadros para registrar venta'
                  : `Registrar Venta Completa (S/ ${totalPedido.toFixed(0)})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
