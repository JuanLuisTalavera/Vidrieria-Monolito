import React, { useState, useEffect } from 'react';
import * as inventarioService from '../../../services/inventario.service';

export default function ModalServicio({ isOpen, onClose, modoEdicion, itemToEdit, onSuccess, showToast }) {
  const [formServicio, setFormServicio] = useState({
    nombre: '',
    descripcion: '',
    tipoCobro: 'METRO_LINEAL',
    precio: '',
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (modoEdicion && itemToEdit) {
      const precioCalculado = itemToEdit.precio ?? itemToEdit.precioSugerido ?? itemToEdit.precioBase ?? '';
      setFormServicio({
        nombre: itemToEdit.nombre || '',
        descripcion: itemToEdit.descripcion || '',
        tipoCobro: itemToEdit.tipoCobro || 'METRO_LINEAL',
        precio: precioCalculado !== undefined && precioCalculado !== null ? String(precioCalculado) : '',
      });
    } else {
      setFormServicio({
        nombre: '',
        descripcion: '',
        tipoCobro: 'METRO_LINEAL',
        precio: '',
      });
    }
  }, [modoEdicion, itemToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const precioNum = Number(parseFloat(formServicio.precio) || 0);
      const payload = {
        nombre: formServicio.nombre.trim(),
        descripcion: formServicio.descripcion ? formServicio.descripcion.trim() : '',
        tipoCobro: formServicio.tipoCobro,
        precio: precioNum,
        precioSugerido: precioNum,
        precioBase: precioNum,
        categoriaAplicable: 'MANUFACTURA',
        activo: true,
      };

      if (!modoEdicion) {
        await inventarioService.crearServicioExtra(payload);
        showToast(`Servicio "${payload.nombre}" agregado correctamente.`);
      } else {
        const id = itemToEdit.idServicioExtra ?? itemToEdit.idExtra ?? itemToEdit.id;
        await inventarioService.actualizarServicioExtra(id, payload);
        showToast(`Servicio "${payload.nombre}" actualizado con éxito.`);
      }

      onClose();
      onSuccess();
    } catch (err) {
      console.error('Error al guardar servicio:', err);
      const msg = err.response?.data?.message || 'Ocurrió un error al procesar la solicitud.';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 transform animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">⚙️</span>
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                {modoEdicion ? `Editar Servicio: ${itemToEdit?.nombre || ''}` : 'Nuevo Servicio o Manufactura'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configura el precio base y tipo de cobro para servicios de manufactura e instalación.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nombre del Servicio o Manufactura *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Pulido de Bordes, Biselado 1 pulgada, Hueco para Cerradura, Instalación..."
                value={formServicio.nombre}
                onChange={(e) => setFormServicio({ ...formServicio, nombre: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo de Cobro *
                </label>
                <select
                  value={formServicio.tipoCobro}
                  onChange={(e) => setFormServicio({ ...formServicio, tipoCobro: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition bg-white"
                >
                  <option value="METRO_LINEAL">📏 Metro Lineal (m) — Pulidos, biselados, cortes</option>
                  <option value="UNIDAD">🔢 Por Unidad / Pieza (und) — Huecos, perforaciones, saques</option>
                  <option value="METRO_CUADRADO">📐 Metro Cuadrado (m²) — Templado, arenado, laminado</option>
                  <option value="GLOBAL">🌐 Servicio Global / Fijo — Instalación, transporte, mano de obra</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Precio de Venta (S/) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-medium">S/</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="Ej. 15.00"
                    value={formServicio.precio}
                    onChange={(e) => setFormServicio({ ...formServicio, precio: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono font-medium"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Tarifa que se aplicará en cotizaciones y pedidos.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Descripción o Especificaciones
              </label>
              <textarea
                rows={3}
                placeholder="Detalles sobre el acabado, tolerancias, tiempo estimado o condiciones del servicio..."
                value={formServicio.descripcion}
                onChange={(e) => setFormServicio({ ...formServicio, descripcion: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          <div className="pt-5 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {guardando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{modoEdicion ? 'Actualizar Servicio' : 'Guardar Servicio'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
