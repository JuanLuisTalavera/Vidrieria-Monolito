import axiosClient from '../api/axiosClient';

export const crearPedido = async (payload) => {
  const res = await axiosClient.post('/api/v1/pedidos', payload);
  return res.data;
};

export const obtenerPedidos = async (params) => {
  const res = await axiosClient.get('/api/v1/pedidos', { params });
  return res.data;
};

export const obtenerPedidosPaginados = async (page, sortDir, size = 20) => {
  const res = await axiosClient.get(`/api/v1/pedidos/paginados?page=${page}&size=${size}&sortDir=${sortDir}`);
  return res.data;
};

export const actualizarEstadoPedidoPatch = async (id, estado) => {
  const res = await axiosClient.patch(`/api/v1/pedidos/${id}/estado?estado=${estado}`);
  return res.data;
};

export const actualizarEstadoPedido = async (id, estado) => {
  const res = await axiosClient.put(`/api/v1/pedidos/${id}/estado`, { estado });
  return res.data;
};

export const eliminarPedido = async (id) => {
  const res = await axiosClient.delete(`/api/v1/pedidos/${id}`);
  return res.data;
};

export const obtenerPagosPedido = async (id) => {
  const res = await axiosClient.get(`/api/v1/pedidos/${id}/pagos`);
  return res.data;
};

export const registrarPagoPedido = async (id, payload) => {
  const res = await axiosClient.post(`/api/v1/pedidos/${id}/pagos`, payload);
  return res.data;
};

export const liquidarPedido = async (id) => {
  const res = await axiosClient.patch(`/api/v1/pedidos/${id}/liquidar`);
  return res.data;
};
