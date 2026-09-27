import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const PedidoContext = createContext(null);

const CLIENTE_INICIAL = {
  documento: '',
  tipoDocumento: 'DNI',
  nombre: '',
  telefono: '',
  direccion: '',
};

export function PedidoProvider({ children }) {
  // Carrito de compras unificado (cuadros de marquería y vidrios sueltos)
  const [carritoGlobal, setCarritoGlobal] = useState([]);

  // Datos globales del cliente para el pedido / comprobante
  const [datosCliente, setDatosClienteState] = useState(CLIENTE_INICIAL);

  // Agregar item al carrito asegurando un identificador único
  const agregarAlCarrito = useCallback((item) => {
    if (!item) return;
    const itemNormalizado = {
      ...item,
      id: item.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
    setCarritoGlobal((prev) => [...prev, itemNormalizado]);
  }, []);

  // Eliminar un item específico por su ID
  const eliminarDelCarrito = useCallback((id) => {
    setCarritoGlobal((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Vaciar completamente el carrito
  const vaciarCarrito = useCallback(() => {
    setCarritoGlobal([]);
  }, []);

  // Actualizar datos del cliente (acepta objeto parcial o función updater)
  const setDatosCliente = useCallback((datos) => {
    setDatosClienteState((prev) => {
      if (typeof datos === 'function') {
        return datos(prev);
      }
      if (typeof datos === 'object' && datos !== null) {
        return { ...prev, ...datos };
      }
      return prev;
    });
  }, []);

  // Limpiar / resetear datos del cliente
  const vaciarCliente = useCallback(() => {
    setDatosClienteState(CLIENTE_INICIAL);
  }, []);

  // Métricas acumuladas del carrito global
  const totalCarrito = useMemo(() => {
    return Math.ceil(
      carritoGlobal.reduce(
        (sum, item) => sum + Number(item.subtotal || item.precio || item.precioUnitario || 0),
        0
      )
    );
  }, [carritoGlobal]);

  const cantidadItems = useMemo(() => {
    return carritoGlobal.length;
  }, [carritoGlobal]);

  const totalPiezas = useMemo(() => {
    return carritoGlobal.reduce((sum, item) => sum + (Number(item.cantidad) || 1), 0);
  }, [carritoGlobal]);

  const value = {
    carritoGlobal,
    datosCliente,
    totalCarrito,
    cantidadItems,
    totalPiezas,
    agregarAlCarrito,
    eliminarDelCarrito,
    vaciarCarrito,
    setDatosCliente,
    vaciarCliente,
  };

  return <PedidoContext.Provider value={value}>{children}</PedidoContext.Provider>;
}

export function usePedido() {
  const context = useContext(PedidoContext);
  if (!context) {
    throw new Error('usePedido debe ser utilizado dentro de un PedidoProvider');
  }
  return context;
}
