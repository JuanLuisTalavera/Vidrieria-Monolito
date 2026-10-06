import axiosClient from '../api/axiosClient';

export const obtenerMateriales = async (categoria) => {
  const url = categoria ? `/api/v1/materiales?categoria=${encodeURIComponent(categoria)}` : '/api/v1/materiales';
  const res = await axiosClient.get(url);
  return res.data;
};

export const crearMaterial = async (payload) => {
  const res = await axiosClient.post('/api/v1/materiales', payload);
  return res.data;
};

export const actualizarMaterial = async (id, payload) => {
  const res = await axiosClient.put(`/api/v1/materiales/${id}`, payload);
  return res.data;
};

export const eliminarMaterial = async (id) => {
  const res = await axiosClient.delete(`/api/v1/materiales/${id}`);
  return res.data;
};

export const obtenerVidrios = async () => {
  const res = await axiosClient.get('/api/v1/vidrios');
  return res.data;
};

export const crearVidrio = async (payload) => {
  const res = await axiosClient.post('/api/v1/vidrios', payload);
  return res.data;
};

export const actualizarVidrio = async (id, payload) => {
  const res = await axiosClient.put(`/api/v1/vidrios/${id}`, payload);
  return res.data;
};

export const eliminarVidrio = async (id) => {
  const res = await axiosClient.delete(`/api/v1/vidrios/${id}`);
  return res.data;
};

export const obtenerServiciosExtras = async () => {
  const res = await axiosClient.get('/api/v1/servicios-extras');
  return res.data;
};

export const crearServicioExtra = async (payload) => {
  const res = await axiosClient.post('/api/v1/servicios-extras', payload);
  return res.data;
};

export const actualizarServicioExtra = async (id, payload) => {
  const res = await axiosClient.put(`/api/v1/servicios-extras/${id}`, payload);
  return res.data;
};

export const eliminarServicioExtra = async (id) => {
  const res = await axiosClient.delete(`/api/v1/servicios-extras/${id}`);
  return res.data;
};
