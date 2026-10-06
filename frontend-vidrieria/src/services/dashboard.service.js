import axiosClient from '../api/axiosClient';

export const obtenerResumenDashboard = async (fecha) => {
  const url = fecha ? `/api/v1/dashboard/resumen?fecha=${encodeURIComponent(fecha)}` : '/api/v1/dashboard/resumen';
  const res = await axiosClient.get(url);
  return res.data;
};
