import { useState, useEffect, useMemo } from 'react';
import axiosClient from '../api/axiosClient';

// Categorías oficiales de materiales en inventario
export const CATEGORIAS_MATERIAL = [
  { id: 'MOLDURA', label: 'Molduras / Cuadros', icon: '🪵', colorBadge: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'PERFIL_ALUMINIO', label: 'Perfiles de Aluminio', icon: '🪟', colorBadge: 'bg-sky-100 text-sky-800 border-sky-200' },
  { id: 'ACCESORIO', label: 'Accesorios / Herrajes', icon: '🔩', colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'OTROS', label: 'Otros Insumos', icon: '📦', colorBadge: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'PRODUCTO_ESTANDAR', label: 'Producto Estándar / Listo', icon: '🛍️', colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
];

export default function InventarioPage() {
  // Pestaña activa: 'molduras' (Materiales) | 'vidrios' (Planchas de Vidrio) | 'servicios' (Servicios y Manufactura)
  const [activeTab, setActiveTab] = useState('molduras');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');

  // Estados de datos
  const [molduras, setMolduras] = useState([]);
  const [vidrios, setVidrios] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Notificaciones feedback
  const [notificacion, setNotificacion] = useState(null);

  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario para Materiales (Molduras, Perfiles, Accesorios, Otros, Producto Estándar)
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

  // 1. Identificación de familia del material (Lineal vs Unitario)
  const form = {
    ...formMoldura,
    categoria: formMoldura.categoria || formMoldura.tipoMaterial || 'MOLDURA',
  };
  const esCategoriaLineal = form.categoria === 'MOLDURA' || form.categoria === 'PERFIL_ALUMINIO';

  // Formulario para Vidrios
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

  // Formulario para Servicios y Manufactura
  const [formServicio, setFormServicio] = useState({
    nombre: '',
    descripcion: '',
    tipoCobro: 'METRO_LINEAL',
    precio: '',
  });

  // Helper para dar formato y badge visual a tipos de cobro
  const formatTipoCobro = (tipo) => {
    if (!tipo) return { label: 'Por Unidad', unit: '/und', icon: '🔢', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
    const upper = String(tipo).toUpperCase();
    if (upper.includes('LINEAL') || upper === 'ML') {
      return { label: 'Metro Lineal (m)', unit: '/m', icon: '📏', badge: 'bg-sky-50 text-sky-700 border-sky-200' };
    }
    if (upper.includes('UNIDAD') || upper === 'UND' || upper === 'PIEZA') {
      return { label: 'Por Unidad / Pieza', unit: '/und', icon: '🔢', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (upper.includes('CUADRADO') || upper === 'M2') {
      return { label: 'Metro Cuadrado (m²)', unit: '/m²', icon: '📐', badge: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (upper.includes('GLOBAL') || upper.includes('FIJO')) {
      return { label: 'Servicio Global / Fijo', unit: '/serv', icon: '🌐', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: tipo, unit: '', icon: '⚙️', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  // Helper para normalizar márgenes al abrir modal
  const normalizarMargenAString = (val, defecto = '30') => {
    if (val === undefined || val === null || val === '') return defecto;
    const num = parseFloat(val);
    if (isNaN(num)) return defecto;
    return num <= 1 && num > 0 ? String(Math.round(num * 100)) : String(Math.round(num));
  };

  // Recarga individual de materiales / molduras
  const fetchMateriales = async () => {
    try {
      const res = await axiosClient.get('/api/v1/materiales');
      setMolduras(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al recargar materiales:', err);
    }
  };

  // Recarga individual de tipos de vidrio
  const fetchVidrios = async () => {
    try {
      const res = await axiosClient.get('/api/v1/vidrios');
      setVidrios(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al recargar vidrios:', err);
    }
  };

  // Recarga individual de servicios y manufactura
  const fetchServicios = async () => {
    try {
      const res = await axiosClient.get('/api/v1/servicios-extras');
      setServicios(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al recargar servicios:', err);
    }
  };

  // Carga de datos de la API
  const fetchInventario = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchMateriales(), fetchVidrios(), fetchServicios()]);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      setError('No se pudo conectar con el servidor para obtener los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancel = false;
    Promise.all([
      axiosClient.get('/api/v1/materiales'),
      axiosClient.get('/api/v1/vidrios'),
      axiosClient.get('/api/v1/servicios-extras').catch((err) => {
        console.warn('Endpoint /api/v1/servicios-extras pendiente o no disponible aún:', err);
        return { data: [] };
      }),
    ])
      .then(([resMolduras, resVidrios, resServicios]) => {
        if (!cancel) {
          setMolduras(Array.isArray(resMolduras.data) ? resMolduras.data : []);
          setVidrios(Array.isArray(resVidrios.data) ? resVidrios.data : []);
          setServicios(Array.isArray(resServicios?.data) ? resServicios.data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancel) {
          console.error('Error al cargar inventario:', err);
          setError('No se pudo conectar con el servidor para obtener los materiales.');
          setLoading(false);
        }
      });

    return () => {
      cancel = true;
    };
  }, []);

  const showToast = (mensaje, tipo = 'success') => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => {
      setNotificacion(null);
    }, 4000);
  };

  // Abrir Modal para Crear
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    if (activeTab === 'molduras') {
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
    } else if (activeTab === 'vidrios') {
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
    } else {
      setFormServicio({
        nombre: '',
        descripcion: '',
        tipoCobro: 'METRO_LINEAL',
        precio: '',
      });
    }
    setIsModalOpen(true);
  };

  // Abrir Modal para Editar
  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setEditingItem(item);

    if (activeTab === 'molduras') {
      const cat = item.tipoMaterial || item.categoria || 'MOLDURA';
      const esLineal = cat === 'MOLDURA' || cat === 'PERFIL_ALUMINIO';

      let precioCalculado = item.precioVarilla ?? item.costoVarilla;
      let mMay = item.margenMayorista;
      let mPub = item.margenPublico;
      let mChico = item.margenCorteChico;

      if (!esLineal) {
        // En categorías unitarias (PRODUCTO_ESTANDAR, ACCESORIO, OTROS) priorizar precio unitario de venta
        const precioUnit = item.precioPublicoUnitario ?? item.costoDefectoUnitario ?? item.precio ?? item.precioVarilla;
        precioCalculado = precioUnit !== undefined && precioUnit !== null ? String(precioUnit) : '';
      } else {
        if (!precioCalculado && item.precioPublicoVarilla) {
          precioCalculado = (item.precioPublicoVarilla / 1.5).toFixed(2);
        }
      }

      setFormMoldura({
        nombre: item.nombre || '',
        tipoMaterial: cat,
        categoria: cat,
        precioVarilla: precioCalculado !== undefined && precioCalculado !== null ? String(precioCalculado) : '',
        longitudVarilla: item.longitudVarilla ? String(item.longitudVarilla) : '240',
        margenMayorista: normalizarMargenAString(mMay, '30'),
        margenPublico: normalizarMargenAString(mPub, '50'),
        margenCorteChico: normalizarMargenAString(mChico, '80'),
      });
    } else if (activeTab === 'vidrios') {
      // Vidrio: resolver ancho y alto ya sea en metros o mm
      let anchoCalc = item.anchoPlancha;
      let altoCalc = item.altoPlancha;

      if (!anchoCalc && item.anchoPlanchaMm) {
        const num = Number(item.anchoPlanchaMm);
        anchoCalc = num < 10 ? String(num) : String((num / 1000).toFixed(2));
      }
      if (!altoCalc && item.altoPlanchaMm) {
        const num = Number(item.altoPlanchaMm);
        altoCalc = num < 10 ? String(num) : String((num / 1000).toFixed(2));
      }

      // Si viene expresado en milímetros (>= 10), convertir a metros para el input
      if (anchoCalc && Number(anchoCalc) >= 10) {
        anchoCalc = (Number(anchoCalc) / 1000).toFixed(2);
      }
      if (altoCalc && Number(altoCalc) >= 10) {
        altoCalc = (Number(altoCalc) / 1000).toFixed(2);
      }

      anchoCalc = anchoCalc || '2.14';
      altoCalc = altoCalc || '3.30';

      let precioPlanchaCalc = item.precioPlancha;
      if (!precioPlanchaCalc && (item.costoDefectoM2 || item.costoRealM2)) {
        const costoM2 = item.costoDefectoM2 || item.costoRealM2;
        const area = Number(anchoCalc) * Number(altoCalc) || 7.062;
        precioPlanchaCalc = (costoM2 * area).toFixed(2);
      }

      let mMay = item.margenMayorista;
      let mPub = item.margenPublico;
      let mChico = item.margenCorteChico;

      setFormVidrio({
        nombre: item.nombre || '',
        esTemplado: Boolean(item.esTemplado),
        precioPlancha: precioPlanchaCalc !== undefined && precioPlanchaCalc !== null ? String(precioPlanchaCalc) : '',
        anchoPlancha: String(anchoCalc),
        altoPlancha: String(altoCalc),
        margenMayorista: normalizarMargenAString(mMay, '30'),
        margenPublico: normalizarMargenAString(mPub, '50'),
        margenCorteChico: normalizarMargenAString(mChico, '80'),
      });
    } else {
      // activeTab === 'servicios'
      const precioCalculado = item.precio ?? item.precioSugerido ?? item.precioBase ?? '';
      setFormServicio({
        nombre: item.nombre || '',
        descripcion: item.descripcion || '',
        tipoCobro: item.tipoCobro || 'METRO_LINEAL',
        precio: precioCalculado !== undefined && precioCalculado !== null ? String(precioCalculado) : '',
      });
    }
    setIsModalOpen(true);
  };

  // Guardar (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (activeTab === 'molduras') {
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

        // 2. Saneamiento estricto del payload si el ítem es unitario
        if (!esCategoriaLineal) {
          payload.longitudVarilla = 0;
          payload.precioPublicoMetro = 0;
          payload.precioMayoristaMetro = 0;
          payload.precioCorteChicoMetro = 0;
          payload.precioPublicoVarilla = 0; // Si aplica según tu modelo
          payload.precioMayoristaVarilla = 0;
          payload.precioCorteChicoVarilla = 0;
          payload.costoDefectoUnitario = precioIngresado;
          payload.precioPublicoUnitario = precioIngresado;
        }

        if (modalMode === 'create') {
          const res = await axiosClient.post('/api/v1/materiales', payload);
          showToast(`Material "${payload.nombre}" agregado correctamente.`);
          if (res.data) {
            setMolduras((prev) => [...prev, res.data]);
          }
        } else {
          const id = editingItem.idMaterial ?? editingItem.id;
          const res = await axiosClient.put(`/api/v1/materiales/${id}`, payload);
          showToast(`Material "${payload.nombre}" actualizado con éxito.`);
          if (res.data) {
            setMolduras((prev) =>
              prev.map((m) => ((m.idMaterial ?? m.id) === id ? { ...m, ...res.data, ...payload } : m))
            );
          }
        }

        setIsModalOpen(false);
        await fetchMateriales();
      } else if (activeTab === 'vidrios') {
        // Vidrio
        const precioPlanchaNum = Number(parseFloat(formVidrio.precioPlancha) || 0);
        const anchoNum = Number(parseFloat(formVidrio.anchoPlancha) || 2.14);
        const altoNum = Number(parseFloat(formVidrio.altoPlancha) || 3.30);
        const mayNum = Number(((parseFloat(formVidrio.margenMayorista) || 0) / 100).toFixed(4));
        const pubNum = Number(((parseFloat(formVidrio.margenPublico) || 0) / 100).toFixed(4));
        const chicoNum = Number(((parseFloat(formVidrio.margenCorteChico) || 0) / 100).toFixed(4));

        // Dimensiones en mm y metros estrictamente numéricas
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

        if (modalMode === 'create') {
          const res = await axiosClient.post('/api/v1/vidrios', payload);
          showToast(`Vidrio "${payload.nombre}" agregado correctamente.`);
          if (res.data) {
            setVidrios((prev) => [...prev, res.data]);
          }
        } else {
          const id = editingItem.idVidrio ?? editingItem.id;
          const res = await axiosClient.put(`/api/v1/vidrios/${id}`, payload);
          showToast(`Vidrio "${payload.nombre}" actualizado con éxito.`);
          if (res.data) {
            setVidrios((prev) =>
              prev.map((v) => ((v.idVidrio ?? v.id) === id ? { ...v, ...res.data, ...payload } : v))
            );
          }
        }

        setIsModalOpen(false);
        await fetchVidrios();
      } else {
        // activeTab === 'servicios'
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

        if (modalMode === 'create') {
          const res = await axiosClient.post('/api/v1/servicios-extras', payload);
          showToast(`Servicio "${payload.nombre}" agregado correctamente.`);
          if (res.data) {
            setServicios((prev) => [...prev, res.data]);
          }
        } else {
          const id = editingItem.idServicioExtra ?? editingItem.idExtra ?? editingItem.id;
          const res = await axiosClient.put(`/api/v1/servicios-extras/${id}`, payload);
          showToast(`Servicio "${payload.nombre}" actualizado con éxito.`);
          // Actualización inmediata reactiva en el estado local tras HTTP 200
          setServicios((prev) =>
            prev.map((s) => {
              const sId = s.idServicioExtra ?? s.idExtra ?? s.id;
              return sId === id ? { ...s, ...(res.data || {}), ...payload } : s;
            })
          );
        }

        setIsModalOpen(false);
        await fetchServicios();
      }
    } catch (err) {
      console.error('Error al guardar material:', err);
      const msg = err.response?.data?.message || 'Ocurrió un error al procesar la solicitud.';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar material o servicio con confirmación
  const handleDelete = async (item) => {
    if (activeTab === 'servicios') {
      const id = item.idServicioExtra ?? item.idExtra ?? item.id;
      const nombre = item.nombre;
      const confirmacion = window.confirm(
        `¿Confirmas que deseas eliminar el servicio "${nombre}"?\nEsta acción lo dará de baja en el sistema.`
      );
      if (!confirmacion) return;

      try {
        await axiosClient.delete(`/api/v1/servicios-extras/${id}`);
        setServicios((prev) => prev.filter((s) => (s.idServicioExtra ?? s.idExtra ?? s.id) !== id));
        showToast(`Servicio "${nombre}" eliminado del catálogo.`);
      } catch (err) {
        console.error('Error al eliminar servicio:', err);
        showToast('No se pudo eliminar el servicio. Inténtalo nuevamente.', 'error');
      }
      return;
    }

    const esMoldura = activeTab === 'molduras';
    const id = esMoldura ? item.idMaterial : item.idVidrio;
    const nombre = item.nombre;

    const confirmacion = window.confirm(
      `¿Confirmas que deseas eliminar "${nombre}"?\nEsta acción lo dará de baja en el sistema y no aparecerá en nuevas cotizaciones.`
    );

    if (!confirmacion) return;

    try {
      const endpoint = esMoldura ? `/api/v1/materiales/${id}` : `/api/v1/vidrios/${id}`;
      await axiosClient.delete(endpoint);

      // Actualización reactiva inmediata en estado local
      if (esMoldura) {
        setMolduras((prev) => prev.filter((m) => m.idMaterial !== id));
      } else {
        setVidrios((prev) => prev.filter((v) => v.idVidrio !== id));
      }

      showToast(`"${nombre}" eliminado del inventario.`);
    } catch (err) {
      console.error('Error al eliminar material:', err);
      showToast('No se pudo eliminar el material. Inténtalo nuevamente.', 'error');
    }
  };

  // Cálculos en vivo para el simulador de precios dentro del modal
  const simuladorMoldura = useMemo(() => {
    const precio = parseFloat(formMoldura.precioVarilla) || 0;
    const longitud = parseFloat(formMoldura.longitudVarilla) || 240;
    const may = (parseFloat(formMoldura.margenMayorista) || 0) / 100;
    const pub = (parseFloat(formMoldura.margenPublico) || 0) / 100;
    const chico = (parseFloat(formMoldura.margenCorteChico) || 0) / 100;

    // Si longitud está en cm (> 10), costo por metro = precio / (longitud / 100)
    // En el backend calcula precioVarilla / longitudVarilla directo
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

  // Filtrado de listas por búsqueda y categoría
  const moldurasFiltradas = useMemo(() => {
    let lista = molduras;
    if (filtroCategoria !== 'TODOS') {
      lista = lista.filter((m) => {
        const cat = (m.tipoMaterial || '').toUpperCase();
        return cat === filtroCategoria || (filtroCategoria === 'MOLDURA' && cat.includes('MOLDURA'));
      });
    }
    if (!busqueda.trim()) return lista;
    const q = busqueda.toLowerCase();
    return lista.filter(
      (m) =>
        m.nombre?.toLowerCase().includes(q) ||
        m.tipoMaterial?.toLowerCase().includes(q)
    );
  }, [molduras, busqueda, filtroCategoria]);

  const vidriosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return vidrios;
    const q = busqueda.toLowerCase();
    return vidrios.filter(
      (v) =>
        v.nombre?.toLowerCase().includes(q) ||
        (v.esTemplado ? 'templado' : 'estandar simple').includes(q)
    );
  }, [vidrios, busqueda]);

  const serviciosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return servicios;
    const q = busqueda.toLowerCase();
    return servicios.filter(
      (s) =>
        s.nombre?.toLowerCase().includes(q) ||
        s.descripcion?.toLowerCase().includes(q) ||
        s.tipoCobro?.toLowerCase().includes(q)
    );
  }, [servicios, busqueda]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notificacion && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-top-4 duration-200 ${
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
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{notificacion.mensaje}</span>
          <button
            onClick={() => setNotificacion(null)}
            className="text-slate-400 hover:text-slate-600 ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100/80 text-emerald-700 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Administración de Inventario
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona los costos de compra, medidas y márgenes comerciales de molduras y vidrios en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchInventario(true)}
            disabled={loading}
            title="Refrescar catálogo"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition shadow-2xs disabled:opacity-50"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            id="btn-nuevo-material"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm hover:shadow transition focus:ring-2 focus:ring-emerald-500/30"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>
              {activeTab === 'molduras'
                ? 'Nueva Moldura'
                : activeTab === 'vidrios'
                ? 'Nuevo Vidrio'
                : 'Nuevo Servicio'}
            </span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Información Rápida */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Molduras Cuadros</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {molduras.filter((m) => (m.tipoMaterial || '').toUpperCase().includes('MOLDURA')).length}
            </p>
            <p className="text-[11px] text-slate-500">Madera y poliestireno</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-base">
            🪵
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Perfiles Aluminio</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {molduras.filter((m) => (m.tipoMaterial || '').toUpperCase().includes('PERFIL')).length}
            </p>
            <p className="text-[11px] text-slate-500">Serie 20, 25, mamparas</p>
          </div>
          <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center font-bold text-base">
            🪟
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Accesorios & Otros</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {molduras.filter((m) => {
                const t = (m.tipoMaterial || '').toUpperCase();
                return t.includes('ACCESORIO') || t.includes('OTROS');
              }).length}
            </p>
            <p className="text-[11px] text-slate-500">Herrajes, felpa y tornillos</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-base">
            🔩
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tipos de Vidrio</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{vidrios.length}</p>
            <p className="text-[11px] text-slate-500">Planchas y cristales</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-base">
            ✨
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Servicios / Manufactura</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{servicios.length}</p>
            <p className="text-[11px] text-slate-500">Pulido, biselado, huecos</p>
          </div>
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold text-base">
            ⚙️
          </div>
        </div>
      </div>

      {/* Control de Pestañas (Tabs) y Barra de Búsqueda */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl max-w-fit flex-wrap gap-1">
            <button
              id="tab-molduras"
              onClick={() => {
                setActiveTab('molduras');
                setBusqueda('');
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'molduras'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🪵 Materiales & Perfiles</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'molduras'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {molduras.length}
              </span>
            </button>

            <button
              id="tab-vidrios"
              onClick={() => {
                setActiveTab('vidrios');
                setBusqueda('');
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'vidrios'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🪟 Planchas de Vidrio</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'vidrios'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {vidrios.length}
              </span>
            </button>

            <button
              id="tab-servicios"
              onClick={() => {
                setActiveTab('servicios');
                setBusqueda('');
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'servicios'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>⚙️ Servicios y Manufactura</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'servicios'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {servicios.length}
              </span>
            </button>
          </div>

          {/* Búsqueda rápida */}
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={
                activeTab === 'molduras'
                  ? 'Buscar por nombre o categoría...'
                  : activeTab === 'vidrios'
                  ? 'Buscar tipo de vidrio...'
                  : 'Buscar servicio o manufactura...'
              }
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Barra de Filtros por Categoría para Materiales */}
        {activeTab === 'molduras' && (
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Categoría:
            </span>
            <button
              type="button"
              onClick={() => setFiltroCategoria('TODOS')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filtroCategoria === 'TODOS'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todos ({molduras.length})
            </button>
            {CATEGORIAS_MATERIAL.map((cat) => {
              const count = molduras.filter((m) => {
                const t = (m.tipoMaterial || '').toUpperCase();
                return t === cat.id || (cat.id === 'MOLDURA' && t.includes('MOLDURA'));
              }).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFiltroCategoria(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filtroCategoria === cat.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    filtroCategoria === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Estado de Carga */}
        {loading && (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Cargando catálogo de materiales...</p>
          </div>
        )}

        {/* Mensaje de Error */}
        {!loading && error && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-slate-800 font-semibold">{error}</p>
            <button
              onClick={() => fetchInventario(true)}
              className="mt-3 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* TABLA DE MOLDURAS */}
        {!loading && !error && activeTab === 'molduras' && (
          <div className="overflow-x-auto">
            {moldurasFiltradas.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-base font-medium">No se encontraron molduras</p>
                <p className="text-xs text-slate-400 mt-1">
                  {busqueda ? 'Prueba con otro término de búsqueda.' : 'Haz clic en "Nueva Moldura" para registrar la primera.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Moldura / Perfil</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Longitud</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Costo Metro</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Mayorista</th>
                    <th scope="col" className="px-4 py-3.5 text-right bg-emerald-50/40 text-emerald-800">Público (Venta)</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Corte Chico</th>
                    <th scope="col" className="px-5 py-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {moldurasFiltradas.map((m) => (
                    <tr key={m.idMaterial} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{m.nombre}</span>
                          {/* Badge de Categoría */}
                          {(() => {
                            const catUpper = (m.tipoMaterial || '').toUpperCase();
                            const catInfo = CATEGORIAS_MATERIAL.find((c) => c.id === catUpper) || {
                              label: m.tipoMaterial || 'MOLDURA',
                              colorBadge: 'bg-slate-100 text-slate-700 border-slate-200',
                              icon: '📦',
                            };
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${catInfo.colorBadge}`}>
                                <span>{catInfo.icon}</span>
                                <span>{catInfo.label.split(' ')[0]}</span>
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ID #{m.idMaterial} &bull; {m.tipoMaterial || 'MOLDURA'}
                        </div>
                      </td>
                      {(() => {
                        const catUpper = (m.tipoMaterial || m.categoria || '').toUpperCase();
                        const esLinealRow = catUpper === 'MOLDURA' || catUpper === 'PERFIL_ALUMINIO';
                        const precioUnitarioVal = Number(m.precioPublicoUnitario ?? m.costoDefectoUnitario ?? m.precioVarilla ?? m.precioPublicoVarilla ?? 0);

                        return (
                          <>
                            <td className="px-4 py-4 text-center">
                              {esLinealRow ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                  {m.longitudVarilla ? `${m.longitudVarilla} cm` : '240 cm'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  🔢 Unitario
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              {esLinealRow ? (
                                <span className="text-slate-500 font-mono text-xs">
                                  S/ {Number(m.costoRealMetro || 0).toFixed(2)} /m
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              {esLinealRow ? (
                                <>
                                  <div className="font-semibold text-slate-800 font-mono">
                                    S/ {Number(m.precioMayoristaVarilla || 0).toFixed(2)}
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono">
                                    S/ {Number(m.precioMayoristaMetro || 0).toFixed(2)}/m
                                  </div>
                                </>
                              ) : (
                                <span className="text-slate-400 text-xs italic">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right bg-emerald-50/30">
                              <div className="font-bold text-emerald-700 font-mono text-base">
                                S/ {esLinealRow ? Number(m.precioPublicoVarilla || 0).toFixed(2) : precioUnitarioVal.toFixed(2)}
                              </div>
                              <div className="text-xs text-emerald-600 font-mono">
                                {esLinealRow ? `S/ ${Number(m.precioPublicoMetro || 0).toFixed(2)}/m` : 'por unidad'}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              {esLinealRow ? (
                                <>
                                  <div className="font-medium text-slate-700 font-mono">
                                    S/ {Number(m.precioCorteChicoVarilla || 0).toFixed(2)}
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono">
                                    S/ {Number(m.precioCorteChicoMetro || 0).toFixed(2)}/m
                                  </div>
                                </>
                              ) : (
                                <span className="text-slate-400 text-xs italic">—</span>
                              )}
                            </td>
                          </>
                        );
                      })()}
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Editar moldura y precios"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(m)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar moldura"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TABLA DE VIDRIOS */}
        {!loading && !error && activeTab === 'vidrios' && (
          <div className="overflow-x-auto">
            {vidriosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-base font-medium">No se encontraron tipos de vidrio</p>
                <p className="text-xs text-slate-400 mt-1">
                  {busqueda ? 'Prueba con otro término de búsqueda.' : 'Haz clic en "Nuevo Vidrio" para registrar el primero.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Tipo de Vidrio</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Tipo</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Costo Base m²</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Mayorista</th>
                    <th scope="col" className="px-4 py-3.5 text-right bg-emerald-50/40 text-emerald-800">Público (Venta)</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Corte Chico</th>
                    <th scope="col" className="px-5 py-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {vidriosFiltrados.map((v) => (
                    <tr key={v.idVidrio} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{v.nombre}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ID #{v.idVidrio}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                            v.esTemplado
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {v.esTemplado ? 'Templado' : 'Estándar'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-slate-500 font-mono text-xs">
                          S/ {Number(v.costoRealM2 || 0).toFixed(2)} /m²
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-semibold text-slate-800 font-mono">
                          S/ {Number(v.precioMayoristaM2 || 0).toFixed(2)}/m²
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          S/ {Number(v.precioMayoristaPie2 || 0).toFixed(2)}/p²
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right bg-emerald-50/30">
                        <div className="font-bold text-emerald-700 font-mono text-base">
                          S/ {Number(v.precioPublicoM2 || 0).toFixed(2)}/m²
                        </div>
                        <div className="text-xs text-emerald-600 font-mono">
                          S/ {Number(v.precioPublicoPie2 || 0).toFixed(2)}/p²
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-medium text-slate-700 font-mono">
                          S/ {Number(v.precioCorteChicoM2 || 0).toFixed(2)}/m²
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          S/ {Number(v.precioCorteChicoPie2 || 0).toFixed(2)}/p²
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Editar vidrio y precios"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar vidrio"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TABLA DE SERVICIOS Y MANUFACTURA */}
        {!loading && !error && activeTab === 'servicios' && (
          <div className="overflow-x-auto">
            {serviciosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">
                  ⚙️
                </div>
                <p className="text-base font-semibold text-slate-700">No hay servicios o manufactura registrados</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {busqueda
                    ? 'No se encontraron servicios que coincidan con la búsqueda.'
                    : 'Crea tarifas de manufactura (pulido, biselado, huecos, instalación) para utilizarlas en cotizaciones y pedidos.'}
                </p>
                {!busqueda && (
                  <button
                    onClick={handleOpenCreate}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  >
                    <span>+ Agregar Primer Servicio</span>
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Servicio / Manufactura</th>
                    <th scope="col" className="px-5 py-3.5">Descripción</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Tipo de Cobro</th>
                    <th scope="col" className="px-5 py-3.5 text-right bg-emerald-50/40 text-emerald-800">
                      Precio Unitario
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {serviciosFiltrados.map((s) => {
                    const id = s.idServicioExtra ?? s.idExtra ?? s.id;
                    const precio = Number(s.precio ?? s.precioSugerido ?? s.precioBase ?? 0);
                    const cobroInfo = formatTipoCobro(s.tipoCobro);

                    return (
                      <tr key={id || s.nombre} className="hover:bg-slate-50/75 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-sm shrink-0">
                              {cobroInfo.icon}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-900">{s.nombre}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                ID #{id} &bull; {s.categoriaAplicable || 'MANUFACTURA'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-slate-600 max-w-md line-clamp-2 leading-relaxed">
                            {s.descripcion ? s.descripcion : <span className="text-slate-400 italic">Sin descripción</span>}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cobroInfo.badge}`}>
                            <span>{cobroInfo.icon}</span>
                            <span>{cobroInfo.label}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right bg-emerald-50/30">
                          <div className="font-extrabold text-emerald-700 font-mono text-base">
                            S/ {precio.toFixed(2)}
                          </div>
                          <div className="text-[11px] text-emerald-600/80 font-medium">
                            {cobroInfo.unit ? `por ${cobroInfo.unit.replace('/', '')}` : 'tarifa base'}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                              title="Editar precio y datos del servicio"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                              title="Eliminar servicio"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL FORMULARIO DINÁMICO (CREAR / EDITAR) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 transform animate-in fade-in zoom-in-95 duration-200">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  {activeTab === 'molduras' ? (esCategoriaLineal ? '🪵' : '🛍️') : activeTab === 'vidrios' ? '🪟' : '⚙️'}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {modalMode === 'create'
                      ? activeTab === 'molduras'
                        ? esCategoriaLineal
                          ? 'Nuevo Material / Perfil'
                          : 'Nuevo Producto / Accesorio'
                        : activeTab === 'vidrios'
                        ? 'Nuevo Tipo de Vidrio'
                        : 'Nuevo Servicio o Manufactura'
                      : activeTab === 'molduras'
                      ? esCategoriaLineal
                        ? `Editar Material: ${editingItem?.nombre || ''}`
                        : `Editar Producto: ${editingItem?.nombre || ''}`
                      : activeTab === 'vidrios'
                      ? `Editar Vidrio: ${editingItem?.nombre || ''}`
                      : `Editar Servicio: ${editingItem?.nombre || ''}`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeTab === 'servicios'
                      ? 'Configura el precio base y tipo de cobro para servicios de manufactura e instalación.'
                      : activeTab === 'molduras' && !esCategoriaLineal
                      ? 'Configura el precio unitario de venta. Este producto se venderá directamente sin corte lineal.'
                      : 'Actualiza los costos base y márgenes. Los precios en cotizaciones se recalcularán automáticamente.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {/* CAMPOS PARA MOLDURA / MATERIAL */}
              {activeTab === 'molduras' && (
                <>
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

                    {/* PRECIO UNITARIO O DE VARILLA (Siempre visible fuera de esCategoriaLineal) */}
                    <div className={esCategoriaLineal ? 'col-span-1' : 'sm:col-span-2'}>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        {esCategoriaLineal
                          ? 'Precio de Compra x Varilla (S/) *'
                          : 'Precio Público Unitario / Precio de Venta (S/) *'}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-medium">
                          S/
                        </span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required
                          placeholder={esCategoriaLineal ? 'Ej. 12.50' : 'Ej. 35.00'}
                          value={formMoldura.precioVarilla}
                          onChange={(e) => setFormMoldura({ ...formMoldura, precioVarilla: e.target.value })}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono font-medium"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {esCategoriaLineal
                          ? 'Costo que pagas al proveedor por la varilla entera.'
                          : 'Precio final de venta asignado a este producto o accesorio.'}
                      </span>
                    </div>

                    {/* CAMPOS EXCLUSIVOS DE VARILLAS (LINEALES): Envueltos en {esCategoriaLineal && ( ... )} */}
                    {esCategoriaLineal && (
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
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Estándar habitual: 240 cm (2.40 m) o 300 cm.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CAMPOS Y SIMULADOR EXCLUSIVOS DE CATEGORÍAS LINEALES */}
                  {esCategoriaLineal && (
                    <>
                      {/* Sección Márgenes */}
                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span>📊 Márgenes de Ganancia (%)</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Margen Mayorista (%)
                            </label>
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
                              <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs font-bold">
                                %
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Margen Público (%)
                            </label>
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
                              <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-emerald-600 text-xs font-bold">
                                %
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Margen Retazo/Chico (%)
                            </label>
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
                              <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs font-bold">
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Simulador de Precios en Vivo */}
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
                            <span className="text-sm font-bold text-slate-800 font-mono">
                              S/ {simuladorMoldura.precioMayoristaVarilla}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              (S/ {simuladorMoldura.precioMayoristaMetro}/m)
                            </span>
                          </div>
                          <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                            <span className="text-[11px] text-emerald-800 font-medium block">Público</span>
                            <span className="text-sm font-extrabold text-emerald-700 font-mono">
                              S/ {simuladorMoldura.precioPublicoVarilla}
                            </span>
                            <span className="text-[10px] text-emerald-600 block font-mono">
                              (S/ {simuladorMoldura.precioPublicoMetro}/m)
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[11px] text-slate-500 block">Corte Chico</span>
                            <span className="text-sm font-bold text-slate-800 font-mono">
                              S/ {simuladorMoldura.precioCorteChicoVarilla}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              (S/ {simuladorMoldura.precioCorteChicoMetro}/m)
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Resumen de Precio Unitario para Productos Estándar y Accesorios */}
                  {!esCategoriaLineal && (
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
                          🛍️
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Resumen de Precio de Venta
                          </p>
                          <p className="text-xs text-slate-500">
                            Artículo unitario sin dimensiones de corte lineal.
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-extrabold text-emerald-700 font-mono">
                          S/ {Number(parseFloat(formMoldura.precioVarilla) || 0).toFixed(2)}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-medium">
                          precio final por unidad
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* CAMPOS PARA VIDRIO */}
              {activeTab === 'vidrios' && (
                <>
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
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-medium">
                          S/
                        </span>
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

                  {/* Sección Márgenes */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span>📊 Márgenes de Ganancia (%)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Margen Mayorista (%)
                        </label>
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
                          <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs font-bold">
                            %
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Margen Público (%)
                        </label>
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
                          <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-emerald-600 text-xs font-bold">
                            %
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Margen Retazo/Chico (%)
                        </label>
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
                          <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs font-bold">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Simulador de Precios Vidrio */}
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
                        <span className="text-sm font-bold text-slate-800 font-mono">
                          S/ {simuladorVidrio.precioMayoristaM2} /m²
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          (S/ {simuladorVidrio.precioMayoristaPie2} /p²)
                        </span>
                      </div>
                      <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                        <span className="text-[11px] text-emerald-800 font-medium block">Público</span>
                        <span className="text-sm font-extrabold text-emerald-700 font-mono">
                          S/ {simuladorVidrio.precioPublicoM2} /m²
                        </span>
                        <span className="text-[10px] text-emerald-600 block font-mono">
                          (S/ {simuladorVidrio.precioPublicoPie2} /p²)
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Corte Chico</span>
                        <span className="text-sm font-bold text-slate-800 font-mono">
                          S/ {simuladorVidrio.precioCorteChicoM2} /m²
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          (S/ {simuladorVidrio.precioCorteChicoPie2} /p²)
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* CAMPOS PARA SERVICIOS Y MANUFACTURA */}
              {activeTab === 'servicios' && (
                <>
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
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-medium">
                            S/
                          </span>
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
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition resize-none"
                      />
                    </div>

                    {/* Vista Previa de la Tarifa */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-lg font-bold">
                          {formatTipoCobro(formServicio.tipoCobro).icon}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Resumen de Tarifa
                          </p>
                          <p className="text-xs text-slate-500">
                            Modalidad: <span className="font-semibold text-slate-700">{formatTipoCobro(formServicio.tipoCobro).label}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-extrabold text-emerald-700 font-mono">
                          S/ {Number(parseFloat(formServicio.precio) || 0).toFixed(2)}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-medium">
                          {formatTipoCobro(formServicio.tipoCobro).unit || 'por servicio'}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={guardando}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs hover:shadow transition disabled:opacity-50"
                >
                  {guardando && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>
                    {guardando
                      ? 'Guardando...'
                      : modalMode === 'create'
                      ? activeTab === 'servicios'
                        ? 'Crear Servicio'
                        : esCategoriaLineal
                        ? 'Crear Material'
                        : 'Crear Producto'
                      : 'Guardar Cambios'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
