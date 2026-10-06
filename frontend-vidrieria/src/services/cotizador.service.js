import axiosClient from '../api/axiosClient';

export const calcularVidrioSuelto = async (payload) => {
  const res = await axiosClient.post('/api/v1/cotizador/vidrio-suelto', payload);
  return res.data;
};
