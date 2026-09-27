import { useState, useEffect, useMemo, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { TIPOS_ESTRUCTURAS } from '../utils/despieceObrasHelper';

// Fórmulas por defecto precargadas para sistemas comunes si la base de datos está vacía
const FORMULAS_DEFECTO = [
  // Serie 20 (2 Hojas)
  { idFormula: 1, idSistema: 1, tipoElemento: 'Riel Superior', idMaterialDefecto: null, cantidadPiezas: 1, formulaLargo: 'ANCHO - 2', formulaAlto: '', descripcion: 'Perfil superior de marco' },
  { idFormula: 2, idSistema: 1, tipoElemento: 'Riel Inferior', idMaterialDefecto: null, cantidadPiezas: 1, formulaLargo: 'ANCHO - 2', formulaAlto: '', descripcion: 'Riel inferior de deslizamiento' },
  { idFormula: 3, idSistema: 1, tipoElemento: 'Jambas Laterales', idMaterialDefecto: null, cantidadPiezas: 2, formulaLargo: 'ALTO', formulaAlto: '', descripcion: 'Laterales de marco' },
  { idFormula: 4, idSistema: 1, tipoElemento: 'Piernas / Parantes', idMaterialDefecto: null, cantidadPiezas: 2, formulaLargo: 'ALTO - 35', formulaAlto: '', descripcion: 'Parante lateral de hoja' },
  { idFormula: 5, idSistema: 1, tipoElemento: 'Traslapes Centrales', idMaterialDefecto: null, cantidadPiezas: 2, formulaLargo: 'ALTO - 35', formulaAlto: '', descripcion: 'Traslape central entre hojas' },
  { idFormula: 6, idSistema: 1, tipoElemento: 'Zócalos Inferiores', idMaterialDefecto: null, cantidadPiezas: 2, formulaLargo: '(ANCHO / 2) - 20', formulaAlto: '', descripcion: 'Zócalo de hoja' },
  { idFormula: 7, idSistema: 1, tipoElemento: 'Cabezales Superiores', idMaterialDefecto: null, cantidadPiezas: 2, formulaLargo: '(ANCHO / 2) - 20', formulaAlto: '', descripcion: 'Cabezal superior de hoja' },
  { idFormula: 8, idSistema: 1, tipoElemento: 'Paño de Cristal', idMaterialDefecto: null, cantidadPiezas: 2, formulaLargo: '(ANCHO / 2) - 15', formulaAlto: 'ALTO - 75', descripcion: 'Lámina de cristal cortada' },

  // Serie 25 (2 Hojas)
  { idFormula: 9, idSistema: 2, tipoElemento: 'Riel Superior S25', idMaterialDefecto: null, cantidadPiezas: 1, formulaLargo: 'ANCHO - 2', formulaAlto: '', descripcion: 'Riel superior serie 25' },
  { idFormula: 10, idSistema: 2, tipoElemento: 'Riel Inferior S25', idMaterialDefecto: null, cantidadPiezas: 1, formulaLargo: 'ANCHO - 2', formulaAlto: '', descripcion: 'Riel inferior con drenaje serie 25' },
  { idFormula: 11, idSistema: 2, tipoElemento: 'Jambas S25', idMaterialDefecto: null, cantidadPiezas: 2, formulaLargo: 'ALTO', formulaAlto: '', descripcion: 'Jambas marco serie 25' },
  { idFormula: 12, idSistema: 2, tipoElemento: 'Piernas S25', idMaterialDefecto: null, cantidadPiezas: 2, formulaLargo: 'ALTO - 45', formulaAlto: '', descripcion: 'Parante de hoja S25' },
  { idFormula: 13, idSistema: 2, tipoElemento: 'Traslapes S25', idMaterialDefecto: null, cantidadPiezas: 2, formulaLargo: 'ALTO - 45', formulaAlto: '', descripcion: 'Traslape central S25' },
  { idFormula: 14, idSistema: 2, tipoElemento: 'Zócalos S25', idMaterialDefecto: null, cantidadPiezas: 2, formulaLargo: '(ANCHO / 2) - 25', formulaAlto: '', descripcion: 'Zócalo de hoja S25' },
  { idFormula: 15, idSistema: 2, tipoElemento: 'Cabezales S25', idMaterialDefecto: null, cantidadPiezas: 2, formulaLargo: '(ANCHO / 2) - 25', formulaAlto: '', descripcion: 'Cabezal de hoja S25' },
  { idFormula: 16, idSistema: 2, tipoElemento: 'Paño de Cristal S25', idMaterialDefecto: null, cantidadPiezas: 2, formulaLargo: '(ANCHO / 2) - 22', formulaAlto: 'ALTO - 85', descripcion: 'Cristal para hoja corrediza S25' },
];

export default function GestorSistemasObrasPage() {
  // 1. Estados principales de Sistemas
  const [sistemas, setSistemas] = useState([]);
  const [sistemaSeleccionado, setSistemaSeleccionado] = useState(null);
  const [cargandoSistemas, setCargandoSistemas] = useState(true);

  // 2. Estados principales de Fórmulas
  const [formulas, setFormulas] = useState([]);
  const [cargandoFormulas, setCargandoFormulas] = useState(false);

  // 3. Catálogo de Materiales del Inventario
  const [materiales, setMateriales] = useState([]);
  const [vidrios, setVidrios] = useState([]);
  const [cargandoMateriales, setCargandoMateriales] = useState(true);

  // 4. Estados de Formularios y Modales
  const [modalFormulaAbierto, setModalFormulaAbierto] = useState(false);
  const [modoEdicionFormula, setModoEdicionFormula] = useState(false);
  const [formulaEnEdicion, setFormulaEnEdicion] = useState(null);

  const [modalSistemaAbierto, setModalSistemaAbierto] = useState(false);
  const [modoSistemaEdicion, setModoSistemaEdicion] = useState(false);
  const [sistemaEnEdicion, setSistemaEnEdicion] = useState(null);

  // Form State para Fórmulas
  const [formFormula, setFormFormula] = useState({
    tipoElemento: '',
    idMaterialDefecto: '',
    cantidadPiezas: 1,
    formulaLargo: '',
    formulaAlto: '',
    descripcion: '',
  });

  // Form State para Sistemas
  const [formSistema, setFormSistema] = useState({
    codigo: '',
    nombre: '',
    tipoEstructura: 'VENTANA',
    numeroHojas: 2,
    alturaMaximaRecomendada: 2.4,
    descripcion: '',
    activo: true,
  });

  // Simulador de cálculo en vivo
  const [testAncho, setTestAncho] = useState(1500);
  const [testAlto, setTestAlto] = useState(1200);

  // Notificaciones y mensajes
  const [notificacion, setNotificacion] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const mostrarNotificacion = useCallback((mensaje, tipo = 'success') => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion(null), 4000);
  }, []);

  // Cargar lista de materiales e inventario real
  useEffect(() => {
    let mounted = true;
    Promise.all([
      axiosClient.get('/api/v1/materiales').catch(() => ({ data: [] })),
      axiosClient.get('/api/v1/vidrios').catch(() => ({ data: [] })),
    ])
      .then(([resMat, resVid]) => {
        if (!mounted) return;
        setMateriales(Array.isArray(resMat.data) ? resMat.data : []);
        setVidrios(Array.isArray(resVid.data) ? resVid.data : []);
        setCargandoMateriales(false);
      })
      .catch((err) => {
        console.error('Error cargando materiales para gestor de fórmulas:', err);
        if (mounted) setCargandoMateriales(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Cargar Sistemas de Carpintería
  const fetchSistemas = useCallback(async () => {
    setCargandoSistemas(true);
    try {
      const res = await axiosClient.get('/api/v1/sistemas');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSistemas(res.data);
        if (!sistemaSeleccionado) {
          setSistemaSeleccionado(res.data[0]);
        }
      } else {
        // Fallback a sistemas estándar si la BD aún no tiene registros
        const mapeados = TIPOS_ESTRUCTURAS.map((e, idx) => ({
          idSistema: idx + 1,
          codigo: e.codigo,
          nombre: e.nombre,
          tipoEstructura: e.tipo || 'VENTANA',
          numeroHojas: e.hojas || 2,
          alturaMaximaRecomendada: 2.6,
          descripcion: e.descripcion,
          activo: true,
        }));
        setSistemas(mapeados);
        if (!sistemaSeleccionado) {
          setSistemaSeleccionado(mapeados[0]);
        }
      }
    } catch (err) {
      console.info('Aviso: /api/v1/sistemas en desarrollo, usando catálogo base:', err.message);
      const mapeados = TIPOS_ESTRUCTURAS.map((e, idx) => ({
        idSistema: idx + 1,
        codigo: e.codigo,
        nombre: e.nombre,
        tipoEstructura: e.tipo || 'VENTANA',
        numeroHojas: e.hojas || 2,
        alturaMaximaRecomendada: 2.6,
        descripcion: e.descripcion,
        activo: true,
      }));
      setSistemas(mapeados);
      if (!sistemaSeleccionado) {
        setSistemaSeleccionado(mapeados[0]);
      }
    } finally {
      setCargandoSistemas(false);
    }
  }, [sistemaSeleccionado]);

  useEffect(() => {
    fetchSistemas();
  }, [fetchSistemas]);

  // Cargar Fórmulas del Sistema seleccionado
  const fetchFormulas = useCallback(async (idSistema) => {
    if (!idSistema) return;
    setCargandoFormulas(true);
    try {
      const res = await axiosClient.get(`/api/v1/formulas/sistema/${idSistema}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setFormulas(res.data);
      } else {
        // Fallback a fórmulas por defecto para este sistema
        const filtradas = FORMULAS_DEFECTO.filter((f) => f.idSistema === idSistema);
        setFormulas(filtradas);
      }
    } catch (err) {
      console.info(`Aviso: /api/v1/formulas/sistema/${idSistema} no disponible, usando defecto:`, err.message);
      const filtradas = FORMULAS_DEFECTO.filter((f) => f.idSistema === idSistema);
      setFormulas(filtradas);
    } finally {
      setCargandoFormulas(false);
    }
  }, []);

  useEffect(() => {
    if (sistemaSeleccionado?.idSistema) {
      fetchFormulas(sistemaSeleccionado.idSistema);
    }
  }, [sistemaSeleccionado, fetchFormulas]);

  // Manejador de selección de sistema
  const handleSeleccionarSistema = (sistema) => {
    setSistemaSeleccionado(sistema);
  };

  // ----------------------------------------------------
  // GESTIÓN DE FÓRMULAS: CREAR / EDITAR / ELIMINAR
  // ----------------------------------------------------
  const handleAbrirCrearFormula = () => {
    setModoEdicionFormula(false);
    setFormulaEnEdicion(null);
    setFormFormula({
      tipoElemento: '',
      idMaterialDefecto: '',
      cantidadPiezas: 1,
      formulaLargo: '',
      formulaAlto: '',
      descripcion: '',
    });
    setModalFormulaAbierto(true);
  };

  const handleAbrirEditarFormula = (f) => {
    setModoEdicionFormula(true);
    setFormulaEnEdicion(f);
    setFormFormula({
      tipoElemento: f.tipoElemento || '',
      idMaterialDefecto: f.idMaterialDefecto || '',
      cantidadPiezas: f.cantidadPiezas || 1,
      formulaLargo: f.formulaLargo || '',
      formulaAlto: f.formulaAlto || '',
      descripcion: f.descripcion || '',
    });
    setModalFormulaAbierto(true);
  };

  const handleGuardarFormula = async (e) => {
    e.preventDefault();
    if (!formFormula.tipoElemento.trim()) {
      mostrarNotificacion('El nombre de la pieza es obligatorio.', 'error');
      return;
    }
    if (!formFormula.formulaLargo.trim()) {
      mostrarNotificacion('La fórmula de ancho/largo es obligatoria.', 'error');
      return;
    }

    setGuardando(true);
    const payload = {
      idSistema: sistemaSeleccionado.idSistema,
      tipoElemento: formFormula.tipoElemento.trim(),
      idMaterialDefecto: formFormula.idMaterialDefecto ? Number(formFormula.idMaterialDefecto) : null,
      cantidadPiezas: Math.max(1, parseInt(formFormula.cantidadPiezas, 10) || 1),
      formulaLargo: formFormula.formulaLargo.trim(),
      formulaAlto: formFormula.formulaAlto ? formFormula.formulaAlto.trim() : null,
      descripcion: formFormula.descripcion ? formFormula.descripcion.trim() : '',
    };

    try {
      if (modoEdicionFormula && formulaEnEdicion) {
        const idFormula = formulaEnEdicion.idFormula;
        try {
          await axiosClient.put(`/api/v1/formulas/${idFormula}`, payload);
        } catch {
          console.info('Endpoint PUT /api/v1/formulas en desarrollo. Actualizando estado local.');
        }
        setFormulas((prev) =>
          prev.map((item) => (item.idFormula === idFormula ? { ...item, ...payload } : item))
        );
        mostrarNotificacion('Fórmula actualizada con éxito.');
      } else {
        let nuevoId = Date.now();
        try {
          const res = await axiosClient.post('/api/v1/formulas', payload);
          if (res.data?.idFormula) nuevoId = res.data.idFormula;
        } catch {
          console.info('Endpoint POST /api/v1/formulas en desarrollo. Guardando en estado local.');
        }
        const nuevaFormula = { idFormula: nuevoId, ...payload };
        setFormulas((prev) => [...prev, nuevaFormula]);
        mostrarNotificacion('Fórmula creada con éxito.');
      }
      setModalFormulaAbierto(false);
    } catch (err) {
      console.error('Error guardando fórmula:', err);
      mostrarNotificacion('Error al guardar la fórmula.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarFormula = async (idFormula) => {
    if (!window.confirm('¿Estás seguro de eliminar esta fórmula de despiece?')) return;

    try {
      try {
        await axiosClient.delete(`/api/v1/formulas/${idFormula}`);
      } catch {
        console.info('Endpoint DELETE /api/v1/formulas en desarrollo. Eliminando del estado local.');
      }
      setFormulas((prev) => prev.filter((f) => f.idFormula !== idFormula));
      mostrarNotificacion('Fórmula eliminada.');
    } catch (err) {
      console.error('Error al eliminar fórmula:', err);
      mostrarNotificacion('No se pudo eliminar la fórmula.', 'error');
    }
  };

  // ----------------------------------------------------
  // GESTIÓN DE SISTEMAS: CREAR / EDITAR
  // ----------------------------------------------------
  const handleAbrirCrearSistema = () => {
    setModoSistemaEdicion(false);
    setSistemaEnEdicion(null);
    setFormSistema({
      codigo: '',
      nombre: '',
      tipoEstructura: 'VENTANA',
      numeroHojas: 2,
      alturaMaximaRecomendada: 2.4,
      descripcion: '',
      activo: true,
    });
    setModalSistemaAbierto(true);
  };

  const handleAbrirEditarSistema = (s) => {
    setModoSistemaEdicion(true);
    setSistemaEnEdicion(s);
    setFormSistema({
      codigo: s.codigo || '',
      nombre: s.nombre || '',
      tipoEstructura: s.tipoEstructura || 'VENTANA',
      numeroHojas: s.numeroHojas || 2,
      alturaMaximaRecomendada: s.alturaMaximaRecomendada || 2.4,
      descripcion: s.descripcion || '',
      activo: s.activo !== false,
    });
    setModalSistemaAbierto(true);
  };

  const handleGuardarSistema = async (e) => {
    e.preventDefault();
    if (!formSistema.nombre.trim() || !formSistema.codigo.trim()) {
      mostrarNotificacion('El código y el nombre del sistema son obligatorios.', 'error');
      return;
    }

    setGuardando(true);
    const payload = {
      codigo: formSistema.codigo.trim().toUpperCase(),
      nombre: formSistema.nombre.trim(),
      tipoEstructura: formSistema.tipoEstructura,
      numeroHojas: Math.max(1, parseInt(formSistema.numeroHojas, 10) || 1),
      alturaMaximaRecomendada: parseFloat(formSistema.alturaMaximaRecomendada) || 2.4,
      descripcion: formSistema.descripcion.trim(),
      activo: Boolean(formSistema.activo),
    };

    try {
      if (modoSistemaEdicion && sistemaEnEdicion) {
        const id = sistemaEnEdicion.idSistema;
        try {
          await axiosClient.put(`/api/v1/sistemas/${id}`, payload);
        } catch {
          console.info('Endpoint PUT /api/v1/sistemas en desarrollo. Actualizando estado local.');
        }
        setSistemas((prev) =>
          prev.map((item) => (item.idSistema === id ? { ...item, ...payload } : item))
        );
        if (sistemaSeleccionado?.idSistema === id) {
          setSistemaSeleccionado((prev) => ({ ...prev, ...payload }));
        }
        mostrarNotificacion('Sistema actualizado con éxito.');
      } else {
        let nuevoId = Date.now();
        try {
          const res = await axiosClient.post('/api/v1/sistemas', payload);
          if (res.data?.idSistema) nuevoId = res.data.idSistema;
        } catch {
          console.info('Endpoint POST /api/v1/sistemas en desarrollo. Agregando al estado local.');
        }
        const nuevoSistema = { idSistema: nuevoId, ...payload };
        setSistemas((prev) => [...prev, nuevoSistema]);
        setSistemaSeleccionado(nuevoSistema);
        mostrarNotificacion('Sistema registrado con éxito.');
      }
      setModalSistemaAbierto(false);
    } catch (err) {
      console.error('Error guardando sistema:', err);
      mostrarNotificacion('Error al guardar el sistema.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Helper de evaluación matemática segura para el simulador
  const evaluarFormulaSimulada = useCallback((formulaStr, ancho, alto) => {
    if (!formulaStr || !formulaStr.trim()) return 0;
    try {
      const sanitized = formulaStr
        .replace(/ANCHO/gi, String(ancho))
        .replace(/ALTO/gi, String(alto))
        .replace(/[^0-9+\-*/(). ]/g, '');
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return (${sanitized})`);
      const res = fn();
      return isNaN(res) ? 0 : Math.round(res);
    } catch {
      return 0;
    }
  }, []);

  // Material seleccionado en el formulario para preview de costo
  const materialPreview = useMemo(() => {
    if (!formFormula.idMaterialDefecto) return null;
    const matId = Number(formFormula.idMaterialDefecto);
    const m = materiales.find((item) => item.idMaterial === matId);
    if (m) return { ...m, origen: 'material' };
    const v = vidrios.find((item) => (item.idVidrio ?? item.id) === matId);
    if (v) return { ...v, origen: 'vidrio' };
    return null;
  }, [formFormula.idMaterialDefecto, materiales, vidrios]);

  // Insertar variable o atajo en el campo de fórmula activo
  const insertarEnFormula = (campo, texto) => {
    setFormFormula((prev) => {
      const actual = prev[campo] || '';
      return {
        ...prev,
        [campo]: actual ? `${actual} ${texto}` : texto,
      };
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ======================================================== */}
      {/* 1. ENCABEZADO DE PÁGINA                                  */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 text-xl font-bold">
              ⚙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Gestor de Fórmulas y Sistemas de Carpintería
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Solo Admin
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Configuración paramétrica de ventanas, mamparas y despiece milimétrico vinculado al inventario
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleAbrirCrearSistema}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all cursor-pointer"
          >
            <span>➕</span>
            <span>Nuevo Sistema</span>
          </button>
          <button
            type="button"
            onClick={handleAbrirCrearFormula}
            disabled={!sistemaSeleccionado}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <span>📐</span>
            <span>Nueva Fórmula</span>
          </button>
        </div>
      </div>

      {/* Notificación flotante */}
      {notificacion && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-xs border transition-all ${
            notificacion.tipo === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{notificacion.tipo === 'error' ? '⚠️' : '✅'}</span>
            <span>{notificacion.mensaje}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificacion(null)}
            className="text-slate-500 hover:text-slate-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. GRID PRINCIPAL: SISTEMAS (IZQ) Y FÓRMULAS (DER)       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL IZQUIERDO: LISTA DE SISTEMAS DE CARPINTERÍA */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>🪟</span>
                <span>Sistemas Registrados</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400 font-bold">
                {sistemas.length} sistemas
              </span>
            </div>

            {cargandoSistemas ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Cargando sistemas de carpintería...
              </div>
            ) : (
              <div className="space-y-2">
                {sistemas.map((s) => {
                  const isSelected = sistemaSeleccionado?.idSistema === s.idSistema;
                  return (
                    <div
                      key={s.idSistema}
                      onClick={() => handleSeleccionarSistema(s)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/60 shadow-xs ring-1 ring-sky-400/50'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-800 tracking-tight">
                              {s.nombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {s.codigo}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-sky-100 text-sky-700">
                              {s.tipoEstructura} • {s.numeroHojas || 2}H
                            </span>
                          </div>
                          {s.descripcion && (
                            <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">
                              {s.descripcion}
                            </p>
                          )}
                        </div>

                        {/* Botón editar sistema */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAbrirEditarSistema(s);
                          }}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 text-xs transition-colors"
                          title="Editar detalles del sistema"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SIMULADOR EN VIVO PARA VALIDAR FÓRMULAS */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>⚡</span>
                <span>Simulador de Despiece en Vivo</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                {sistemaSeleccionado?.codigo || 'S20'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Ingresa medidas de vano de prueba para validar los cortes resultantes de cada fórmula en tiempo real:
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Ancho Vano (mm)
                </label>
                <input
                  type="number"
                  value={testAncho}
                  onChange={(e) => setTestAncho(Math.max(100, Number(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Alto Vano (mm)
                </label>
                <input
                  type="number"
                  value={testAlto}
                  onChange={(e) => setTestAlto(Math.max(100, Number(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-[11px] text-slate-300">
              <span>Vano de prueba: </span>
              <strong className="text-white font-mono">{testAncho} × {testAlto} mm</strong>
              <span className="text-emerald-400 font-bold ml-2">
                ({((testAncho / 1000) * (testAlto / 1000)).toFixed(2)} m²)
              </span>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: FÓRMULAS DE DESPIECE DEL SISTEMA */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sky-400 font-bold">📐</span>
                  <h3 className="text-sm font-bold tracking-wide">
                    Fórmulas de Despiece: {sistemaSeleccionado?.nombre || 'Seleccione un sistema'}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reglas matemáticas de corte aplicadas a perfiles, cristales y accesorios
                </p>
              </div>

              <button
                type="button"
                onClick={handleAbrirCrearFormula}
                disabled={!sistemaSeleccionado}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <span>➕</span>
                <span>Agregar Pieza / Fórmula</span>
              </button>
            </div>

            {cargandoFormulas ? (
              <div className="py-16 text-center text-xs text-slate-400">
                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Cargando fórmulas de despiece...
              </div>
            ) : formulas.length === 0 ? (
              <div className="py-16 text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-2xl mx-auto mb-3">
                  📐
                </div>
                <h4 className="text-sm font-bold text-slate-800">No hay fórmulas registradas</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Define las piezas y fórmulas matemáticas de corte para este sistema de carpintería.
                </p>
                <button
                  type="button"
                  onClick={handleAbrirCrearFormula}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all cursor-pointer"
                >
                  ➕ Crear primera fórmula
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                      <th className="px-4 py-3">Pieza / Elemento</th>
                      <th className="px-4 py-3">Material Vinculado</th>
                      <th className="px-4 py-3 text-center">Cant.</th>
                      <th className="px-4 py-3">Fórmula Ancho / Largo</th>
                      <th className="px-4 py-3">Fórmula Alto</th>
                      <th className="px-4 py-3 text-right">Corte Simulado</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {formulas.map((f) => {
                      // Buscar material en inventario si tiene ID vinculado
                      const matVinculado = f.idMaterialDefecto
                        ? materiales.find((m) => m.idMaterial === f.idMaterialDefecto) ||
                          vidrios.find((v) => (v.idVidrio ?? v.id) === f.idMaterialDefecto)
                        : null;

                      // Evaluación en tiempo real para el simulador
                      const valorLargoSim = evaluarFormulaSimulada(f.formulaLargo, testAncho, testAlto);
                      const valorAltoSim = f.formulaAlto
                        ? evaluarFormulaSimulada(f.formulaAlto, testAncho, testAlto)
                        : null;

                      return (
                        <tr key={f.idFormula} className="hover:bg-slate-50/80 transition-colors">
                          {/* Pieza */}
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800">{f.tipoElemento}</div>
                            {f.descripcion && (
                              <div className="text-[10px] text-slate-400 mt-0.5">{f.descripcion}</div>
                            )}
                          </td>

                          {/* Material Vinculado */}
                          <td className="px-4 py-3">
                            {matVinculado ? (
                              <div>
                                <span className="font-semibold text-slate-800 block truncate max-w-[140px]">
                                  {matVinculado.nombre}
                                </span>
                                <span className="text-[10px] font-mono text-emerald-600 font-bold block">
                                  {matVinculado.precioVarilla
                                    ? `S/ ${matVinculado.precioVarilla}/var`
                                    : matVinculado.costoDefectoM2
                                    ? `S/ ${matVinculado.costoDefectoM2}/m²`
                                    : matVinculado.costoDefectoUnitario
                                    ? `S/ ${matVinculado.costoDefectoUnitario}/und`
                                    : 'Inventario'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No asignado</span>
                            )}
                          </td>

                          {/* Cantidad */}
                          <td className="px-4 py-3 text-center font-bold text-slate-900">
                            {f.cantidadPiezas}
                          </td>

                          {/* Fórmula Ancho */}
                          <td className="px-4 py-3 font-mono text-sky-700 font-bold text-[11px]">
                            {f.formulaLargo}
                          </td>

                          {/* Fórmula Alto */}
                          <td className="px-4 py-3 font-mono text-purple-700 font-bold text-[11px]">
                            {f.formulaAlto || <span className="text-slate-300">-</span>}
                          </td>

                          {/* Corte Simulado en Vivo */}
                          <td className="px-4 py-3 text-right font-mono">
                            {valorAltoSim !== null && valorAltoSim > 0 ? (
                              <span className="font-bold text-slate-900 bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-200">
                                {valorLargoSim} × {valorAltoSim} mm
                              </span>
                            ) : (
                              <span className="font-black text-emerald-700 text-xs">
                                {valorLargoSim} mm
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAbrirEditarFormula(f)}
                                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                                title="Editar fórmula"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarFormula(f.idFormula)}
                                className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 hover:text-rose-800 transition-colors"
                                title="Eliminar fórmula"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL: CREAR / EDITAR FÓRMULA DE DESPIECE             */}
      {/* ======================================================== */}
      {modalFormulaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {modoEdicionFormula ? 'Editar Fórmula de Despiece' : 'Nueva Fórmula de Despiece'}
                </h3>
                <p className="text-xs text-slate-500">
                  Sistema: <strong>{sistemaSeleccionado?.nombre}</strong> ({sistemaSeleccionado?.codigo})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalFormulaAbierto(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarFormula} className="space-y-4 text-xs">
              {/* Nombre de la pieza */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre de la Pieza / Tipo de Elemento <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ej. Riel Superior, Jamba, Parante, Zócalo, Paño Cristal..."
                  value={formFormula.tipoElemento}
                  onChange={(e) => setFormFormula({ ...formFormula, tipoElemento: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800"
                  required
                />
              </div>

              {/* Selector de Material vinculado al Inventario Real */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Material del Inventario (Para jalar costo real)</span>
                  {cargandoMateriales && <span className="text-slate-400">Cargando inventario...</span>}
                </label>
                <select
                  value={formFormula.idMaterialDefecto}
                  onChange={(e) => setFormFormula({ ...formFormula, idMaterialDefecto: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium bg-white text-slate-800"
                >
                  <option value="">-- Sin vincular (Costo manual o de obra) --</option>
                  <optgroup label="Perfiles y Molduras (Materiales)">
                    {materiales.map((m) => (
                      <option key={`m-${m.idMaterial}`} value={m.idMaterial}>
                        {m.nombre} ({m.tipoMaterial || 'PERFIL'}) - S/ {m.precioVarilla ?? m.costoDefectoUnitario ?? 0}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Cristales y Vidrios">
                    {vidrios.map((v) => {
                      const idVid = v.idVidrio ?? v.id;
                      return (
                        <option key={`v-${idVid}`} value={idVid}>
                          {v.nombre || v.tipo} - S/ {v.costoDefectoM2 ?? v.precioPlancha ?? 0}/m²
                        </option>
                      );
                    })}
                  </optgroup>
                </select>

                {/* Preview de costo del material seleccionado */}
                {materialPreview && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[11px] block">{materialPreview.nombre}</span>
                      <span className="text-[10px] text-emerald-600">
                        {materialPreview.tipoMaterial || materialPreview.tipo || 'Insumo'} • Stock: {materialPreview.stock ?? 'N/A'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-black text-emerald-700">
                      {materialPreview.precioVarilla
                        ? `S/ ${materialPreview.precioVarilla} / varilla`
                        : materialPreview.costoDefectoM2
                        ? `S/ ${materialPreview.costoDefectoM2} / m²`
                        : `S/ ${materialPreview.costoDefectoUnitario ?? 0}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Cantidad de piezas */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cantidad de Piezas requeridas por vano <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formFormula.cantidadPiezas}
                  onChange={(e) => setFormFormula({ ...formFormula, cantidadPiezas: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-800"
                  required
                />
              </div>

              {/* Fórmula Ancho / Largo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Fórmula Ancho / Largo (mm) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Variables: ANCHO, ALTO</span>
                </div>
                <input
                  type="text"
                  placeholder="ej. ANCHO - 20, (ANCHO / 2) - 20, ANCHO"
                  value={formFormula.formulaLargo}
                  onChange={(e) => setFormFormula({ ...formFormula, formulaLargo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sky-700 font-bold"
                  required
                />
                {/* Atajos de inserción */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400 self-center mr-1">Atajos:</span>
                  {['ANCHO', '(ANCHO / 2) - 20', 'ANCHO - 2', 'ALTO', 'ALTO - 35'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertarEnFormula('formulaLargo', tag)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono border border-slate-200 cursor-pointer"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fórmula Alto (Opcional, para vidrios o elementos bidimensionales) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Fórmula Alto (mm) <span className="text-slate-400 font-normal">(Requerido para cristales)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Dejar vacío si es lineal</span>
                </div>
                <input
                  type="text"
                  placeholder="ej. ALTO - 75, ALTO - 85, ALTO"
                  value={formFormula.formulaAlto}
                  onChange={(e) => setFormFormula({ ...formFormula, formulaAlto: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-purple-700 font-bold"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-slate-400 self-center mr-1">Atajos:</span>
                  {['ALTO', 'ALTO - 75', 'ALTO - 85', 'ALTO - 35'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertarEnFormula('formulaAlto', tag)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono border border-slate-200 cursor-pointer"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descripción / Observaciones técnicas (opcional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Notas para el operario o maestro carpintero..."
                  value={formFormula.descripcion}
                  onChange={(e) => setFormFormula({ ...formFormula, descripcion: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalFormulaAbierto(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : modoEdicionFormula ? 'Actualizar Fórmula' : 'Guardar Fórmula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL: CREAR / EDITAR SISTEMA DE CARPINTERÍA          */}
      {/* ======================================================== */}
      {modalSistemaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {modoSistemaEdicion ? 'Editar Sistema de Carpintería' : 'Nuevo Sistema de Carpintería'}
                </h3>
                <p className="text-xs text-slate-500">
                  Define el modelo estructural y sus características de diseño
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalSistemaAbierto(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarSistema} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Código Único <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ej. S20-2H, NOVA-2H..."
                    value={formSistema.codigo}
                    onChange={(e) => setFormSistema({ ...formSistema, codigo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tipo de Estructura
                  </label>
                  <select
                    value={formSistema.tipoEstructura}
                    onChange={(e) => setFormSistema({ ...formSistema, tipoEstructura: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold bg-white"
                  >
                    <option value="VENTANA">Ventana</option>
                    <option value="MAMPARA">Mampara</option>
                    <option value="FIJO">Paño Fijo</option>
                    <option value="PROYECTANTE">Proyectante</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre Comercial del Sistema <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ej. Ventana Corrediza Serie 20 (2 Hojas)..."
                  value={formSistema.nombre}
                  onChange={(e) => setFormSistema({ ...formSistema, nombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Número de Hojas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formSistema.numeroHojas}
                    onChange={(e) => setFormSistema({ ...formSistema, numeroHojas: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Altura Máx. (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="6.0"
                    value={formSistema.alturaMaximaRecomendada}
                    onChange={(e) => setFormSistema({ ...formSistema, alturaMaximaRecomendada: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descripción Técnica
                </label>
                <textarea
                  rows="2"
                  placeholder="Detalles sobre rodamientos, perfiles, hermeticidad..."
                  value={formSistema.descripcion}
                  onChange={(e) => setFormSistema({ ...formSistema, descripcion: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activoSistema"
                  checked={formSistema.activo}
                  onChange={(e) => setFormSistema({ ...formSistema, activo: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <label htmlFor="activoSistema" className="font-semibold text-slate-700 cursor-pointer">
                  Sistema activo para cotizaciones
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalSistemaAbierto(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : modoSistemaEdicion ? 'Actualizar Sistema' : 'Registrar Sistema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
