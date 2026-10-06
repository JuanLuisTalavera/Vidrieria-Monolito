import { useNavigate } from 'react-router-dom';

/**
 * CatalogoEstandar — Subcomponente del Cotizador
 *
 * Renderiza la cuadrícula de productos estándar (categoría PRODUCTO_ESTANDAR)
 * y expone la acción de "Agregar al Carrito" para cada producto.
 *
 * Props:
 *   - productosEstandar: Array de productos estándar disponibles en inventario.
 *   - agregarAlCarrito:  Función del contexto global PedidoContext para inyectar ítems al carrito.
 */
export default function CatalogoEstandar({ productosEstandar, agregarAlCarrito }) {
  const navigate = useNavigate();

  // Acción: Agregar producto estándar del catálogo al carrito
  const handleAgregarEstandar = (producto) => {
    if (!producto) return;

    const precio = Number(
      producto.precioPublicoUnitario ??
      producto.costoDefectoUnitario ??
      producto.precioVarilla ??
      0
    );

    const nuevoItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      tipoItem: 'ESTANDAR',
      origen: 'ESTANDAR',
      ancho: 0,
      alto: 0,
      anchoVano: 0,
      altoVano: 0,
      cantidad: 1,
      idMoldura: Number(producto.idMaterial),
      molduraNombre: producto.nombre,
      idVidrio: null,
      vidrioNombre: 'N/A',
      costoArmado: 0,
      subtotal: precio,
      precio: precio,
      precioUnitario: precio,
      descontarStock: true,
      descripcion: `Producto Estándar: ${producto.nombre}${producto.descripcion ? ` - ${producto.descripcion}` : ''}`,
      detallesDespiece: null,
    };

    agregarAlCarrito(nuevoItem);
  };

  return (
    <div className="space-y-4">
      {productosEstandar.length === 0 ? (
        <div className="p-12 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-300">
          <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl shadow-2xs">
              🛍️
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No hay productos estándar registrados
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Registra cuadros listos, espejos o productos estándar en la sección de Inventario seleccionando la categoría <strong className="text-emerald-700 font-semibold">"Producto Estándar / Listo"</strong> para tenerlos disponibles aquí en el Punto de Venta.
            </p>
            <button
              type="button"
              onClick={() => navigate('/inventario')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <span>📦 Ir al Inventario</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productosEstandar.map((prod) => {
            const precio = Number(
              prod.precioPublicoUnitario ??
              prod.costoDefectoUnitario ??
              prod.precioVarilla ??
              0
            );
            const stockDisponible = prod.stockActual ?? prod.stock ?? null;

            return (
              <div
                key={prod.idMaterial}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all p-4 flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      🛍️ Listo para entrega
                    </span>
                    {stockDisponible !== null && (
                      <span className="text-[10px] font-semibold text-slate-400">
                        Stock: {stockDisponible}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {prod.nombre}
                  </h4>

                  {prod.descripcion ? (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {prod.descripcion}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Producto terminado en almacén
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Precio</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      S/ {precio.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAgregarEstandar(prod)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-2xs transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
