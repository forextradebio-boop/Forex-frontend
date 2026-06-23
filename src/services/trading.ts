import api from '../api/axios';

export const getPositions = async () => {
  const res = await api.get('/trading/positions');
  return res.data;
};

export const getOrders = async () => {
  const res = await api.get('/trading/orders');
  return res.data;
};

export const createPosition = async (payload: any) => {
  const res = await api.post('/trading/positions', payload);
  return res.data;
};

export const createOrder = async (payload: any) => {
  const res = await api.post('/trading/orders', payload);
  return res.data;
};

export const closePosition = async (id: string) => {
  const res = await api.post(`/trading/positions/${id}/close`);
  return res.data;
};

export const cancelOrder = async (id: string) => {
  const res = await api.post(`/trading/orders/${id}/cancel`);
  return res.data;
};
