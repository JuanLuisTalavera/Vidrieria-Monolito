import React, { useState, useEffect, useMemo } from 'react';
import * as inventarioService from '../../../services/inventario.service';

// Helper para normalizar márgenes
const normalizarMargenAString = (val, defecto = '30') => {
  if (val === undefined || val === null || val === '') return defecto;
  const num = parseFloat(val);
  if (isNaN(num)) return defecto;
  return num <= 1 && num > 0 ? String(Math.round(num * 100)) : String(Math.round(num));
};

export default function ModalMaterial({ isOpen, onClose, modoEdicion, itemToEdit, onSuccess, showToast }) {
  const [formMoldura, setFormMoldura] = useState({
    nombre: '',
    tipoMaterial: 'MOLDURA',
    categoria: 'MOLDURA',
    precioVarilla: '',
    longitudVarilla: '240',
    margenMayorista: '30',
    margenPublico: '50',
    margenCorteChico: '80',
  });
  const [guardando, setGuardando] = useState(false);

  const form = {
    ...formMoldura,
    categoria: formMoldura.categoria || formMoldura.tipoMaterial || 'MOLDURA',
  };
  const esCategoriaLineal = form.categoria === 'MOLDURA' || form.categoria === 'PERFIL_ALUMINIO';

  useEffect(() => {
    if (modoEdicion && itemToEdit) {
      const cat = itemToEdit.tipoMaterial || itemToEdit.categoria || 'MOLDURA';
      const esLineal = cat === 'MOLDURA' || cat === 'PERFIL_ALUMINIO';

      let precioCalculado = itemToEdit.precioVarilla ?? itemToEdit.costoVarilla;
      
      if (!esLineal) {
        const precioUnit = itemToEdit.precioPublicoUnitario ?? itemToEdit.costoDefectoUnitario ?? itemToEdit.precio ?? itemToEdit.precioVarilla;
        precioCalculado = precioUnit !== undefined && precioUnit !== null ? String(precioUnit) : '';
      } else {
        if (!precioCalculado && itemToEdit.precioPublicoVarilla) {
          precioCalculado = (itemToEdit.precioPublicoVarilla / 1.5).toFixed(2);
        }
      }

      setFormMoldura({
        nombre: itemToEdit.nombre || '',
        tipoMaterial: cat,
        categoria: cat,
        precioVarilla: precioCalculado !== undefined && precioCalculado !== null ? String(precioCalculado) : '',
        longitudVarilla: itemToEdit.longitudVarilla ? String(itemToEdit.longitudVarilla) : '240',
        margenMayorista: normalizarMargenAString(itemToEdit.margenMayorista, '30'),
        margenPublico: normalizarMargenAString(itemToEdit.margenPublico, '50'),
        margenCorteChico: normalizarMargenAString(itemToEdit.margenCorteChico, '80'),
      });
    } else {
      setFormMoldura({
        nombre: '',
        tipoMaterial: 'MOLDURA',
        categoria: 'MOLDURA',
        precioVarilla: '',
        longitudVarilla: '240',
        margenMayorista: '30',
        margenPublico: '50',
        margenCorteChico: '80',
      });
    }
  }, [modoEdicion, itemToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const cat = form.categoria || 'MOLDURA';
      const precioIngresado = Number(parseFloat(formMoldura.precioVarilla) || 0);
      const longitudNum = esCategoriaLineal ? Number(parseFloat(formMoldura.longitudVarilla) || 240) : 0;
      const mayNum = Number(((parseFloat(formMoldura.margenMayorista) || 0) / 100).toFixed(4));
      const pubNum = Number(((parseFloat(formMoldura.margenPublico) || 0) / 100).toFixed(4));
      const chicoNum = Number(((parseFloat(formMoldura.margenCorteChico) || 0) / 100).toFixed(4));

      const costoMetro = longitudNum > 0 ? (precioIngresado / longitudNum) * 100 : 0;
      const precioMayoristaVarilla = Number((precioIngresado * (1 + mayNum)).toFixed(2));
      const precioPublicoVarilla = Number((precioIngresado * (1 + pubNum)).toFixed(2));
      const precioCorteChicoVarilla = Number((precioIngresado * (1 + chicoNum)).toFixed(2));
      const precioMayoristaMetro = Number((costoMetro * (1 + mayNum)).toFixed(2));
      const precioPublicoMetro = Number((costoMetro * (1 + pubNum)).toFixed(2));
      const precioCorteChicoMetro = Number((costoMetro * (1 + chicoNum)).toFixed(2));

      const payload = {
        nombre: formMoldura.nombre.trim(),
        tipoMaterial: cat,
        categoria: cat,
        precioVarilla: precioIngresado,
        costoVarilla: precioIngresado,
        longitudVarilla: longitudNum,
        margenMayorista: mayNum,
        margenPublico: pubNum,
        margenCorteChico: chicoNum,
        precioMayoristaVarilla,
        precioPublicoVarilla,
        precioCorteChicoVarilla,
        precioMayoristaMetro,
        precioPublicoMetro,
        precioCorteChicoMetro,
        costoDefectoUnitario: precioIngresado,
        precioPublicoUnitario: precioIngresado,
      };

      if (!esCategoriaLineal) {
        payload.longitudVarilla = 0;
        payload.precioPublicoMetro = 0;
        payload.precioMayoristaMetro = 0;
        payload.precioCorteChicoMetro = 0;
        payload.precioPublicoVarilla = 0;
        payload.precioMayoristaVarilla = 0;
        payload.precioCorteChicoVarilla = 0;
        payload.costoDefectoUnitario = precioIngresado;
        payload.precioPublicoUnitario = precioIngresado;
      }

      if (!modoEdicion) {
        await inventarioService.crearMaterial(payload);
        showToast(`Material "${payload.nombre}" agregado correctamente.`);
      } else {
        const id = itemToEdit.idMaterial ?? itemToEdit.id;
        await inventarioService.actualizarMaterial(id, payload);
        showToast(`Material "${payload.nombre}" actualizado con éxito.`);
      }

      onClose();
      onSuccess();
    } catch (err) {
      console.error('Error al guardar material:', err);
      const msg = err.response?.data?.message || 'Ocurrió un error al procesar la solicitud.';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const simuladorMoldura = useMemo(() => {
    const precio = parseFloat(formMoldura.precioVarilla) || 0;
    const longitud = parseFloat(formMoldura.longitudVarilla) || 240;
    const may = (parseFloat(formMoldura.margenMayorista) || 0) / 100;
    const pub = (parseFloat(formMoldura.margenPublico) || 0) / 100;
    const chico = (parseFloat(formMoldura.margenCorteChico) || 0) / 100;

    const costoMetro = longitud > 0 ? precio / longitud : 0;

    return {
      costoMetro: costoMetro.toFixed(2),
      costoVarilla: precio.toFixed(2),
      precioMayoristaVarilla: (precio * (1 + may)).toFixed(2),
      precioPublicoVarilla: (precio * (1 + pub)).toFixed(2),
      precioCorteChicoVarilla: (precio * (1 + chico)).toFixed(2),
      precioMayoristaMetro: (costoMetro * (1 + may)).toFixed(2),
      precioPublicoMetro: (costoMetro * (1 + pub)).toFixed(2),
      precioCorteChicoMetro: (costoMetro * (1 + chico)).toFixed(2),
    };
  }, [formMoldura]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 transform animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              {esCategoriaLineal ? '🪵' : '🛍️'}
            </span>
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                {modoEdicion
                  ? esCategoriaLineal
                    ? `Editar Material: ${itemToEdit?.nombre || ''}`
                    : `Editar Producto: ${itemToEdit?.nombre || ''}`
                  : esCategoriaLineal
                  ? 'Nuevo Material / Perfil'
                  : 'Nuevo Producto / Accesorio'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {!esCategoriaLineal
                  ? 'Configura el precio unitario de venta. Este producto se venderá directamente sin corte lineal.'
                  : 'Actualiza los costos base y márgenes. Los precios en cotizaciones se recalcularán automáticamente.'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nombre del Material / Insumo *
              </label>
              <input
                type="text"
                required
                placeholder={
                  esCategoriaLineal
                    ? 'Ej. Riel Superior Serie 20, Moldura Dorada 2cm...'
                    : 'Ej. Espejo 60x80 con marco, Garrucha simple, Felpa...'
                }
                value={formMoldura.nombre}
                onChange={(e) => setFormMoldura({ ...formMoldura, nombre: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Categoría del Material *
              </label>
              <select
                value={form.categoria}
                onChange={(e) =>
                  setFormMoldura({
                    ...formMoldura,
                    tipoMaterial: e.target.value,
                    categoria: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition bg-white"
              >
                <option value="MOLDURA">🪵 MOLDURA (Molduras y marcos para cuadros)</option>
                <option value="PERFIL_ALUMINIO">🪟 PERFIL_ALUMINIO (Rieles, jambas, parantes para obras)</option>
                <option value="ACCESORIO">🔩 ACCESORIO (Herrajes, carretillas, felpa, seguros)</option>
                <option value="OTROS">📦 OTROS (Siliconas, empaques, insumos generales)</option>
                <option value="PRODUCTO_ESTANDAR">🛍️ PRODUCTO_ESTANDAR (Producto Estándar / Listo)</option>
              </select>
            </div>

            {esCategoriaLineal && (
              <>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Precio de Costo de Varilla Entera (S/) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-medium">S/</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="Ej. 12.50"
                      value={formMoldura.precioVarilla}
                      onChange={(e) => setFormMoldura({ ...formMoldura, precioVarilla: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono font-medium"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Costo que pagas al proveedor por la varilla entera.</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Longitud de Varilla (cm) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    placeholder="240"
                    value={formMoldura.longitudVarilla}
                    onChange={(e) => setFormMoldura({ ...formMoldura, longitudVarilla: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Estándar habitual: 240 cm (2.40 m) o 300 cm.</span>
                </div>
              </>
            )}

            {!esCategoriaLineal && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Precio Unitario (S/) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-medium">S/</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="Ej. 35.00"
                    value={formMoldura.precioVarilla}
                    onChange={(e) => setFormMoldura({ ...formMoldura, precioVarilla: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono font-medium"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Precio final de venta asignado a este producto o accesorio.</span>
              </div>
            )}
          </div>

          {esCategoriaLineal && (
            <>
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>📊 Márgenes de Ganancia (%)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Margen Mayorista (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        placeholder="30"
                        value={formMoldura.margenMayorista}
                        onChange={(e) => setFormMoldura({ ...formMoldura, margenMayorista: e.target.value })}
                        className="w-full pr-8 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                      />
                      <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Margen Público (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        placeholder="50"
                        value={formMoldura.margenPublico}
                        onChange={(e) => setFormMoldura({ ...formMoldura, margenPublico: e.target.value })}
                        className="w-full pr-8 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50/20 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono font-semibold"
                      />
                      <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-emerald-600 text-xs font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Margen Retazo/Chico (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        placeholder="80"
                        value={formMoldura.margenCorteChico}
                        onChange={(e) => setFormMoldura({ ...formMoldura, margenCorteChico: e.target.value })}
                        className="w-full pr-8 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                      />
                      <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs font-bold">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>⚡ Vista Previa de Precios de Venta:</span>
                  <span className="text-[11px] font-normal text-slate-500 lowercase">
                    costo metro: S/ {simuladorMoldura.costoMetro}
                  </span>
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Mayorista</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">S/ {simuladorMoldura.precioMayoristaVarilla}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">(S/ {simuladorMoldura.precioMayoristaMetro}/m)</span>
                  </div>
                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-[11px] text-emerald-800 font-medium block">Público</span>
                    <span className="text-sm font-extrabold text-emerald-700 font-mono">S/ {simuladorMoldura.precioPublicoVarilla}</span>
                    <span className="text-[10px] text-emerald-600 block font-mono">(S/ {simuladorMoldura.precioPublicoMetro}/m)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Corte Chico</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">S/ {simuladorMoldura.precioCorteChicoVarilla}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">(S/ {simuladorMoldura.precioCorteChicoMetro}/m)</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {!esCategoriaLineal && (
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">🛍️</span>
                <div>
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Resumen de Precio de Venta</p>
                  <p className="text-xs text-slate-500">Artículo unitario sin dimensiones de corte lineal.</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold text-emerald-700 font-mono">
                  S/ {Number(parseFloat(formMoldura.precioVarilla) || 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium">precio final por unidad</div>
              </div>
            </div>
          )}

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
                  <span>{modoEdicion ? (esCategoriaLineal ? 'Actualizar Material' : 'Actualizar Producto') : (esCategoriaLineal ? 'Guardar Material' : 'Guardar Producto')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
