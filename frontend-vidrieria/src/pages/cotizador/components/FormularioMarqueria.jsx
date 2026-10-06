import { useState, useEffect } from 'react';

/**
 * FormularioMarqueria — Subcomponente del Cotizador
 *
 * Encapsula toda la lógica y UI del formulario de "Cuadro a Medida" (marquería):
 * estados locales de dimensiones, selectores de material, cálculo en tiempo real
 * del subtotal y la acción de agregar al carrito.
 *
 * Props:
 *   - vidrios:          Array de vidrios disponibles del catálogo.
 *   - molduras:         Array de molduras/perfiles disponibles del catálogo.
 *   - tipoPrecio:       'publico' | 'mayorista' | 'corte_chico' — tarifa activa.
 *   - agregarAlCarrito: Función del contexto global PedidoContext.
 */
export default function FormularioMarqueria({ vidrios, molduras, tipoPrecio, agregarAlCarrito }) {
  // Estados locales exclusivos de la configuración del cuadro a medida
  const [ancho, setAncho] = useState(0);
  const [alto, setAlto] = useState(0);
  const [idVidrioSeleccionado, setIdVidrioSeleccionado] = useState('');
  const [idMolduraSeleccionada, setIdMolduraSeleccionada] = useState('');
  const [cobrarVarillaEntera, setCobrarVarillaEntera] = useState(false);
  const [descontarStock, setDescontarStock] = useState(true);
  const [costoArmado, setCostoArmado] = useState(5.00);
  const [total, setTotal] = useState(0); // Subtotal del cuadro actual en configuración

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

  // Acción: Agregar cuadro configurado al carrito
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
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      tipoItem: 'MARQUERIA',
      origen: 'MARQUERIA',
      ancho: anchoNum,
      alto: altoNum,
      anchoVano: anchoNum,
      altoVano: altoNum,
      cantidad: 1,
      idMoldura: idMolduraSeleccionada ? Number(idMolduraSeleccionada) : null,
      molduraNombre: moldura ? moldura.nombre : 'Sin Moldura',
      cobrarVarillaEntera: cobrarVarillaEntera,
      idVidrio: idVidrioSeleccionado ? Number(idVidrioSeleccionado) : null,
      vidrioNombre: vidrio ? vidrio.nombre : 'Sin Vidrio',
      costoArmado: Math.ceil(Number(costoArmado) || 0),
      subtotal: subtotalCuadro,
      precio: subtotalCuadro,
      precioUnitario: subtotalCuadro,
      descripcion: partesDescripcion.join(' | '),
      detallesDespiece: null,
      descontarStock: descontarStock,
    };

    agregarAlCarrito(nuevoCuadro);

    // Limpiar campos para ingresar el siguiente cuadro
    setAncho(0);
    setAlto(0);
    setIdMolduraSeleccionada('');
    setIdVidrioSeleccionado('');
    setCobrarVarillaEntera(false);
    setDescontarStock(true);
    setCostoArmado(5.00);
  };

  return (
    <>
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

          {/* Checkbox Descontar Stock */}
          <div className="mt-2.5 flex items-center gap-2">
            <input
              id="descontarStock"
              type="checkbox"
              checked={descontarStock}
              onChange={(e) => setDescontarStock(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="descontarStock" className="text-xs text-slate-700 font-medium select-none cursor-pointer flex items-center gap-1.5">
              <span>Descontar material del inventario</span>
            </label>
          </div>
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
    </>
  );
}
