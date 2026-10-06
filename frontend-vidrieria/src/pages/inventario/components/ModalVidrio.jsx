import React, { useState, useEffect, useMemo } from 'react';
import * as inventarioService from '../../../services/inventario.service';

// Helper para normalizar márgenes
const normalizarMargenAString = (val, defecto = '30') => {
  if (val === undefined || val === null || val === '') return defecto;
  const num = parseFloat(val);
  if (isNaN(num)) return defecto;
  return num <= 1 && num > 0 ? String(Math.round(num * 100)) : String(Math.round(num));
};

export default function ModalVidrio({ isOpen, onClose, modoEdicion, itemToEdit, onSuccess, showToast }) {
  const [formVidrio, setFormVidrio] = useState({
    nombre: '',
    esTemplado: false,
    precioPlancha: '',
    anchoPlancha: '2.14',
    altoPlancha: '3.30',
    margenMayorista: '30',
    margenPublico: '50',
    margenCorteChico: '80',
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (modoEdicion && itemToEdit) {
      let anchoCalc = itemToEdit.anchoPlancha;
      let altoCalc = itemToEdit.altoPlancha;

      if (!anchoCalc && itemToEdit.anchoPlanchaMm) {
        const num = Number(itemToEdit.anchoPlanchaMm);
        anchoCalc = num < 10 ? String(num) : String((num / 1000).toFixed(2));
      }
      if (!altoCalc && itemToEdit.altoPlanchaMm) {
        const num = Number(itemToEdit.altoPlanchaMm);
        altoCalc = num < 10 ? String(num) : String((num / 1000).toFixed(2));
      }

      if (anchoCalc && Number(anchoCalc) >= 10) {
        anchoCalc = (Number(anchoCalc) / 1000).toFixed(2);
      }
      if (altoCalc && Number(altoCalc) >= 10) {
        altoCalc = (Number(altoCalc) / 1000).toFixed(2);
      }

      anchoCalc = anchoCalc || '2.14';
      altoCalc = altoCalc || '3.30';

      let precioPlanchaCalc = itemToEdit.precioPlancha;
      if (!precioPlanchaCalc && (itemToEdit.costoDefectoM2 || itemToEdit.costoRealM2)) {
        const costoM2 = itemToEdit.costoDefectoM2 || itemToEdit.costoRealM2;
        const area = Number(anchoCalc) * Number(altoCalc) || 7.062;
        precioPlanchaCalc = (costoM2 * area).toFixed(2);
      }

      setFormVidrio({
        nombre: itemToEdit.nombre || '',
        esTemplado: Boolean(itemToEdit.esTemplado),
        precioPlancha: precioPlanchaCalc !== undefined && precioPlanchaCalc !== null ? String(precioPlanchaCalc) : '',
        anchoPlancha: String(anchoCalc),
        altoPlancha: String(altoCalc),
        margenMayorista: normalizarMargenAString(itemToEdit.margenMayorista, '30'),
        margenPublico: normalizarMargenAString(itemToEdit.margenPublico, '50'),
        margenCorteChico: normalizarMargenAString(itemToEdit.margenCorteChico, '80'),
      });
    } else {
      setFormVidrio({
        nombre: '',
        esTemplado: false,
        precioPlancha: '',
        anchoPlancha: '2.14',
        altoPlancha: '3.30',
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
      const precioPlanchaNum = Number(parseFloat(formVidrio.precioPlancha) || 0);
      const anchoNum = Number(parseFloat(formVidrio.anchoPlancha) || 2.14);
      const altoNum = Number(parseFloat(formVidrio.altoPlancha) || 3.30);
      const mayNum = Number(((parseFloat(formVidrio.margenMayorista) || 0) / 100).toFixed(4));
      const pubNum = Number(((parseFloat(formVidrio.margenPublico) || 0) / 100).toFixed(4));
      const chicoNum = Number(((parseFloat(formVidrio.margenCorteChico) || 0) / 100).toFixed(4));

      const anchoPlanchaMm = anchoNum < 10 ? Math.round(anchoNum * 1000) : Math.round(anchoNum);
      const altoPlanchaMm = altoNum < 10 ? Math.round(altoNum * 1000) : Math.round(altoNum);
      const anchoPlanchaM = anchoNum < 10 ? anchoNum : Number((anchoNum / 1000).toFixed(3));
      const altoPlanchaM = altoNum < 10 ? altoNum : Number((altoNum / 1000).toFixed(3));

      const areaM2 = (anchoPlanchaMm * altoPlanchaMm) / 1_000_000;
      const costoM2 = areaM2 > 0 ? precioPlanchaNum / areaM2 : 0;
      const costoDefectoM2 = Number(costoM2.toFixed(2));
      const costoRealM2 = Number(costoM2.toFixed(2));

      const pmMayorista = Number((costoM2 * (1 + mayNum)).toFixed(2));
      const pmPublico = Number((costoM2 * (1 + pubNum)).toFixed(2));
      const pmChico = Number((costoM2 * (1 + chicoNum)).toFixed(2));
      const factorPie2 = 10.7639;
      const pmMayoristaPie2 = Number((pmMayorista / factorPie2).toFixed(2));
      const pmPublicoPie2 = Number((pmPublico / factorPie2).toFixed(2));
      const pmChicoPie2 = Number((pmChico / factorPie2).toFixed(2));

      const payload = {
        nombre: formVidrio.nombre.trim(),
        tipo: formVidrio.nombre.trim(),
        esTemplado: Boolean(formVidrio.esTemplado),
        precioPlancha: precioPlanchaNum,
        anchoPlancha: anchoPlanchaM,
        altoPlancha: altoPlanchaM,
        anchoPlanchaMm: Number(anchoPlanchaMm),
        altoPlanchaMm: Number(altoPlanchaMm),
        costoDefectoM2: Number(costoDefectoM2),
        costoRealM2: Number(costoRealM2),
        margenMayorista: Number(mayNum),
        margenPublico: Number(pubNum),
        margenCorteChico: Number(chicoNum),
        precioMayoristaM2: Number(pmMayorista),
        precioPublicoM2: Number(pmPublico),
        precioCorteChicoM2: Number(pmChico),
        precioMayoristaPie2: Number(pmMayoristaPie2),
        precioPublicoPie2: Number(pmPublicoPie2),
        precioCorteChicoPie2: Number(pmChicoPie2),
      };

      if (!modoEdicion) {
        await inventarioService.crearVidrio(payload);
        showToast(`Vidrio "${payload.nombre}" agregado correctamente.`);
      } else {
        const id = itemToEdit.idVidrio ?? itemToEdit.id;
        await inventarioService.actualizarVidrio(id, payload);
        showToast(`Vidrio "${payload.nombre}" actualizado con éxito.`);
      }

      onClose();
      onSuccess();
    } catch (err) {
      console.error('Error al guardar vidrio:', err);
      const msg = err.response?.data?.message || 'Ocurrió un error al procesar la solicitud.';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const simuladorVidrio = useMemo(() => {
    const precio = parseFloat(formVidrio.precioPlancha) || 0;
    const ancho = parseFloat(formVidrio.anchoPlancha) || 0;
    const alto = parseFloat(formVidrio.altoPlancha) || 0;
    const area = ancho * alto;
    const may = (parseFloat(formVidrio.margenMayorista) || 0) / 100;
    const pub = (parseFloat(formVidrio.margenPublico) || 0) / 100;
    const chico = (parseFloat(formVidrio.margenCorteChico) || 0) / 100;

    const costoM2 = area > 0 ? precio / area : 0;
    const factorPie2 = 10.7639;

    const pmMayorista = costoM2 * (1 + may);
    const pmPublico = costoM2 * (1 + pub);
    const pmChico = costoM2 * (1 + chico);

    return {
      area: area.toFixed(2),
      costoM2: costoM2.toFixed(2),
      precioMayoristaM2: pmMayorista.toFixed(2),
      precioPublicoM2: pmPublico.toFixed(2),
      precioCorteChicoM2: pmChico.toFixed(2),
      precioMayoristaPie2: (pmMayorista / factorPie2).toFixed(2),
      precioPublicoPie2: (pmPublico / factorPie2).toFixed(2),
      precioCorteChicoPie2: (pmChico / factorPie2).toFixed(2),
    };
  }, [formVidrio]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 transform animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">🪟</span>
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                {modoEdicion ? `Editar Vidrio: ${itemToEdit?.nombre || ''}` : 'Nuevo Tipo de Vidrio'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Actualiza los costos base y márgenes. Los precios en cotizaciones se recalcularán automáticamente.
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
                Nombre del Vidrio / Cristal *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Cristal Incoloro 3mm"
                value={formVidrio.nombre}
                onChange={(e) => setFormVidrio({ ...formVidrio, nombre: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Precio Plancha Completa (S/) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-medium">S/</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="Ej. 76.50"
                  value={formVidrio.precioPlancha}
                  onChange={(e) => setFormVidrio({ ...formVidrio, precioPlancha: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                id="esTempladoCheck"
                type="checkbox"
                checked={formVidrio.esTemplado}
                onChange={(e) => setFormVidrio({ ...formVidrio, esTemplado: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="esTempladoCheck" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                ¿Es Vidrio Templado?
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ancho Plancha (m) *
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                placeholder="2.14"
                value={formVidrio.anchoPlancha}
                onChange={(e) => setFormVidrio({ ...formVidrio, anchoPlancha: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Alto Plancha (m) *
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                placeholder="3.30"
                value={formVidrio.altoPlancha}
                onChange={(e) => setFormVidrio({ ...formVidrio, altoPlancha: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono"
              />
            </div>
          </div>

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
                    value={formVidrio.margenMayorista}
                    onChange={(e) => setFormVidrio({ ...formVidrio, margenMayorista: e.target.value })}
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
                    value={formVidrio.margenPublico}
                    onChange={(e) => setFormVidrio({ ...formVidrio, margenPublico: e.target.value })}
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
                    value={formVidrio.margenCorteChico}
                    onChange={(e) => setFormVidrio({ ...formVidrio, margenCorteChico: e.target.value })}
                    className="w-full pr-8 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                  />
                  <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs font-bold">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>⚡ Vista Previa de Precios m² y Pie²:</span>
              <span className="text-[11px] font-normal text-slate-500 lowercase">
                área: {simuladorVidrio.area} m² | costo: S/ {simuladorVidrio.costoM2}/m²
              </span>
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Mayorista</span>
                <span className="text-sm font-bold text-slate-800 font-mono">S/ {simuladorVidrio.precioMayoristaM2} /m²</span>
                <span className="text-[10px] text-slate-400 block font-mono">(S/ {simuladorVidrio.precioMayoristaPie2} /p²)</span>
              </div>
              <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-medium block">Público</span>
                <span className="text-sm font-extrabold text-emerald-700 font-mono">S/ {simuladorVidrio.precioPublicoM2} /m²</span>
                <span className="text-[10px] text-emerald-600 block font-mono">(S/ {simuladorVidrio.precioPublicoPie2} /p²)</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Corte Chico</span>
                <span className="text-sm font-bold text-slate-800 font-mono">S/ {simuladorVidrio.precioCorteChicoM2} /m²</span>
                <span className="text-[10px] text-slate-400 block font-mono">(S/ {simuladorVidrio.precioCorteChicoPie2} /p²)</span>
              </div>
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
                  <span>{modoEdicion ? 'Actualizar Vidrio' : 'Guardar Vidrio'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
