import React from 'react';
import DiagramaVanoSVG from '../../components/DiagramaVanoSVG';

export default function VistaImpresionObra({
  clienteNombre,
  clienteDoc,
  despiece,
  anchoVanoMm,
  altoVanoMm,
  tipoEstructura,
  colorAluminio,
  configuracionApertura,
  nombreCristalSeleccionado
}) {
  return (
    <div className="hidden print:block text-black bg-white p-4 space-y-6">
      {/* Cabecera Técnica de Impresión */}
      <div className="border-b-2 border-black pb-3 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">
            Orden de Fabricación y Hoja de Taller
          </h1>
          <p className="text-xs font-semibold text-slate-700">
            Vidriería y Marquería — Carpintería de Aluminio & Vidrio
          </p>
        </div>
        <div className="text-right text-xs">
          <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-PE')}</p>
          <p><strong>Cliente:</strong> {clienteNombre || 'Sin Registrar'}</p>
          {clienteDoc && <p><strong>DNI/RUC:</strong> {clienteDoc}</p>}
        </div>
      </div>

      {/* Resumen del Vano */}
      <div className="grid grid-cols-3 gap-2 border border-slate-300 p-2 text-xs">
        <div>
          <strong>Estructura:</strong> {despiece?.estructuraInfo?.nombre}
        </div>
        <div>
          <strong>Medidas Vano:</strong> {anchoVanoMm} × {altoVanoMm} mm ({(Number(anchoVanoMm || 0) / 10).toFixed(1)} × {(Number(altoVanoMm || 0) / 10).toFixed(1)} cm)
        </div>
        <div>
          <strong>Acabado Perfil:</strong> {despiece?.colorInfo?.nombre}
        </div>
      </div>

      {/* SVG acotado en impresión */}
      <div className="w-full max-w-lg mx-auto py-2">
        <DiagramaVanoSVG
          anchoMm={Number(anchoVanoMm) || 0}
          altoMm={Number(altoVanoMm) || 0}
          tipoEstructura={tipoEstructura}
          colorAluminio={colorAluminio}
          configuracionApertura={configuracionApertura}
          tipoCristalNombre={nombreCristalSeleccionado}
        />
      </div>

      {/* Tabla de Cortes de Perfiles */}
      <div>
        <h3 className="text-xs font-black uppercase border-b border-slate-400 pb-1 mb-2">
          1. Tabla de Corte de Perfiles de Aluminio
        </h3>
        <table className="w-full text-left text-xs border border-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="p-1.5">Pieza</th>
              <th className="p-1.5">Fórmula</th>
              <th className="p-1.5 text-center">Corte</th>
              <th className="p-1.5 text-center">Cant.</th>
              <th className="p-1.5 text-right font-black">Largo (mm)</th>
            </tr>
          </thead>
          <tbody>
            {despiece?.perfilesAluminio.map((p) => (
              <tr key={p.id} className="border-b border-slate-200">
                <td className="p-1.5 font-bold">{p.nombre}</td>
                <td className="p-1.5 font-mono">{p.formulaTexto}</td>
                <td className="p-1.5 text-center">{p.corte}</td>
                <td className="p-1.5 text-center font-bold">{p.cantidad}</td>
                <td className="p-1.5 text-right font-bold font-mono">{p.longitudMm} mm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tabla de Cortes de Vidrio */}
      <div>
        <h3 className="text-xs font-black uppercase border-b border-slate-400 pb-1 mb-2">
          2. Medidas de Vidrio para el Cortador
        </h3>
        <table className="w-full text-left text-xs border border-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="p-1.5">Paño</th>
              <th className="p-1.5">Tipo</th>
              <th className="p-1.5 text-center">Ancho (mm)</th>
              <th className="p-1.5 text-center">Alto (mm)</th>
              <th className="p-1.5 text-center">Medida (cm)</th>
              <th className="p-1.5 text-right">Cristal</th>
            </tr>
          </thead>
          <tbody>
            {despiece?.listaCristales.map((c) => (
              <tr key={c.id} className="border-b border-slate-200">
                <td className="p-1.5 font-bold">{c.etiqueta}</td>
                <td className="p-1.5">{c.tipo}</td>
                <td className="p-1.5 text-center font-mono font-bold">{c.anchoMm} mm</td>
                <td className="p-1.5 text-center font-mono font-bold">{c.altoMm} mm</td>
                <td className="p-1.5 text-center font-mono">{c.anchoCm} × {c.altoCm} cm</td>
                <td className="p-1.5 text-right">{nombreCristalSeleccionado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Firmas de Taller */}
      <div className="pt-10 grid grid-cols-2 gap-12 text-center text-xs">
        <div className="border-t border-black pt-2">
          <p className="font-bold">Firma Maestro Carpintero</p>
          <p className="text-[10px] text-slate-500">Corte y Habilitado de Aluminio</p>
        </div>
        <div className="border-t border-black pt-2">
          <p className="font-bold">Firma Maestro Vidriero</p>
          <p className="text-[10px] text-slate-500">Corte, Acristalado y Sellado</p>
        </div>
      </div>
    </div>
  );
}
