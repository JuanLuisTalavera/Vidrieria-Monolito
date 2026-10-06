import axiosClient from '../api/axiosClient';

export const obtenerClientes = async () => {
  const res = await axiosClient.get('/api/v1/clientes');
  return res.data;
};

export const buscarClientePorDocumento = async (doc) => {
  const res = await axiosClient.get(`/api/v1/clientes/buscar/documento/${encodeURIComponent(doc)}`);
  return res.data;
};

export const crearCliente = async (payload) => {
  const res = await axiosClient.post('/api/v1/clientes', payload);
  return res.data;
};

export const actualizarCliente = async (id, payload) => {
  const res = await axiosClient.put(`/api/v1/clientes/${id}`, payload);
  return res.data;
};

export const eliminarCliente = async (id) => {
  const res = await axiosClient.delete(`/api/v1/clientes/${id}`);
  return res.data;
};
